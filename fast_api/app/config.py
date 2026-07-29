from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration du backend, chargée depuis les variables d'environnement / .env."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- Supabase ---
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # --- Groq (LLM) ---
    groq_api_key: str
    # Modèle par défaut : rapide et gratuit, suffisant pour les outils courants.
    groq_model: str = "llama-3.1-8b-instant"
    # Modèle des tâches exigeantes (diagnostics adossés à un référentiel,
    # documents). Le modèle par défaut ne convient pas : à charge égale il ne
    # rattache aucune recommandation à une clause, et il ne peut de toute façon
    # pas absorber un référentiel complet dans la limite de tokens par minute
    # du palier gratuit.
    groq_model_capable: str = "llama-3.3-70b-versatile"
    # Permet de revenir au modèle unique en cas de souci de quota fournisseur.
    model_routing_enabled: bool = True

    # --- Stripe ---
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""

    # --- Frontend ---
    # Utilisé pour les redirections Stripe (success_url / cancel_url)
    frontend_url: str = "http://localhost:3000"
    # Liste d'origines autorisées par CORS, séparées par des virgules
    cors_origins: str = "http://localhost:3000"

    # --- Quotas ---
    free_tier_limit: int = 50

    # --- Limitation de débit ---
    # Complète le quota : protège contre les rafales, avant toute dépense LLM.
    rate_limit_enabled: bool = True
    execute_rate_limit: str = "10/minute"
    catalog_rate_limit: str = "120/minute"

    # --- Observabilité ---
    # Vide = Sentry désactivé (développement local).
    sentry_dsn: str = ""
    environment: str = "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
