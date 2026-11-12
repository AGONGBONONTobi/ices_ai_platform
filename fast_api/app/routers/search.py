"""Recherche assistée par IA dans le catalogue — cf. app/services/search.py.

Public (pas de compte requis) : c'est un outil de découverte, pas une exécution
qui consomme le quota payant. Limité en débit séparément de `/execute` car il
coûte deux appels LLM par recherche, contre un seul pour une exécution.
"""

from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.rate_limit import limiter
from app.schemas import SearchRequest, SearchResponse, SearchResultItem
from app.services.generation import GenerationError
from app.services.search import search_tools

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
@limiter.limit(get_settings().search_rate_limit)
def search(request: Request, payload: SearchRequest) -> SearchResponse:
    try:
        results = search_tools(payload.query)
    except GenerationError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "SEARCH_FAILED", "details": str(error)},
        ) from error

    return SearchResponse(
        results=[
            SearchResultItem(
                id=r.id,
                title=r.title,
                category=r.category,
                referentiel_code=r.referentiel_code,
                reason=r.reason,
                execution=r.execution,
            )
            for r in results
        ]
    )
