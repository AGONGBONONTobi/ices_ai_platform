"""Accès à la table `tools` — point unique de vérité pour les fiches d'outils.

Centralisé ici pour deux raisons :

- le filtre `status = 'published'` ne doit jamais être oublié dans une route ;
- `/execute` doit relire la fiche en base plutôt que de faire confiance au client
  (sans quoi n'importe quel compte peut faire exécuter le prompt de son choix).
"""

import logging

from fastapi import HTTPException, status as http_status

from app.schemas import ToolConfig, ToolSummary
from app.services.supabase_client import get_supabase_anon

logger = logging.getLogger(__name__)

# Taille de page pour la lecture du catalogue (limite PostgREST : 1000 lignes)
PAGE_SIZE = 1000

PUBLISHED = "published"

_STATUS_COLUMN_WARNING = (
    "La colonne `status` est absente de la table `tools` : tous les outils sont "
    "servis, y compris les brouillons. Exécuter supabase/tools_schema.sql."
)

# Mémorisé après le premier échec pour ne pas retenter (et re-logger) à chaque requête.
_status_column_available: bool | None = None


def _has_status_column() -> bool:
    """Le cycle de vie éditorial n'existe qu'une fois la migration A5 appliquée."""
    global _status_column_available

    if _status_column_available is None:
        try:
            get_supabase_anon().table("tools").select("status").limit(1).execute()
            _status_column_available = True
        except Exception:  # noqa: BLE001 — migration non appliquée
            logger.warning(_STATUS_COLUMN_WARNING)
            _status_column_available = False

    return _status_column_available


def _published_only(query):
    """Applique le filtre de publication quand la colonne existe."""
    return query.eq("status", PUBLISHED) if _has_status_column() else query


def list_published_tools() -> list[ToolSummary]:
    """Catalogue complet. PostgREST plafonne à 1000 lignes : on pagine."""
    client = get_supabase_anon()
    tools: list[ToolSummary] = []
    offset = 0

    while True:
        response = (
            _published_only(client.table("tools").select("id, title, category"))
            .order("category", desc=False)
            .order("id", desc=False)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        page = response.data or []
        tools.extend(ToolSummary(**row) for row in page)

        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    return tools


def count_published_tools() -> int:
    response = (
        _published_only(get_supabase_anon().table("tools").select("id", count="exact"))
        .limit(1)
        .execute()
    )
    return response.count or 0


def get_published_tool(tool_id: str) -> ToolConfig:
    """Fiche complète d'un outil publié. Lève 404 sinon."""
    response = (
        _published_only(get_supabase_anon().table("tools").select("config").eq("id", tool_id))
        .maybe_single()
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Outil introuvable."
        )

    return ToolConfig(**response.data["config"])
