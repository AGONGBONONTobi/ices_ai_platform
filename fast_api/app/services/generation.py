"""Génération contrainte par schéma : appel LLM + validation + retries.

Le mode `json_object` des API LLM garantit du JSON syntaxiquement valide, pas du
JSON conforme au contrat de l'outil. On rejoue donc l'appel en réinjectant
l'erreur de validation, comme prescrit par le niveau 2 du filtre qualité.

Un résultat non validé n'est jamais rendu à l'utilisateur.
"""

import json
import logging
from typing import Any

from app.config import get_settings
from app.services.groq_client import get_groq
from app.services.output_validator import OutputValidationError, validate_output
from app.services.prompt_builder import build_retry_prompt

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


class GenerationError(Exception):
    """La génération a échoué de façon définitive (après retries)."""


def generate_structured(
    system_prompt: str,
    user_prompt: str,
    output_schema: dict[str, Any],
    *,
    max_retries: int = MAX_RETRIES,
) -> dict[str, Any]:
    """Retourne un résultat validé contre `output_schema`, ou lève `GenerationError`."""
    settings = get_settings()
    messages: list[dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    last_error = "erreur inconnue"

    for attempt in range(max_retries + 1):
        try:
            completion = get_groq().chat.completions.create(
                messages=messages,
                model=settings.groq_model,
                temperature=0.4,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )
            content = completion.choices[0].message.content
        except Exception as error:  # noqa: BLE001 — rate limit, réseau, quota fournisseur…
            logger.exception("Appel LLM échoué (tentative %s)", attempt + 1)
            raise GenerationError(f"Le fournisseur IA est indisponible : {error}") from error

        if not content:
            last_error = "réponse vide"
        else:
            try:
                result = json.loads(content)
                validate_output(result, output_schema)
                return result
            except json.JSONDecodeError as error:
                last_error = f"JSON invalide : {error}"
            except OutputValidationError as error:
                last_error = str(error)

        if attempt < max_retries:
            logger.info(
                "Sortie non conforme (tentative %s/%s) : %s",
                attempt + 1,
                max_retries + 1,
                last_error,
            )
            messages.append({"role": "assistant", "content": content or ""})
            messages.append(
                {"role": "user", "content": build_retry_prompt(content or "", last_error)}
            )

    logger.warning("Sortie non conforme après %s tentatives : %s", max_retries + 1, last_error)
    raise GenerationError(
        "L'IA n'a pas produit un résultat exploitable pour cet outil. "
        f"Dernière erreur : {last_error}"
    )
