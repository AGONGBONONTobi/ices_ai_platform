"""Exécution d'un outil via le LLM — portage de src/app/api/execute/route.ts."""

import json
import logging

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.deps import CurrentProfile
from app.schemas import ExecuteRequest, ExecuteResponse
from app.services.groq_client import get_groq
from app.services.prompt_builder import build_system_prompt, build_user_prompt
from app.services.supabase_client import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["execute"])


@router.post("/execute", response_model=ExecuteResponse)
def execute_tool(payload: ExecuteRequest, profile: CurrentProfile) -> ExecuteResponse:
    settings = get_settings()

    # --- Quota du plan gratuit ---
    if profile.plan == "free" and profile.tools_used_count >= settings.free_tier_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "QUOTA_EXCEEDED",
                "details": (
                    "Vous avez atteint votre limite d'utilisations gratuites. "
                    "Passez à la version PRO pour un accès illimité."
                ),
            },
        )

    tool = payload.toolConfig

    try:
        completion = get_groq().chat.completions.create(
            messages=[
                {"role": "system", "content": build_system_prompt(tool, payload.lang)},
                {"role": "user", "content": build_user_prompt(tool, payload.userInputs)},
            ],
            model=settings.groq_model,
            temperature=0.4,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )

        content = completion.choices[0].message.content
        if not content:
            raise ValueError("L'IA n'a pas retourné de résultat.")

        result = json.loads(content)
    except HTTPException:
        raise
    except Exception as error:  # noqa: BLE001
        logger.exception("Erreur API Execution")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Erreur lors de la génération IA", "details": str(error)},
        ) from error

    # --- Incrément du compteur pour les comptes gratuits ---
    if profile.plan == "free":
        try:
            get_supabase_admin().table("profiles").update(
                {"tools_used_count": profile.tools_used_count + 1}
            ).eq("id", profile.id).execute()
        except Exception:  # noqa: BLE001 — l'utilisateur a déjà son résultat
            logger.warning("Incrément du quota échoué pour %s", profile.id)

    return ExecuteResponse(result=result)
