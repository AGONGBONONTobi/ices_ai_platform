"""Traduction des outils — portage de src/lib/i18n/translateTool.ts.

Stratégie inchangée :
1. Le français est la langue source → aucune traduction.
2. On cherche d'abord une traduction en cache dans `tool_translations`.
3. Sinon on traduit à la volée via Groq, puis on met en cache.
4. En cas d'échec (rate limit…), on renvoie l'outil en français pour ne pas bloquer l'UI.
"""

import json
import logging

from app.config import get_settings
from app.i18n import DEFAULT_LOCALE, LOCALE_TO_TRANSLATION_LABEL, normalize_locale
from app.schemas import ToolConfig, ToolInput
from app.services.groq_client import get_groq
from app.services.supabase_client import get_supabase_admin, get_supabase_anon

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """Tu es un traducteur expert. Traduis le JSON fourni vers la langue suivante : {language}.
Règles strictes :
1. Renvoie UNIQUEMENT un objet JSON valide.
2. Garde EXACTEMENT la même structure et les mêmes clés (title, category, inputs).
3. Ne traduis pas la clé "name" dans le tableau "inputs".
4. Traduis les valeurs textuelles ("title", "category", "label", "placeholder", "options").
5. Assure-toi que la traduction est naturelle et professionnelle."""


def get_cached_translations(lang: str) -> dict[str, dict]:
    """Traductions en cache pour tout le catalogue, indexées par `tool_id`."""
    lang = normalize_locale(lang)
    if lang == DEFAULT_LOCALE:
        return {}

    response = (
        get_supabase_anon()
        .table("tool_translations")
        .select("tool_id, title, category")
        .eq("lang", lang)
        .execute()
    )
    return {row["tool_id"]: row for row in (response.data or [])}


def _merge_translation(tool: ToolConfig, translated: dict) -> ToolConfig:
    """Applique un payload traduit sur la config d'origine, champ par champ."""
    translated_inputs = translated.get("inputs") or []
    by_name = {i.get("name"): i for i in translated_inputs if isinstance(i, dict)}

    merged_inputs: list[ToolInput] = []
    for index, tool_input in enumerate(tool.inputs):
        candidate = by_name.get(tool_input.name)
        if candidate is None and index < len(translated_inputs):
            candidate = translated_inputs[index]
        candidate = candidate or {}

        merged_inputs.append(
            tool_input.model_copy(
                update={
                    "label": candidate.get("label") or tool_input.label,
                    "placeholder": candidate.get("placeholder") or tool_input.placeholder,
                    "options": candidate.get("options") or tool_input.options,
                }
            )
        )

    return tool.model_copy(
        update={
            "title": translated.get("title") or tool.title,
            "category": translated.get("category") or tool.category,
            "inputs": merged_inputs,
        }
    )


def translate_tool_config(tool: ToolConfig, lang: str) -> ToolConfig:
    lang = normalize_locale(lang)

    # 1. Le français est la langue de base
    if lang == DEFAULT_LOCALE:
        return tool

    # 2. Cache en base
    try:
        cached = (
            get_supabase_anon()
            .table("tool_translations")
            .select("title, category, inputs")
            .eq("tool_id", tool.id)
            .eq("lang", lang)
            .maybe_single()
            .execute()
        )
        if cached and cached.data:
            return _merge_translation(tool, cached.data)
    except Exception:  # noqa: BLE001 — le cache ne doit jamais casser la requête
        logger.warning("Lecture du cache de traduction échouée pour %s/%s", tool.id, lang)

    # 3. Traduction à la volée
    logger.info("[Traduction à la volée] %s → %s", tool.title, lang)

    payload_to_translate = {
        "title": tool.title,
        "category": tool.category,
        "inputs": [
            {
                # On garde le nom original pour la correspondance
                "name": i.name,
                "label": i.label,
                "placeholder": i.placeholder,
                "options": [
                    o if isinstance(o, str) else o.model_dump(exclude_none=True)
                    for o in (i.options or [])
                ]
                or None,
            }
            for i in tool.inputs
        ],
    }

    try:
        completion = get_groq().chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT_TEMPLATE.format(
                        language=LOCALE_TO_TRANSLATION_LABEL[lang]
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(payload_to_translate, indent=2, ensure_ascii=False),
                },
            ],
            model=get_settings().groq_model,
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = completion.choices[0].message.content
        if not content:
            raise ValueError("No translation returned")

        translated = json.loads(content)

        # 4. Mise en cache (best effort : une requête concurrente a pu insérer avant nous)
        try:
            get_supabase_admin().table("tool_translations").upsert(
                {
                    "tool_id": tool.id,
                    "lang": lang,
                    "title": translated.get("title", tool.title),
                    "category": translated.get("category", tool.category),
                    "inputs": translated.get("inputs", []),
                },
                on_conflict="tool_id,lang",
            ).execute()
        except Exception:  # noqa: BLE001
            logger.warning("Mise en cache de la traduction échouée pour %s/%s", tool.id, lang)

        return _merge_translation(tool, translated)

    except Exception:  # noqa: BLE001
        # Rate limit Groq, JSON invalide… : on renvoie le français plutôt que de bloquer l'UI
        logger.exception("Erreur de traduction pour %s/%s", tool.id, lang)
        return tool
