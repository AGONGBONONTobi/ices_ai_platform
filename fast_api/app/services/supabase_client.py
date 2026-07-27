"""Clients Supabase — portage de src/lib/supabase/server.ts.

Deux clients :
- `get_supabase_anon()`  : clé publique, lectures soumises aux policies RLS publiques
                           (catalogue d'outils, traductions).
- `get_supabase_admin()` : service role, bypass RLS. Réservé aux opérations serveur
                           (profils, webhooks Stripe, cache de traductions).
"""

from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase_anon() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_supabase_admin() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
