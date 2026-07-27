"""Catalogue d'outils — remplace les lectures Supabase faites dans les Server Components
Next.js (`src/app/[lang]/page.tsx` et `src/app/[lang]/tool/[id]/page.tsx`)."""

from fastapi import APIRouter, HTTPException, Query, status

from app.i18n import DEFAULT_LOCALE, normalize_locale
from app.schemas import ToolConfig, ToolSummary
from app.services.supabase_client import get_supabase_anon
from app.services.translation import get_cached_translations, translate_tool_config

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("", response_model=list[ToolSummary])
def list_tools(lang: str = Query(DEFAULT_LOCALE)) -> list[ToolSummary]:
    """Catalogue complet, avec les traductions déjà en cache si `lang` != fr.

    On n'appelle jamais le LLM ici : traduire 1000+ outils à la volée serait
    prohibitif. Les titres non traduits restent en français jusqu'à ce que la
    page de l'outil déclenche leur traduction.
    """
    lang = normalize_locale(lang)

    response = (
        get_supabase_anon()
        .table("tools")
        .select("id, title, category")
        .order("category", desc=False)
        .execute()
    )
    tools = [ToolSummary(**row) for row in (response.data or [])]

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
def count_tools() -> dict[str, int]:
    """Nombre d'outils au catalogue (utilisé par les pages login/signup)."""
    response = (
        get_supabase_anon().table("tools").select("id", count="exact").limit(1).execute()
    )
    return {"count": response.count or 0}


@router.get("/{tool_id}", response_model=ToolConfig)
def get_tool(tool_id: str, lang: str = Query(DEFAULT_LOCALE)) -> ToolConfig:
    """Configuration complète d'un outil, traduite dans `lang` (avec cache)."""
    response = (
        get_supabase_anon()
        .table("tools")
        .select("config")
        .eq("id", tool_id)
        .maybe_single()
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outil introuvable.")

    tool = ToolConfig(**response.data["config"])
    return translate_tool_config(tool, normalize_locale(lang))
