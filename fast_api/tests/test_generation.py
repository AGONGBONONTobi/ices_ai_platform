"""Retries sur sortie non conforme, et échec explicite plutôt que résultat vide."""

import json
from types import SimpleNamespace

import pytest

from app.services import generation
from app.services.generation import GenerationError, generate_structured

SCHEMA = {
    "type": "object",
    "properties": {
        "score_global": {"type": "number"},
        "recommandations": {"type": "array", "items": {"type": "string"}},
    },
}

VALID = {"score_global": 70, "recommandations": ["Faire ceci."]}


class FakeGroq:
    """Rejoue une suite de réponses préparées et enregistre les messages reçus."""

    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        self.calls.append(kwargs["messages"])
        content = self.responses.pop(0)
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
        )


@pytest.fixture
def fake_groq(monkeypatch):
    def install(responses):
        client = FakeGroq(responses)
        monkeypatch.setattr(generation, "get_groq", lambda: client)
        return client

    return install


def test_sortie_valide_du_premier_coup(fake_groq):
    client = fake_groq([json.dumps(VALID)])
    assert generate_structured("sys", "user", SCHEMA) == VALID
    assert len(client.calls) == 1


def test_retry_apres_sortie_non_conforme(fake_groq):
    client = fake_groq([json.dumps({"score_global": "élevé"}), json.dumps(VALID)])

    assert generate_structured("sys", "user", SCHEMA) == VALID
    assert len(client.calls) == 2

    # L'erreur de validation est réinjectée dans le second appel
    retry_prompt = client.calls[1][-1]["content"]
    assert "schema" in retry_prompt.lower()


def test_retry_apres_json_invalide(fake_groq):
    client = fake_groq(["ceci n'est pas du JSON", json.dumps(VALID)])
    assert generate_structured("sys", "user", SCHEMA) == VALID
    assert len(client.calls) == 2


def test_echec_definitif_apres_tous_les_essais(fake_groq):
    """Un résultat non validé n'est jamais rendu : on lève, l'appelant renvoie 502."""
    client = fake_groq([json.dumps({}) for _ in range(3)])

    with pytest.raises(GenerationError):
        generate_structured("sys", "user", SCHEMA)

    assert len(client.calls) == 3  # 1 essai + 2 retries


def test_panne_fournisseur_remontee(fake_groq, monkeypatch):
    def boom(**kwargs):
        raise RuntimeError("rate limit")

    client = fake_groq([])
    monkeypatch.setattr(client.chat.completions, "create", boom)

    with pytest.raises(GenerationError, match="indisponible"):
        generate_structured("sys", "user", SCHEMA)
