"""Pré-remplissage du formulaire d'un outil à partir d'un document uploadé.

Contrairement à l'exécution d'un outil (app/services/generation.py), une
extraction partielle est le résultat normal, pas un échec : un document ne
répond jamais à tous les champs. On n'utilise donc pas `generate_structured`,
dont la validation exige que toute propriété déclarée soit présente et non
vide — un champ absent du document doit rester absent du résultat, sans
retry ni erreur.

L'utilisateur relit et corrige avant de générer : une valeur mal extraite n'a
donc pas le même coût qu'une valeur mal calculée à l'exécution.
"""

import json
import logging

from app.schemas import ToolConfig, ToolInput
from app.services.groq_client import get_groq
from app.config import get_settings

logger = logging.getLogger(__name__)


class ExtractionError(Exception):
    """L'IA n'a pas pu être interrogée (réseau, quota fournisseur…)."""


def _option_labels(tool_input: ToolInput) -> list[str]:
    return [o if isinstance(o, str) else o.label for o in (tool_input.options or [])]


def _field_description(tool_input: ToolInput) -> str:
    label = tool_input.question or tool_input.label or tool_input.name
    if tool_input.type == "select":
        options = " | ".join(_option_labels(tool_input))
        return f'"{tool_input.name}" ({label}) — choisir EXACTEMENT parmi : {options}'
    if tool_input.type == "number":
        return f'"{tool_input.name}" ({label}) — nombre'
    return f'"{tool_input.name}" ({label})'


def extract_form_values(tool: ToolConfig, document_text: str) -> dict[str, object]:
    """Valeurs trouvées dans `document_text` pour les champs de `tool`.

    Ne renvoie que les champs identifiés avec une confiance raisonnable : le
    prompt demande explicitement d'omettre le reste plutôt que de deviner.
    """
    if not document_text.strip() or not tool.inputs:
        return {}

    fields = "\n".join(f"- {_field_description(i)}" for i in tool.inputs)

    system_prompt = """You extract factual answers from a document to pre-fill a form.
Return ONLY a raw JSON object mapping field names to the value found in the document.
Rules:
1. Only include a field if the document actually contains that information — omit it
   entirely otherwise. Never invent, guess, or use a placeholder.
2. For a field with an option list, the value must be copied EXACTLY from the given
   options — never a paraphrase.
3. Keep values concise and in the document's own language.
4. Return {} if nothing in the document answers any of the fields."""

    user_prompt = f"""Fields to fill:
{fields}

Document:
{document_text}"""

    try:
        completion = get_groq().chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=get_settings().groq_model_capable,
            temperature=0.1,
            max_tokens=800,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content
    except Exception as error:  # noqa: BLE001 — rate limit, réseau, quota fournisseur…
        logger.exception("Extraction IA échouée")
        raise ExtractionError(f"Le fournisseur IA est indisponible : {error}") from error

    try:
        parsed = json.loads(content or "{}")
    except json.JSONDecodeError:
        logger.warning("Extraction : JSON invalide renvoyé par le modèle")
        return {}

    if not isinstance(parsed, dict):
        return {}

    known_fields = {i.name: i for i in tool.inputs}
    values: dict[str, object] = {}

    for name, value in parsed.items():
        tool_input = known_fields.get(name)
        if tool_input is None or value in (None, ""):
            continue

        if tool_input.type == "select":
            if str(value) not in _option_labels(tool_input):
                continue
        elif tool_input.type == "number":
            try:
                value = float(value)
            except (TypeError, ValueError):
                continue

        values[name] = value

    return values
