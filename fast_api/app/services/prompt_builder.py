"""Construction des prompts — portage de src/lib/engine/prompt-builder.ts."""

import json
import re
from typing import Any

from app.i18n import language_name
from app.schemas import ToolConfig


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


def build_system_prompt(tool: ToolConfig, lang: str) -> str:
    return f"""You are an elite Management & Strategy Consultant.
Tool: "{tool.title}" | Category: "{tool.category}"

STRICT RULES:
1. LANGUAGE: Respond entirely in {language_name(lang)}. No exceptions.
2. OUTPUT FORMAT: Return ONLY a raw valid JSON object matching this exact schema:
   {json.dumps(tool.outputSchema, indent=2, ensure_ascii=False)}
   - "score_global": integer 0–100 reflecting overall maturity
   - "axes": array of {{axe: string, score: number (0–100)}} — one per dimension assessed
   - "recommandations": array of at least 5 detailed, actionable strings
3. NO markdown outside the JSON. NO explanations. NO code blocks. ONLY the JSON."""


def build_user_prompt(tool: ToolConfig, user_inputs: dict[str, Any]) -> str:
    return f"""Here are the factual answers provided by the company representative:
{build_input_lines(tool, user_inputs)}

Based on these factual observations, generate the diagnostic result now."""
