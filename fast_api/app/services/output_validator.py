"""Validation de la sortie du LLM contre l'`outputSchema` de l'outil (niveau 2 du
filtre qualité).

Deux couches, parce que la seule validation de types ne suffit pas :

1. **Conformité structurelle** — JSON Schema. Les fiches du catalogue ne déclarent
   jamais `required` ; sans normalisation, un `{}` vide serait donc parfaitement
   valide. On considère par défaut que toute propriété déclarée est obligatoire.
2. **Substance** — un champ présent mais vide (`""`, `[]`) est un échec de
   génération, pas un résultat. C'est exactement le cas « champs vides/absurdes »
   que le cadrage demande de détecter avant de rendre un résultat à l'utilisateur.
"""

from typing import Any

from jsonschema import Draft202012Validator
from jsonschema.exceptions import SchemaError


class OutputValidationError(Exception):
    """La sortie du LLM ne respecte pas le contrat de l'outil."""


def normalize_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """Rend le schéma d'une fiche réellement contraignant.

    Les fiches générées décrivent les propriétés attendues mais ne déclarent
    aucun `required` : on l'ajoute, sinon le contrat n'engage à rien.
    """
    if not isinstance(schema, dict) or not schema:
        return {}

    normalized = dict(schema)
    properties = normalized.get("properties")

    if isinstance(properties, dict) and properties and "required" not in normalized:
        normalized["required"] = list(properties.keys())

    return normalized


def _find_empty_fields(result: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    """Propriétés attendues présentes mais vides de substance."""
    properties = schema.get("properties")
    if not isinstance(properties, dict):
        return []

    empty = []
    for name in properties:
        if name not in result:
            continue
        value = result[name]
        if value is None:
            empty.append(name)
        elif isinstance(value, str) and not value.strip():
            empty.append(name)
        elif isinstance(value, (list, dict)) and len(value) == 0:
            empty.append(name)
    return empty


def validate_output(result: Any, schema: dict[str, Any]) -> None:
    """Lève `OutputValidationError` si la sortie ne respecte pas le contrat.

    Un schéma vide ou lui-même invalide n'est pas un motif de rejet du résultat :
    c'est un défaut de la fiche, traité en amont par `scripts/validate_tools.ts`.
    On se contente alors d'exiger un objet JSON.
    """
    if not isinstance(result, dict):
        raise OutputValidationError(
            f"la réponse doit être un objet JSON, reçu : {type(result).__name__}"
        )

    normalized = normalize_schema(schema)
    if not normalized.get("properties"):
        return

    try:
        validator = Draft202012Validator(normalized)
    except SchemaError:
        # Fiche mal formée : on ne bloque pas l'utilisateur sur un défaut de config.
        return

    errors = sorted(validator.iter_errors(result), key=lambda e: list(e.path))
    if errors:
        details = "; ".join(
            f"{'/'.join(str(p) for p in error.path) or 'racine'} : {error.message}"
            for error in errors[:3]
        )
        raise OutputValidationError(details)

    empty = _find_empty_fields(result, normalized)
    if empty:
        raise OutputValidationError(
            f"champ(s) attendu(s) mais vide(s) : {', '.join(empty)}"
        )
