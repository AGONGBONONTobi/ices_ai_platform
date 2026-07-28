"""Validation des réponses utilisateur contre la fiche de l'outil.

Le formulaire est rendu côté navigateur : ses contraintes (champ requis, options
d'un select) ne sont donc que du confort. Elles doivent être revérifiées ici,
puisque c'est le serveur qui construit le prompt à partir de ces valeurs.
"""

from typing import Any

from app.schemas import ToolConfig, ToolInput


class InputValidationError(Exception):
    """Les réponses fournies ne correspondent pas au formulaire de l'outil."""


def _option_labels(tool_input: ToolInput) -> list[str]:
    return [o if isinstance(o, str) else o.label for o in (tool_input.options or [])]


def _is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def _canonical_select_value(
    value: Any, shown: ToolInput, canonical: ToolInput | None
) -> tuple[Any, bool]:
    """Ramène une option choisie dans la langue affichée vers sa valeur source.

    L'utilisateur voit la fiche traduite et renvoie donc un libellé traduit, alors
    que le prompt est rédigé dans la langue source : on repasse par l'index de
    l'option pour retrouver le libellé canonique. Les deux listes sont acceptées,
    afin qu'une traduction absente ou obsolète ne bloque pas l'exécution.
    """
    shown_options = _option_labels(shown)
    canonical_options = _option_labels(canonical) if canonical else shown_options

    if not shown_options and not canonical_options:
        return value, True

    text = str(value)

    if text in shown_options:
        index = shown_options.index(text)
        if index < len(canonical_options):
            return canonical_options[index], True
        return text, True

    if text in canonical_options:
        return text, True

    return value, False


def validate_inputs(
    tool: ToolConfig,
    user_inputs: dict[str, Any],
    canonical: ToolConfig | None = None,
) -> dict[str, Any]:
    """Retourne les réponses nettoyées, restreintes aux champs déclarés par l'outil.

    `tool` est la fiche telle qu'elle a été **affichée** à l'utilisateur (donc
    traduite) : c'est elle qui fait foi pour les libellés d'erreur et les options
    acceptées. `canonical` est la fiche en langue source, qui servira à construire
    le prompt ; les valeurs retournées sont exprimées dans ses termes.

    Les clés inconnues sont écartées : elles ne servent qu'à injecter du contenu
    arbitraire dans le prompt via des variables non déclarées.
    """
    errors: list[str] = []
    cleaned: dict[str, Any] = {}

    canonical_inputs = {i.name: i for i in canonical.inputs} if canonical else {}

    for tool_input in tool.inputs:
        label = tool_input.question or tool_input.label or tool_input.name
        value = user_inputs.get(tool_input.name)

        if _is_blank(value):
            if tool_input.required:
                errors.append(f"« {label} » est obligatoire.")
            continue

        if tool_input.type == "number":
            try:
                value = float(value)
            except (TypeError, ValueError):
                errors.append(f"« {label} » doit être un nombre.")
                continue

        elif tool_input.type == "select":
            value, accepted = _canonical_select_value(
                value, tool_input, canonical_inputs.get(tool_input.name)
            )
            if not accepted:
                errors.append(f"« {label} » : valeur non autorisée.")
                continue

        elif tool_input.type in ("text", "textarea"):
            value = str(value)

        cleaned[tool_input.name] = value

    if errors:
        raise InputValidationError(" ".join(errors))

    return cleaned
