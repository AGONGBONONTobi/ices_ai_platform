"""Fusion des options traduites.

Un diagnostic normatif consulté dans une autre langue que le français passe par
`_merge_translation`. Deux régressions y sont possibles, toutes deux silencieuses
au moment de la fusion et visibles seulement à l'exécution :

- le modèle renvoie ses options sous forme de `dict` ; `model_copy` ne validant
  pas, elles restaient des `dict` là où le reste du code lit `.label`, ce qui
  levait une `AttributeError` au moment de valider les réponses ;
- le modèle traduit les libellés mais omet le `score` ; le reprendre tel quel
  faisait tomber la cotation sans qu'aucune erreur ne soit levée, donc sans que
  personne ne s'en aperçoive.

Le score fait donc foi côté source, seul le libellé est traduit.
"""

import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.schemas import ToolConfig, ToolSelectOption
from app.services.input_validator import _option_labels
from app.services.scoring import compute_scores
from app.services.translation import _merge_translation

ROOT = Path(__file__).resolve().parents[2]
TOOL_45001 = ROOT / "data" / "tools" / "auto-diagnostic-iso-45001.json"


@pytest.fixture
def outil() -> ToolConfig:
    return ToolConfig(**json.loads(TOOL_45001.read_text(encoding="utf-8")))


def _payload_traduit(outil: ToolConfig, *, avec_score: bool) -> dict:
    """Ce que renvoie réellement le modèle : des dicts, le score souvent absent."""
    champ = outil.inputs[1]
    options = []
    for index, origine in enumerate(champ.options or []):
        option = {"label": f"Level {index} in English"}
        if avec_score:
            option["score"] = origine.score
        options.append(option)
    return {
        "title": "ISO 45001 Self-Assessment",
        "inputs": [{"name": champ.name, "label": "4.2 — Needs", "options": options}],
    }


@pytest.mark.parametrize("avec_score", [True, False])
def test_les_options_traduites_restent_typees(outil: ToolConfig, avec_score: bool) -> None:
    fusion = _merge_translation(outil, _payload_traduit(outil, avec_score=avec_score))
    options = fusion.inputs[1].options

    assert options is not None
    assert all(isinstance(o, ToolSelectOption) for o in options)
    # Lire les libellés ne doit plus lever d'AttributeError.
    assert _option_labels(fusion.inputs[1])[0] == "Level 0 in English"


def test_le_score_source_survit_a_une_traduction_qui_l_omet(outil: ToolConfig) -> None:
    origine = [o.score for o in outil.inputs[1].options or []]
    fusion = _merge_translation(outil, _payload_traduit(outil, avec_score=False))

    assert [o.score for o in fusion.inputs[1].options or []] == origine


def test_le_score_calcule_est_identique_en_francais_et_traduit(outil: ToolConfig) -> None:
    reponses = {"contexte": "PME de 40 salariés."}
    for champ in outil.inputs:
        if champ.type == "select" and champ.chapitre:
            reponses[champ.name] = (champ.options or [])[2].label

    attendu = compute_scores(outil, reponses)

    fusion = _merge_translation(outil, _payload_traduit(outil, avec_score=False))
    reponses_traduites = dict(reponses)
    reponses_traduites[fusion.inputs[1].name] = (fusion.inputs[1].options or [])[2].label

    assert compute_scores(fusion, reponses_traduites) == attendu


def test_une_traduction_absente_laisse_les_options_intactes(outil: ToolConfig) -> None:
    fusion = _merge_translation(outil, {"title": "ISO 45001 Self-Assessment"})

    assert fusion.inputs[1].options == outil.inputs[1].options


def test_les_questions_sont_traduites_sans_remplacer_le_statut_ni_la_source(outil: ToolConfig, monkeypatch) -> None:
    # Métadonnées de disponibilité : elles doivent venir de la fiche de base,
    # même si une traduction ancienne ou erronée contient d'autres valeurs.
    from app.schemas import ToolExecution, ToolInput, ToolProvenance
    from app.services import translation

    outil = outil.model_copy(update={
        "execution": ToolExecution(mode="reference", notice="À valider."),
        "inputs": [ToolInput(name="contexte", type="textarea", question="Votre contexte ?", help="Décrivez votre objectif.")],
        "provenance": ToolProvenance(
            batch="6", document="Parcours.docx", code="D01-P3",
            domain="Orientation", blocks={"mesure": "Observation accompagnée."},
        ),
    })
    translated = {
        "title": "Translated title", "execution": {"mode": "preparation"},
        "provenance": {"code": "FAUX"},
        "inputs": [{"name": "contexte", "question": "Your context?", "help": "Describe your goal."}],
    }
    client = MagicMock()
    client.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value = SimpleNamespace(data=None)
    monkeypatch.setattr(translation, "get_supabase_anon", lambda: client)
    monkeypatch.setattr(translation, "get_supabase_admin", lambda: client)
    monkeypatch.setattr(translation, "get_settings", lambda: SimpleNamespace(groq_model="test"))
    sent = []

    def complete(**kwargs):
        sent.append(json.loads(kwargs["messages"][1]["content"]))
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(translated)))])

    monkeypatch.setattr(translation, "get_groq", lambda: SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=complete))))
    fusion = translation.translate_tool_config(outil, "en")

    assert fusion.title == "Translated title"
    assert fusion.inputs[0].question == "Your context?"
    assert fusion.inputs[0].help == "Describe your goal."
    assert sent[0]["inputs"][0]["question"] == "Votre contexte ?"
    assert sent[0]["inputs"][0]["help"] == "Décrivez votre objectif."
    assert fusion.execution.mode == "reference"
    assert fusion.execution.notice == "À valider."
    assert fusion.provenance.code == "D01-P3"
    assert fusion.provenance.blocks == {"mesure": "Observation accompagnée."}
