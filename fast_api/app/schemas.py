"""Modèles Pydantic — portage de src/lib/schema/tool-schema.ts."""

from typing import Any, Literal

from pydantic import BaseModel, Field


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
    required: bool = True


class ToolConfig(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    category: str = Field(min_length=1)
    inputs: list[ToolInput] = Field(default_factory=list)
    promptTemplate: str = Field(min_length=1)
    outputSchema: dict[str, Any] = Field(default_factory=dict)


class ToolSummary(BaseModel):
    """Version allégée renvoyée par le catalogue."""

    id: str
    title: str
    category: str


class ExecuteRequest(BaseModel):
    toolConfig: ToolConfig
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
