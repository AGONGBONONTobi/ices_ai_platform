"""Configuration i18n partagée avec le frontend (src/lib/i18n/getDictionary.ts)."""

DEFAULT_LOCALE = "fr"

LOCALES = ("fr", "en", "es", "de", "ar", "zh", "pt")

# Nom complet de la langue, injecté dans le prompt IA
LOCALE_TO_LANGUAGE_NAME = {
    "fr": "French",
    "en": "English",
    "es": "Spanish",
    "de": "German",
    "ar": "Arabic",
    "zh": "Chinese (Simplified)",
    "pt": "Portuguese (Brazilian)",
}

# Libellé utilisé dans le prompt de traduction (formulé en français)
LOCALE_TO_TRANSLATION_LABEL = {
    "fr": "français",
    "en": "anglais (English)",
    "es": "espagnol (Español)",
    "de": "allemand (Deutsch)",
    "ar": "arabe (العربية)",
    "zh": "chinois simplifié (中文)",
    "pt": "portugais (Português)",
}


def normalize_locale(lang: str | None) -> str:
    """Retourne une locale supportée, en repliant sur la locale par défaut."""
    if lang and lang in LOCALES:
        return lang
    return DEFAULT_LOCALE


def language_name(lang: str | None) -> str:
    return LOCALE_TO_LANGUAGE_NAME[normalize_locale(lang)]
