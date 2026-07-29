"""Socle normatif et scoring déterministe (chantiers B4, B5, B6).

Deux garanties à tenir :

- un score d'auto-évaluation est *calculé*, donc reproductible — deux
  exécutions avec les mêmes réponses doivent donner le même chiffre ;
- les exigences injectées dans le prompt viennent du socle, jamais de la
  mémoire du modèle.
"""

import json
from pathlib import Path

import pytest

from app.schemas import ToolConfig
from app.services.referentiels import Clause, Referentiel, render_clauses
from app.services.scoring import compute_scores, is_scorable, render_scores

ROOT = Path(__file__).resolve().parents[2]
ISO_9001 = ROOT / "data" / "referentiels" / "iso-9001-2015.json"
TOOL_9001 = ROOT / "data" / "tools" / "auto-diagnostic-iso-9001.json"


@pytest.fixture
def referentiel() -> Referentiel:
    data = json.loads(ISO_9001.read_text(encoding="utf-8"))
    return Referentiel(data, [Clause(c) for c in data["clauses"]])


@pytest.fixture
def outil() -> ToolConfig:
    return ToolConfig(**json.loads(TOOL_9001.read_text(encoding="utf-8")))


def _reponses(outil: ToolConfig, niveau_par_chapitre: dict[str, float]) -> dict:
    par_score = {
        o.score: o.label
        for i in outil.inputs
        if i.type == "select"
        for o in i.options or []
        if not isinstance(o, str)
    }
    return {
        i.name: par_score[niveau_par_chapitre[i.chapitre.split(".")[0]]]
        for i in outil.inputs
        if i.type == "select" and i.chapitre
    }


# --- Socle -----------------------------------------------------------------


def test_le_referentiel_local_est_lisible(referentiel):
    assert referentiel.reference == "ISO-9001:2015"
    assert len(referentiel.clauses) >= 20
    assert referentiel.clause("9.2") is not None


def test_chaque_clause_porte_ce_qui_fait_sa_valeur(referentiel):
    """Preuves attendues et écarts fréquents : c'est l'expertise que
    l'utilisateur ne peut pas produire seul."""
    for clause in referentiel.clauses:
        assert clause.exigence.strip()
        assert clause.preuves, f"clause {clause.chapitre} sans preuve attendue"
        assert clause.erreurs_frequentes, f"clause {clause.chapitre} sans écart fréquent"


def test_le_rendu_injecte_exigences_preuves_et_erreurs(referentiel):
    rendu = render_clauses(referentiel, ["9.2"])
    assert "ISO-9001:2015" in rendu
    assert "[9.2]" in rendu
    assert "Preuves attendues" in rendu
    assert "Écarts fréquemment constatés" in rendu
    assert "N'invente aucune exigence" in rendu


def test_le_rendu_se_limite_aux_chapitres_demandes(referentiel):
    rendu = render_clauses(referentiel, ["4.1"])
    assert "[4.1]" in rendu
    assert "[9.2]" not in rendu


def test_un_filtre_sans_correspondance_ne_vide_pas_le_referentiel(referentiel):
    """Mieux vaut tout injecter qu'un prompt sans aucune exigence."""
    assert "[4.1]" in render_clauses(referentiel, ["99.9"])


# --- Scoring ---------------------------------------------------------------


def test_l_outil_iso_est_scorable(outil):
    assert is_scorable(outil)
    assert outil.referentiel_code == "ISO-9001"


def test_le_score_est_reproductible(outil):
    reponses = _reponses(outil, {"4": 1, "5": 1, "6": 0, "7": 2, "8": 2, "9": 1, "10": 0})
    assert compute_scores(outil, reponses) == compute_scores(outil, reponses)


def test_les_bornes_de_l_echelle_donnent_0_et_100(outil):
    zero = _reponses(outil, dict.fromkeys("456789", 0.0) | {"10": 0.0})
    plein = _reponses(outil, dict.fromkeys("456789", 4.0) | {"10": 4.0})
    assert compute_scores(outil, zero)["score_global"] == 0
    assert compute_scores(outil, plein)["score_global"] == 100


def test_le_score_est_rendu_par_chapitre_de_la_norme(outil):
    scores = compute_scores(outil, _reponses(outil, dict.fromkeys("456789", 2.0) | {"10": 0.0}))
    axes = {a["axe"]: a["score"] for a in scores["axes"]}
    assert any(a.startswith("9 —") for a in axes)
    assert axes[next(a for a in axes if a.startswith("10 —"))] == 0
    assert axes[next(a for a in axes if a.startswith("4 —"))] == 50


def test_un_outil_sans_option_cotee_n_est_pas_score():
    outil = ToolConfig(
        id="t", title="x", category="c", promptTemplate="p",
        inputs=[{"name": "a", "type": "select", "options": ["Oui", "Non"]}],
    )
    assert not is_scorable(outil)
    assert compute_scores(outil, {"a": "Oui"}) is None


def test_le_prompt_interdit_au_modele_de_recalculer(outil):
    scores = compute_scores(outil, _reponses(outil, dict.fromkeys("456789", 2.0) | {"10": 2.0}))
    rendu = render_scores(scores)
    assert "ne les recalcule pas" in rendu
    assert f"{scores['score_global']}/100" in rendu
