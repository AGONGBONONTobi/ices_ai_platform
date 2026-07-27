"""Facturation Stripe — portage de src/app/api/stripe/{checkout,webhook}/route.ts."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Response, status

from app.config import get_settings
from app.deps import CurrentProfile
from app.schemas import CheckoutResponse
from app.services.stripe_client import get_stripe
from app.services.supabase_client import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stripe", tags=["stripe"])


def _period_end_iso(subscription) -> str | None:
    timestamp = subscription.get("current_period_end")
    if not timestamp:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout_session(profile: CurrentProfile) -> CheckoutResponse:
    """Crée une session Checkout et renvoie son URL (le frontend redirige)."""
    settings = get_settings()
    stripe = get_stripe()

    if not settings.stripe_pro_price_id:
        logger.warning("STRIPE_PRO_PRICE_ID n'est pas défini.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "stripe_not_configured"},
        )

    try:
        admin = get_supabase_admin()

        # Le stripe_customer_id est stocké sur le profil ; on le crée au besoin.
        stored = (
            admin.table("profiles")
            .select("stripe_customer_id")
            .eq("id", profile.id)
            .maybe_single()
            .execute()
        )
        customer_id = (stored.data or {}).get("stripe_customer_id") if stored else None

        if not customer_id:
            customer = stripe.Customer.create(
                email=profile.email,
                name=profile.full_name,
                metadata={"supabase_user_id": profile.id},
            )
            customer_id = customer.id
            admin.table("profiles").update({"stripe_customer_id": customer_id}).eq(
                "id", profile.id
            ).execute()

        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
            success_url=f"{settings.frontend_url}/fr?success=true",
            cancel_url=f"{settings.frontend_url}/fr/pricing?canceled=true",
            metadata={"supabase_user_id": profile.id},
        )
    except HTTPException:
        raise
    except Exception as error:  # noqa: BLE001
        logger.exception("Stripe Checkout Error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Error"
        ) from error

    return CheckoutResponse(url=session.url)


@router.post("/webhook")
async def stripe_webhook(request: Request) -> Response:
    settings = get_settings()
    stripe = get_stripe()

    body = await request.body()
    signature = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            body, signature, settings.stripe_webhook_secret
        )
    except Exception as error:  # noqa: BLE001 — signature invalide ou payload corrompu
        return Response(content=f"Webhook Error: {error}", status_code=400)

    # Admin obligatoire : le webhook n'a aucune session utilisateur, il doit bypasser RLS.
    admin = get_supabase_admin()
    event_type = event["type"]
    obj = event["data"]["object"]

    try:
        if event_type == "checkout.session.completed":
            if obj.get("subscription"):
                subscription = stripe.Subscription.retrieve(obj["subscription"])
                admin.table("profiles").update(
                    {
                        "plan": "pro",
                        "stripe_subscription_id": subscription["id"],
                        "stripe_price_id": subscription["items"]["data"][0]["price"]["id"],
                        "stripe_current_period_end": _period_end_iso(subscription),
                    }
                ).eq("stripe_customer_id", obj["customer"]).execute()

        elif event_type == "customer.subscription.updated":
            admin.table("profiles").update(
                {
                    "plan": "pro" if obj["status"] == "active" else "free",
                    "stripe_price_id": obj["items"]["data"][0]["price"]["id"],
                    "stripe_current_period_end": _period_end_iso(obj),
                }
            ).eq("stripe_subscription_id", obj["id"]).execute()

        elif event_type == "customer.subscription.deleted":
            admin.table("profiles").update(
                {
                    "plan": "free",
                    "stripe_subscription_id": None,
                    "stripe_price_id": None,
                    "stripe_current_period_end": None,
                }
            ).eq("stripe_subscription_id", obj["id"]).execute()

    except Exception:  # noqa: BLE001
        logger.exception("Webhook Supabase Error")
        return Response(content="Webhook handler failed", status_code=500)

    return Response(status_code=200)
