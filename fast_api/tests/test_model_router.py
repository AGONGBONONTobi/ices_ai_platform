"""Routage du modèle selon l'exigence de l'outil.

Le routage n'est pas une optimisation de coût : sans lui, les diagnostics
adossés à un référentiel ne s'exécutent pas du tout. Le modèle par défaut est
refusé par le fournisseur dès qu'un référentiel complet est injecté (limite de
tokens par minute du palier gratuit).
"""

import json
from pathlib import Path

import pytest

from app.config import get_settings
from app.schemas import ToolConfig
from app.services.model_router import needs_capable_model, select_model

ROOT = Path(__file__).resolve().parents[2]


def _tool(**kwargs) -> ToolConfig:
    base = dict(id="t", title="x", category="c", promptTemplate="p")
    return ToolConfig(**{**base, **kwargs})


@pytest.fixture(autouse=True)
def _cache_propre():
    """La configuration est mise en cache : on la relit entre les tests."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_un_outil_adosse_a_un_referentiel_exige_le_modele_capable():
    assert needs_capable_model(_tool(referentiel_code="ISO-9001", output_kind="assessment"))


def test_un_diagnostic_ou_un_document_exige_le_modele_capable():
    assert needs_capable_model(_tool(output_kind="assessment"))
    assert needs_capable_model(_tool(output_kind="document"))


def test_les_outils_courants_gardent_le_modele_rapide():
    for kind in ("analysis", "table", "profile"):
        assert not needs_capable_model(_tool(output_kind=kind))


def test_le_routage_peut_etre_desactive(monkeypatch):
    """Repli si le fournisseur limite le modèle capable."""
    monkeypatch.setenv("MODEL_ROUTING_ENABLED", "false")
    get_settings.cache_clear()
    settings = get_settings()
    assert select_model(_tool(referentiel_code="ISO-9001")) == settings.groq_model


def test_les_quatre_diagnostics_iso_sont_routes_vers_le_modele_capable():
    settings = get_settings()
    for code in ("9001", "14001", "45001", "27001"):
        path = ROOT / "data" / "tools" / f"auto-diagnostic-iso-{code}.json"
        tool = ToolConfig(**json.loads(path.read_text(encoding="utf-8")))
        assert select_model(tool) == settings.groq_model_capable, code


def test_les_deux_modeles_sont_distincts():
    """Un routage vers le même modèle ne routerait rien."""
    settings = get_settings()
    assert settings.groq_model_capable
    assert settings.groq_model_capable != settings.groq_model
