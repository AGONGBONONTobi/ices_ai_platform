"""Typage des sorties (chantier B7).

Le catalogue imposait un score de maturité à tous les outils. Ces tests
vérifient que chaque type produit bien son propre contrat, et surtout que
`profile` ne réintroduit jamais de note.
"""

import pytest

from app.schemas import ToolConfig
from app.services.output_kinds import (
    CANONICAL_SCHEMAS,
    DEFAULT_OUTPUT_KIND,
    OUTPUT_KINDS,
    guidance_for,
    normalize_kind,
    schema_for,
)
from app.services.output_validator import OutputValidationError, validate_output
from app.services.prompt_builder import build_system_prompt


def _tool(kind: str) -> ToolConfig:
    return ToolConfig(
        id="t",
        title="Outil de test",
        category="TEST",
        promptTemplate="Analyse la situation décrite.",
        outputSchema=schema_for(kind),
        output_kind=kind,
    )


def test_chaque_type_a_un_schema_et_une_consigne():
    for kind in OUTPUT_KINDS:
        assert CANONICAL_SCHEMAS[kind]["properties"]
        assert guidance_for(kind)


def test_type_inconnu_replie_sur_le_defaut():
    assert normalize_kind("n'importe quoi") == DEFAULT_OUTPUT_KIND
    assert normalize_kind(None) == DEFAULT_OUTPUT_KIND
    assert schema_for("inconnu") == CANONICAL_SCHEMAS[DEFAULT_OUTPUT_KIND]


def test_fiche_sans_output_kind_reste_valide():
    """Les fiches antérieures au typage ne déclarent rien."""
    tool = ToolConfig(
        id="t", title="x", category="c", promptTemplate="p", outputSchema={}
    )
    assert tool.output_kind == DEFAULT_OUTPUT_KIND


@pytest.mark.parametrize("kind", [k for k in OUTPUT_KINDS if k != "assessment"])
def test_les_types_non_scores_n_exigent_aucun_score(kind):
    properties = CANONICAL_SCHEMAS[kind]["properties"]
    assert "score_global" not in properties
    assert "axes" not in properties


def test_profile_mesure_une_intensite_pas_un_score():
    """Une dimension de personnalité n'est ni bonne ni mauvaise."""
    dimension = CANONICAL_SCHEMAS["profile"]["properties"]["dimensions"]["items"]
    assert "intensite" in dimension["properties"]
    assert "score" not in dimension["properties"]

    guidance = guidance_for("profile")
    assert "not a grade" in guidance
    assert "Never phrase a dimension as good or bad" in guidance


def test_le_prompt_systeme_porte_la_consigne_du_type():
    prompt = build_system_prompt(_tool("document"), "fr")
    assert "READY-TO-USE DOCUMENT" in prompt
    assert "score_global" not in prompt


def test_le_prompt_systeme_replie_sur_le_schema_canonique():
    """Une fiche sans outputSchema ne doit pas envoyer un schéma vide au modèle."""
    tool = ToolConfig(
        id="t", title="x", category="c", promptTemplate="p", outputSchema={},
        output_kind="table",
    )
    prompt = build_system_prompt(tool, "fr")
    assert "colonnes" in prompt and "lignes" in prompt


def test_le_schema_du_type_est_reellement_contraignant():
    """Chaque propriété déclarée est obligatoire : un objet vide doit échouer."""
    for kind in OUTPUT_KINDS:
        with pytest.raises(OutputValidationError):
            validate_output({}, schema_for(kind))


def test_sortie_conforme_acceptee_pour_chaque_type():
    valides = {
        "assessment": {
            "score_global": 62,
            "axes": [{"axe": "Processus", "score": 55}],
            "recommandations": ["Formaliser les procédures"],
        },
        "profile": {
            "synthese": "Profil orienté autonomie.",
            "dimensions": [
                {"dimension": "Autonomie", "intensite": 80, "interpretation": "Marge de choix élevée."}
            ],
            "pistes": ["Négocier des marges d'autonomie"],
        },
        "analysis": {
            "synthese": "La trésorerie reste tendue au T3.",
            "sections": [{"titre": "Saisonnalité", "contenu": "Creux entre juillet et septembre."}],
            "points_cles": ["Concentration client élevée"],
        },
        "document": {
            "titre": "Fiche de poste",
            "sections": [{"titre": "Missions", "contenu": "Piloter le SMQ."}],
        },
        "table": {
            "colonnes": ["Risque", "Impact"],
            "lignes": [["Retard fournisseur", "Fort"]],
        },
    }
    for kind, payload in valides.items():
        validate_output(payload, schema_for(kind))


def test_un_score_texte_est_refuse():
    with pytest.raises(OutputValidationError):
        validate_output(
            {
                "score_global": "élevé",
                "axes": [{"axe": "Processus", "score": 55}],
                "recommandations": ["x"],
            },
            schema_for("assessment"),
        )
