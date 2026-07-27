"""Client Groq partagé."""

from functools import lru_cache

from groq import Groq

from app.config import get_settings


@lru_cache
def get_groq() -> Groq:
    return Groq(api_key=get_settings().groq_api_key)
