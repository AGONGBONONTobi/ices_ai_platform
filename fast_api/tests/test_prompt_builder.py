"""Le promptTemplate doit réellement atteindre le LLM (écart E1 de l'audit)."""

from app.schemas import ToolConfig, ToolInput
from app.services.prompt_builder import build_prompt, build_system_prompt, build_user_prompt


def make_tool(**overrides) -> ToolConfig:
    defaults = dict(
        id="diag-test",
        title="Diagnostic de test",
        category="DIAGNOSTICS & ÉVALUATIONS",
        inputs=[
            ToolInput(name="secteur", type="select", options=["Industrie", "Services"]),
            ToolInput(name="effectif", type="number"),
        ],
        promptTemplate="Tu es auditeur. Secteur : {secteur}. Effectif : {effectif}.",
        outputSchema={"type": "object", "properties": {"score_global": {"type": "number"}}},
    )
    return ToolConfig(**{**defaults, **overrides})


def test_build_prompt_interpole_les_variables():
    result = build_prompt("Secteur : {secteur}", {"secteur": "Industrie"})
    assert result == "Secteur : Industrie"


def test_build_prompt_gere_les_noms_accentues_et_a_tirets():
    # 40 % des fiches du catalogue ont des noms de champs de cette forme.
    template = "A : {contrôle-qualité}"
    assert build_prompt(template, {"contrôle-qualité": "OK"}) == "A : OK"


def test_le_prompt_utilisateur_contient_le_template_interpole():
    tool = make_tool()
    prompt = build_user_prompt(tool, {"secteur": "Industrie", "effectif": 42})

    assert "Tu es auditeur." in prompt
    assert "Secteur : Industrie" in prompt
    assert "Effectif : 42" in prompt
    # Aucune variable ne doit subsister
    assert "{secteur}" not in prompt
    assert "{effectif}" not in prompt


def test_deux_outils_produisent_des_prompts_differents():
    """Le cœur de l'écart E1 : sans le template, tous les outils sont identiques."""
    a = make_tool(id="a", title="Diagnostic A", promptTemplate="Analyse la trésorerie.")
    b = make_tool(id="b", title="Diagnostic B", promptTemplate="Analyse la cybersécurité.")

    inputs = {"secteur": "Industrie", "effectif": 10}
    assert build_user_prompt(a, inputs) != build_user_prompt(b, inputs)


def test_le_prompt_systeme_utilise_le_schema_de_l_outil():
    tool = make_tool(
        outputSchema={"type": "object", "properties": {"synthese": {"type": "string"}}}
    )
    system = build_system_prompt(tool, "fr")

    assert "synthese" in system
    # Le schéma diagnostic ne doit plus être codé en dur pour tous les outils
    assert "recommandations" not in system
    assert "French" in system
