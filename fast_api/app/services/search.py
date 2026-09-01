"""Recherche assistée par IA dans le catalogue.

Le catalogue compte 1000+ outils répartis sur ~30 catégories : une recherche par
sous-chaîne ne suffit pas quand l'utilisateur décrit un besoin plutôt qu'un titre
("je dois vérifier ma conformité RGPD avant un appel d'offres").

Approche en deux étapes plutôt qu'un moteur d'embeddings :
1. router la requête vers 1 à 3 catégories parmi la trentaine existantes ;
2. choisir, parmi les titres de ces catégories seulement, les outils les plus
   pertinents.

Cela évite d'envoyer le catalogue entier à chaque recherche (coûteux, et risque
de dépasser la limite de tokens par minute du palier gratuit Groq — cf.
model_router.py) tout en gardant une seule dépendance (Groq, déjà configuré).
"""

import json
import logging

from app.config import get_settings
from app.services.generation import GenerationError, generate_structured
from app.services.tools_repository import list_published_tools

logger = logging.getLogger(__name__)

MAX_RESULTS = 3

# Le palier gratuit Groq plafonne à 6000 tokens/minute (cf. model_router.py) :
# une catégorie volumineuse (jusqu'à ~90 outils) suffit à le dépasser à elle
# seule. On borne donc les candidats envoyés à l'étape 2, quel que soit le
# nombre de catégories retenues à l'étape 1.
MAX_CANDIDATES = 50

CATEGORY_SCHEMA = {
    "type": "object",
    "properties": {
        "categories": {"type": "array", "items": {"type": "string"}},
    },
}

TOOL_PICK_SCHEMA = {
    "type": "object",
    "properties": {
        "results": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "reason": {"type": "string"},
                },
            },
        },
    },
}


class SearchResult:
    __slots__ = ("id", "title", "category", "referentiel_code", "reason")

    def __init__(self, id: str, title: str, category: str, referentiel_code: str | None, reason: str) -> None:
        self.id = id
        self.title = title
        self.category = category
        self.referentiel_code = referentiel_code
        self.reason = reason


def _pick_categories(query: str, categories: list[str]) -> list[str]:
    system_prompt = """You are a routing assistant for a catalog of professional AI tools.
Given a user's need (in any language) and the list of available categories (in French),
return the 1 to 5 categories most likely to contain a relevant tool. Err on the side of
including a plausible category rather than omitting it — a later step narrows further.
Return ONLY a raw JSON object: {"categories": ["exact category name", ...]}.
Category names must be copied EXACTLY as given — never invent or translate one."""

    user_prompt = f"""User need: {query}

Available categories:
{json.dumps(categories, ensure_ascii=False)}"""

    try:
        result = generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            output_schema=CATEGORY_SCHEMA,
            model=get_settings().groq_model,
            max_tokens=200,
        )
    except GenerationError:
        logger.exception("Routage par catégorie échoué, repli sur tout le catalogue")
        return categories

    picked = [c for c in result.get("categories") or [] if c in categories]
    return picked or categories


def _pick_tools(query: str, candidates: list) -> list[tuple[str, str]]:
    """Retourne des paires (id, reason), dans l'ordre de pertinence décroissante."""
    candidates = candidates[:MAX_CANDIDATES]
    # Une ligne "id: titre" par outil coûte moins de tokens qu'un tableau d'objets
    # JSON répétant les clés — sensible ici vu la limite de 6000 tokens/minute.
    catalog_excerpt = "\n".join(f"{t.id}: {t.title}" for t in candidates)

    system_prompt = f"""You are a recommendation assistant for a catalog of professional AI tools.
Given a user's need (in any language) and a list of candidate tools (one per line,
"id: French title"), pick the {MAX_RESULTS} tools most relevant to that need, ranked best first.
For each, give a one-sentence reason IN THE SAME LANGUAGE as the user's need, explaining
why this tool fits.
Return ONLY a raw JSON object: {{"results": [{{"id": "exact-id-from-the-list", "reason": "..."}}]}}.
IDs must be copied EXACTLY from the list — never invent one. If nothing truly fits, return fewer
results rather than a poor match."""

    user_prompt = f"""User need: {query}

Candidate tools:
{catalog_excerpt}"""

    result = generate_structured(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        output_schema=TOOL_PICK_SCHEMA,
        model=get_settings().groq_model,
        max_tokens=500,
    )

    known_ids = {t.id for t in candidates}
    picks = []
    for item in result.get("results") or []:
        tool_id = item.get("id")
        if tool_id in known_ids:
            picks.append((tool_id, str(item.get("reason") or "")))

    return picks[:MAX_RESULTS]


def search_tools(query: str) -> list[SearchResult]:
    """Outils les plus pertinents pour un besoin exprimé en langage naturel.

    Lève `GenerationError` si l'IA est indisponible : mieux vaut le signaler que
    renvoyer une liste vide qui se ferait passer pour « aucun outil pertinent ».
    """
    query = query.strip()
    if not query:
        return []

    tools = list_published_tools()
    if not tools:
        return []

    categories = sorted({t.category for t in tools})
    picked_categories = _pick_categories(query, categories)

    candidates = [t for t in tools if t.category in picked_categories] or tools
    picks = _pick_tools(query, candidates)

    by_id = {t.id: t for t in candidates}
    return [
        SearchResult(
            id=tool_id,
            title=by_id[tool_id].title,
            category=by_id[tool_id].category,
            referentiel_code=by_id[tool_id].referentiel_code,
            reason=reason,
        )
        for tool_id, reason in picks
        if tool_id in by_id
    ]
