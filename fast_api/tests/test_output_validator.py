"""Contrat de sortie forcé (écart E3 de l'audit).

Avant correction, la sortie du LLM était rendue telle quelle : un JSON vide ou
mal typé s'affichait comme un succès sans contenu.
"""

import pytest

from app.services.output_validator import (
    OutputValidationError,
    normalize_schema,
    validate_output,
)

DIAGNOSTIC_SCHEMA = {
    "type": "object",
    "properties": {
        "score_global": {"type": "number"},
        "axes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"axe": {"type": "string"}, "score": {"type": "number"}},
            },
        },
        "recommandations": {"type": "array", "items": {"type": "string"}},
    },
}

VALID = {
    "score_global": 72,
    "axes": [{"axe": "Gouvernance", "score": 60}],
    "recommandations": ["Formaliser la revue de direction."],
}


def test_sortie_conforme_acceptee():
    validate_output(VALID, DIAGNOSTIC_SCHEMA)


def test_les_proprietes_deviennent_obligatoires():
    """Les fiches ne déclarent jamais `required` : sans normalisation, {} passerait."""
    assert set(normalize_schema(DIAGNOSTIC_SCHEMA)["required"]) == {
        "score_global",
        "axes",
        "recommandations",
    }


def test_objet_vide_rejete():
    with pytest.raises(OutputValidationError):
        validate_output({}, DIAGNOSTIC_SCHEMA)


def test_propriete_manquante_rejetee():
    with pytest.raises(OutputValidationError):
        validate_output({"score_global": 72, "axes": []}, DIAGNOSTIC_SCHEMA)


def test_score_en_chaine_rejete():
    """Cas réel : les modèles 8B renvoient volontiers « élevé » au lieu de 72."""
    with pytest.raises(OutputValidationError):
        validate_output({**VALID, "score_global": "élevé"}, DIAGNOSTIC_SCHEMA)


def test_tableau_vide_rejete():
    with pytest.raises(OutputValidationError) as error:
        validate_output({**VALID, "recommandations": []}, DIAGNOSTIC_SCHEMA)
    assert "vide" in str(error.value)


def test_chaine_vide_rejetee():
    schema = {"type": "object", "properties": {"result": {"type": "string"}}}
    with pytest.raises(OutputValidationError):
        validate_output({"result": "   "}, schema)


def test_reponse_non_objet_rejetee():
    with pytest.raises(OutputValidationError):
        validate_output(["une liste"], DIAGNOSTIC_SCHEMA)


def test_schema_vide_n_est_pas_bloquant():
    """Une fiche sans schéma exploitable est un défaut de config, pas de génération."""
    validate_output({"quoi que ce soit": 1}, {})
