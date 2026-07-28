"""Catalogue d'outils — remplace les lectures Supabase faites dans les Server Components
Next.js (`src/app/[lang]/page.tsx` et `src/app/[lang]/tool/[id]/page.tsx`).

L'accès à la table passe par `services/tools_repository`, qui applique le filtre
de publication.
"""

from fastapi import APIRouter, Query, Request

from app.config import get_settings
from app.i18n import DEFAULT_LOCALE, normalize_locale
from app.rate_limit import limiter
from app.schemas import ToolConfig, ToolSummary
from app.services.tools_repository import (
    count_published_tools,
    get_published_tool,
    list_published_tools,
)
from app.services.translation import get_cached_translations, translate_tool_config

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("", response_model=list[ToolSummary])
@limiter.limit(get_settings().catalog_rate_limit)
def list_tools(request: Request, lang: str = Query(DEFAULT_LOCALE)) -> list[ToolSummary]:
    """Catalogue complet, avec les traductions déjà en cache si `lang` != fr.

    On n'appelle jamais le LLM ici : traduire 1000+ outils à la volée serait
    prohibitif. Les titres non traduits restent en français jusqu'à ce que la
    page de l'outil déclenche leur traduction.
    """
    lang = normalize_locale(lang)
    tools = list_published_tools()

    if lang != DEFAULT_LOCALE and tools:
        translations = get_cached_translations(lang)
        if translations:
            tools = [
                tool.model_copy(
                    update={
                        "title": translations[tool.id]["title"],
                        "category": translations[tool.id]["category"],
                    }
                )
                if tool.id in translations
                else tool
                for tool in tools
            ]

    return tools


# Déclaré avant `/{tool_id}` : FastAPI résout les routes dans l'ordre de déclaration
@router.get("/count")
@limiter.limit(get_settings().catalog_rate_limit)
def count_tools(request: Request) -> dict[str, int]:
    """Nombre d'outils publiés (utilisé par les pages login/signup)."""
    return {"count": count_published_tools()}


@router.get("/{tool_id}", response_model=ToolConfig)
@limiter.limit(get_settings().catalog_rate_limit)
def get_tool(request: Request, tool_id: str, lang: str = Query(DEFAULT_LOCALE)) -> ToolConfig:
    """Configuration complète d'un outil publié, traduite dans `lang` (avec cache)."""
    tool = get_published_tool(tool_id)
    return translate_tool_config(tool, normalize_locale(lang))
