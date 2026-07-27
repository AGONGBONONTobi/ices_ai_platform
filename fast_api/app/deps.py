"""Dépendances FastAPI : authentification et chargement du profil.

Le frontend conserve Supabase Auth côté navigateur ; il transmet ici le jeton
d'accès via `Authorization: Bearer <access_token>`. Le backend le vérifie auprès
de Supabase, puis lit/écrit les profils avec la clé service role (bypass RLS).
"""

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas import Profile
from app.services.supabase_client import get_supabase_admin, get_supabase_anon

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    """Vérifie le jeton Supabase et retourne l'id de l'utilisateur."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non autorisé. Veuillez vous connecter.",
        )

    try:
        response = get_supabase_anon().auth.get_user(credentials.credentials)
    except Exception:  # noqa: BLE001 — jeton expiré, malformé, Supabase injoignable…
        logger.info("Échec de vérification du jeton d'accès")
        response = None

    user = getattr(response, "user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non autorisé. Veuillez vous connecter.",
        )

    return user.id


async def get_current_profile(
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> Profile:
    """Charge le profil de l'utilisateur authentifié."""
    response = (
        get_supabase_admin()
        .table("profiles")
        .select("*")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profil introuvable."
        )

    return Profile(**{k: v for k, v in response.data.items() if k in Profile.model_fields})


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
CurrentProfile = Annotated[Profile, Depends(get_current_profile)]
