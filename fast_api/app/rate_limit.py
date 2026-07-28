"""Limitation de débit.

Le quota du plan gratuit compte les exécutions réussies par compte ; il ne protège
pas contre l'abus (rafales, scripts). Ce garde-fou-ci est complémentaire et
s'applique avant toute dépense d'appel LLM.

La clé est le jeton d'accès quand il est présent (un utilisateur = une limite),
l'adresse IP sinon — plusieurs comptes derrière une même sortie NAT ne se
pénalisent donc pas mutuellement.
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings


def rate_limit_key(request: Request) -> str:
    authorization = request.headers.get("authorization", "")
    if authorization.lower().startswith("bearer "):
        return f"token:{authorization[7:]}"
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=rate_limit_key, enabled=get_settings().rate_limit_enabled)


def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Même forme d'erreur que le reste de l'API (`detail.error` exploitable côté client)."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": {
                "error": "RATE_LIMITED",
                "details": "Trop de requêtes. Merci de patienter quelques instants.",
            }
        },
    )
