"""Construction des prompts envoyés au LLM.

Le `promptTemplate` de la fiche d'outil est la seule chose qui distingue un outil
d'un autre : il porte le métier (posture de l'expert, méthodologie, axes
d'analyse). Il est donc interpolé avec les réponses de l'utilisateur puis placé
en tête du message utilisateur.

Le prompt système ne porte que les règles transverses (langue, format), et décrit
le format attendu à partir de l'`outputSchema` **de l'outil**, jamais d'un schéma
codé en dur.
"""

import json
import re
from typing import Any

from app.i18n import language_name
from app.schemas import ToolConfig
from app.services.output_kinds import guidance_for, schema_for


def build_prompt(template: str, user_inputs: dict[str, Any]) -> str:
    """Remplace les variables `{nom_variable}` du template par les valeurs utilisateur."""
    final_prompt = template

    for key, value in user_inputs.items():
        if value is None:
            string_value = ""
        elif isinstance(value, (dict, list)):
            string_value = json.dumps(value, ensure_ascii=False)
        elif isinstance(value, bool):
            string_value = "true" if value else "false"
        else:
            string_value = str(value)

        final_prompt = re.sub(re.escape("{" + key + "}"), lambda _: string_value, final_prompt)

    return final_prompt


def build_input_lines(tool: ToolConfig, user_inputs: dict[str, Any]) -> str:
    """Résumé lisible des réponses utilisateur, une ligne par champ du formulaire."""
    lines = []
    for tool_input in tool.inputs:
        value = user_inputs.get(tool_input.name)
        label = tool_input.question or tool_input.label or tool_input.name
        display_value = str(value) if value not in (None, "") else "(non renseigné)"
        lines.append(f"- {label} → {display_value}")
    return "\n".join(lines)


def _effective_schema(tool: ToolConfig) -> dict:
    """Schéma de sortie de l'outil, ou le schéma canonique de son type à défaut."""
    return tool.outputSchema or schema_for(tool.output_kind)


def build_system_prompt(tool: ToolConfig, lang: str) -> str:
    """Règles transverses uniquement — le métier vit dans le promptTemplate de l'outil."""
    return f"""You are an expert consultant executing one specific professional tool.
Tool: "{tool.title}" | Category: "{tool.category}"

WHAT THIS TOOL MUST PRODUCE:
{guidance_for(tool.output_kind)}

STRICT RULES:
1. LANGUAGE: Respond entirely in {language_name(lang)}. No exceptions.
2. OUTPUT FORMAT: Return ONLY a raw valid JSON object matching this exact schema:
{json.dumps(_effective_schema(tool), indent=2, ensure_ascii=False)}
   Every property declared above must be present and non-empty. Respect the
   declared types exactly: a "number" must be a JSON number, never a string nor
   a range.
3. Follow the tool instructions given in the user message. Base your answer on the
   facts provided; do not invent facts that were not given.
4. If the tool instructions ask for something the schema above does not contain
   (a score, for instance), the schema wins.
5. NO markdown outside the JSON. NO explanations. NO code blocks. ONLY the JSON."""


def build_user_prompt(tool: ToolConfig, user_inputs: dict[str, Any]) -> str:
    """Instruction métier de l'outil (promptTemplate interpolé) + rappel factuel des réponses."""
    instructions = build_prompt(tool.promptTemplate, user_inputs)

    return f"""{instructions}

--- Réponses fournies par l'utilisateur ---
{build_input_lines(tool, user_inputs)}

Génère maintenant le résultat, en respectant strictement le schéma de sortie."""


def build_retry_prompt(previous_answer: str, validation_error: str) -> str:
    """Correction réinjectée quand la sortie ne respecte pas l'outputSchema (cf. A3)."""
    return f"""Your previous answer did not match the required JSON schema.

Validation error: {validation_error}

Your previous answer was:
{previous_answer}

Return the corrected JSON object only. No markdown, no explanation."""
