"""Modèles Pydantic — portage de src/lib/schema/tool-schema.ts."""

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.services.output_kinds import DEFAULT_OUTPUT_KIND


class ToolSelectOption(BaseModel):
    label: str
    score: float | None = None


# Une option de select peut être une string simple ou {label, score}
SelectOption = str | ToolSelectOption


class ToolInput(BaseModel):
    name: str = Field(min_length=1)
    type: Literal["text", "textarea", "number", "select"]
    options: list[SelectOption] | None = None
    label: str | None = None
    # Question factuelle posée à l'utilisateur (prioritaire sur `label` dans le prompt)
    question: str | None = None
    placeholder: str | None = None
    # Exigence du référentiel, affichée sous le libellé du champ.
    help: str | None = None
    required: bool = True
    # --- Scoring déterministe (chantier B6) ---
    # Chapitre du référentiel évalué par ce champ ('4.1') : sert d'axe de
    # regroupement, ce qui permet un score par chapitre de la norme.
    chapitre: str | None = None
    # Axe de regroupement pour un outil scoré sans référentiel normatif.
    axe: str | None = None
    # Poids de la question dans le score de son axe.
    poids: float | None = None


class ToolConfig(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    category: str = Field(min_length=1)
    inputs: list[ToolInput] = Field(default_factory=list)
    promptTemplate: str = Field(min_length=1)
    outputSchema: dict[str, Any] = Field(default_factory=dict)
    # Nature du livrable attendu. Les fiches antérieures au chantier B7 ne le
    # déclarent pas : elles retombent sur le type par défaut.
    output_kind: str = DEFAULT_OUTPUT_KIND
    # --- Socle normatif (chantier B5) ---
    # Référentiel dont les clauses sont injectées à l'exécution. Sans lui, un
    # diagnostic ISO repose sur la mémoire du modèle.
    referentiel_code: str | None = None
    referentiel_version: str | None = None


class ToolSummary(BaseModel):
    """Version allégée renvoyée par le catalogue."""

    id: str
    title: str
    category: str


class ExecuteRequest(BaseModel):
    # Seul l'identifiant transite : la fiche (et donc le prompt) est relue en base.
    toolId: str = Field(min_length=1)
    userInputs: dict[str, Any]
    lang: str = "fr"


class ExecuteResponse(BaseModel):
    result: dict[str, Any]


class Profile(BaseModel):
    id: str
    email: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    plan: str = "free"
    tools_used_count: int = 0


class CheckoutResponse(BaseModel):
    url: str
