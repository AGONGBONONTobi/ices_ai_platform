"""Initialisation de Sentry.

Optionnel : sans `SENTRY_DSN`, l'application démarre normalement et se contente
des logs. Le SDK n'est même pas requis pour lancer le backend en local.
"""

import logging

from app.config import get_settings

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    settings = get_settings()

    if not settings.sentry_dsn:
        logger.info("Sentry désactivé (SENTRY_DSN non défini).")
        return

    try:
        import sentry_sdk
    except ImportError:
        logger.warning("SENTRY_DSN est défini mais sentry-sdk n'est pas installé.")
        return

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        # Échantillonnage des traces : suffisant pour repérer les lenteurs sans
        # saturer le quota du plan gratuit.
        traces_sample_rate=0.1,
        # Les prompts contiennent les réponses de l'utilisateur : on ne les envoie pas.
        send_default_pii=False,
    )
    logger.info("Sentry initialisé (environnement : %s).", settings.environment)
