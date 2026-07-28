"""Types de sortie des outils (chantier B7).

Le catalogue a été généré avec un `outputSchema` unique — score global, axes,
recommandations — imposé à toutes les fiches. Or seule une minorité d'outils
relève réellement d'un diagnostic scoré : un modèle de fiche de poste, une
matrice des risques ou un test de personnalité n'ont pas de « score de maturité ».

Chaque outil déclare donc un `output_kind`, qui détermine trois choses :
son schéma de sortie, les consignes données au modèle, et le mode de rendu
(interface et PDF).

Note sur `profile` : un test de personnalité ou un profil d'apprenant mesure des
*dimensions*, pas une performance. On parle d'`intensite`, jamais de score, et le
rendu n'applique aucun code couleur de valeur — dire à quelqu'un que sa
personnalité est « à améliorer » n'a pas de sens.
"""

from typing import Any, Literal

OutputKind = Literal["assessment", "analysis", "document", "table", "profile"]

DEFAULT_OUTPUT_KIND: OutputKind = "analysis"

OUTPUT_KINDS: tuple[str, ...] = (
    "assessment",
    "analysis",
    "document",
    "table",
    "profile",
)


def _obj(properties: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties.keys()),
    }


_STRING_LIST = {"type": "array", "items": {"type": "string"}}

_SECTIONS = {
    "type": "array",
    "items": _obj({"titre": {"type": "string"}, "contenu": {"type": "string"}}),
}

# Schémas canoniques. Volontairement courts : ils doivent rester tenables par un
# modèle de petite taille, puisque chaque propriété déclarée est obligatoire et
# ne peut pas être vide (cf. output_validator).
CANONICAL_SCHEMAS: dict[str, dict[str, Any]] = {
    "assessment": _obj(
        {
            "score_global": {"type": "number", "description": "Score sur 100"},
            "axes": {
                "type": "array",
                "items": _obj(
                    {
                        "axe": {"type": "string"},
                        "score": {"type": "number", "description": "Score sur 100"},
                    }
                ),
            },
            "recommandations": _STRING_LIST,
        }
    ),
    "profile": _obj(
        {
            "synthese": {"type": "string"},
            "dimensions": {
                "type": "array",
                "items": _obj(
                    {
                        "dimension": {"type": "string"},
                        "intensite": {
                            "type": "number",
                            "description": "Intensité de 0 à 100 — une mesure, pas une note",
                        },
                        "interpretation": {"type": "string"},
                    }
                ),
            },
            "pistes": _STRING_LIST,
        }
    ),
    "analysis": _obj(
        {
            "synthese": {"type": "string"},
            "sections": _SECTIONS,
            "points_cles": _STRING_LIST,
        }
    ),
    "document": _obj({"titre": {"type": "string"}, "sections": _SECTIONS}),
    "table": _obj(
        {
            "colonnes": _STRING_LIST,
            "lignes": {"type": "array", "items": _STRING_LIST},
        }
    ),
}

# Consignes injectées dans le prompt système, en plus du schéma lui-même.
KIND_GUIDANCE: dict[str, str] = {
    "assessment": (
        "This tool is a scored diagnostic. Assess maturity from the declared facts.\n"
        "- \"score_global\": integer 0-100, consistent with the axis scores.\n"
        "- \"axes\": one entry per dimension actually assessed (4 to 6).\n"
        "- \"recommandations\": at least 5 prioritised, actionable items."
    ),
    "profile": (
        "This tool draws a PROFILE, not a performance evaluation.\n"
        "- Never phrase a dimension as good or bad, strong or weak.\n"
        "- \"intensite\": 0-100, how strongly the dimension is expressed. It is a\n"
        "  measurement, not a grade.\n"
        "- \"interpretation\": what this expression means in a work context.\n"
        "- \"pistes\": development avenues, never corrections of a defect."
    ),
    "analysis": (
        "This tool produces a structured analysis, with NO score.\n"
        "- \"synthese\": 3 to 5 sentences answering the question directly.\n"
        "- \"sections\": 3 to 6 substantive sections; \"contenu\" is prose, not a list.\n"
        "- \"points_cles\": the operative takeaways."
    ),
    "document": (
        "This tool produces a READY-TO-USE DOCUMENT, with NO score and NO commentary\n"
        "about the document.\n"
        "- Write the deliverable itself, as the user will use it.\n"
        "- \"sections\": the actual sections of the document, in order.\n"
        "- \"contenu\": the finished wording, not instructions on what to write."
    ),
    "table": (
        "This tool produces a TABLE, with NO score.\n"
        "- \"colonnes\": the column headers.\n"
        "- \"lignes\": each row is an array of strings, in the same order and with\n"
        "  exactly the same length as \"colonnes\".\n"
        "- At least 5 rows unless the subject makes fewer unavoidable."
    ),
}


def normalize_kind(value: Any) -> str:
    """Retourne un type de sortie supporté, en repliant sur le type par défaut."""
    return value if value in OUTPUT_KINDS else DEFAULT_OUTPUT_KIND


def schema_for(kind: str) -> dict[str, Any]:
    return CANONICAL_SCHEMAS[normalize_kind(kind)]


def guidance_for(kind: str) -> str:
    return KIND_GUIDANCE[normalize_kind(kind)]
