"""Exécution d'un outil par le LLM.

Chaîne : quota → relecture de la fiche en base → validation des réponses →
génération contrainte par schéma (avec retries) → décompte du quota.

Le client n'envoie que l'identifiant de l'outil : la configuration — donc le
prompt — vient toujours de la base.
"""

import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.deps import CurrentProfile
from app.i18n import normalize_locale
from app.rate_limit import limiter
from app.schemas import ExecuteRequest, ExecuteResponse
from app.services.generation import GenerationError, generate_structured
from app.services.input_validator import InputValidationError, validate_inputs
from app.services.prompt_builder import build_system_prompt, build_user_prompt
from app.services.supabase_client import get_supabase_admin
from app.services.tools_repository import get_published_tool
from app.services.translation import translate_tool_config

logger = logging.getLogger(__name__)

router = APIRouter(tags=["execute"])


@router.post("/execute", response_model=ExecuteResponse)
@limiter.limit(get_settings().execute_rate_limit)
def execute_tool(
    request: Request,  # requis par slowapi pour identifier l'appelant
    payload: ExecuteRequest,
    profile: CurrentProfile,
) -> ExecuteResponse:
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

    # --- Source de vérité : la base, jamais le payload client ---
    tool = get_published_tool(payload.toolId)

    # L'utilisateur a rempli le formulaire tel qu'il lui a été servi, c'est-à-dire
    # traduit. On valide donc contre cette version-là, puis on repasse les valeurs
    # en langue source : le prompt, lui, reste celui de la fiche d'origine.
    shown = translate_tool_config(tool, normalize_locale(payload.lang))

    try:
        user_inputs = validate_inputs(shown, payload.userInputs, canonical=tool)
    except InputValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "INVALID_INPUTS", "details": str(error)},
        ) from error

    try:
        result = generate_structured(
            system_prompt=build_system_prompt(tool, payload.lang),
            user_prompt=build_user_prompt(tool, user_inputs),
            output_schema=tool.outputSchema,
        )
    except GenerationError as error:
        # Pas de résultat exploitable → le quota n'est pas décompté (cf. plus bas).
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "GENERATION_FAILED", "details": str(error)},
        ) from error

    # --- Décompte du quota : uniquement après un résultat validé ---
    if profile.plan == "free":
        try:
            get_supabase_admin().table("profiles").update(
                {"tools_used_count": profile.tools_used_count + 1}
            ).eq("id", profile.id).execute()
        except Exception:  # noqa: BLE001 — l'utilisateur a déjà son résultat
            logger.warning("Incrément du quota échoué pour %s", profile.id)

    return ExecuteResponse(result=result)
