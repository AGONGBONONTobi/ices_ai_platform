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
    groq_model: str = "llama-3.1-8b-instant"

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
    free_tier_limit: int = 3

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
