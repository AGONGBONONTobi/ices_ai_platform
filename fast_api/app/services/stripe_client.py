"""Client Stripe — portage de src/lib/stripe/index.ts."""

from functools import lru_cache

import stripe

from app.config import get_settings

API_VERSION = "2024-06-20"


@lru_cache
def get_stripe() -> "stripe":  # type: ignore[valid-type]
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key or "dummy_key_for_build"
    stripe.api_version = API_VERSION
    stripe.set_app_info("Plateforme IA", version="0.1.0")
    return stripe
