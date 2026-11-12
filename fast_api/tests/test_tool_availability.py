"""Le statut d'une fiche en base gouverne les deux opérations coûteuses.

Contrat HTTP : une référence consultable ne déclenche ni passation ni extraction,
même si le client falsifie son mode ou si le quota gratuit est épuisé. Les outils
existants restent exécutables. Les dépendances distantes sont remplacées aux
frontières de l'API ; aucune configuration de production dédiée au test.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.schemas import Profile, ToolConfig


@pytest.fixture
def api(monkeypatch):
    # Les routers initialisent slowapi à l'import. Valeurs locales factices,
    # jamais de connexion Supabase ou Groq dans ces tests.
    for name, value in {
        "SUPABASE_URL": "https://example.supabase.co",
        "SUPABASE_ANON_KEY": "test",
        "SUPABASE_SERVICE_ROLE_KEY": "test",
        "GROQ_API_KEY": "test",
    }.items():
        monkeypatch.setenv(name, value)

    from app.deps import get_current_profile
    from app.rate_limit import limiter
    from app.routers import execute, tools

    monkeypatch.setattr(limiter, "enabled", False)
    app = FastAPI()
    app.state.limiter = limiter
    app.include_router(execute.router, prefix="/api")
    app.include_router(tools.router, prefix="/api")
    app.dependency_overrides[get_current_profile] = lambda: Profile(
        id="local-test", plan="pro"
    )
    with TestClient(app) as client:
        yield client, execute, tools, app, get_current_profile


def make_tool(mode=None):
    data = {
        "id": "source-test", "title": "Préparation", "category": "RH & CAPITAL HUMAIN",
        "inputs": [], "promptTemplate": "Prépare une démarche descriptive.",
        "outputSchema": {"type": "object", "properties": {"synthese": {"type": "string"}}},
    }
    if mode:
        data["execution"] = {"mode": mode, "notice": "Épreuve non disponible."}
    return ToolConfig(**data)


@pytest.mark.parametrize("operation", ["execute", "extract"])
def test_reference_refusee_avant_llm_et_quota(api, monkeypatch, operation):
    client, execute, tools, app, profile_dependency = api
    app.dependency_overrides[profile_dependency] = lambda: Profile(
        id="local-test", plan="free", tools_used_count=10_000
    )
    tool = make_tool("reference")
    monkeypatch.setattr(execute, "get_published_tool", lambda _: tool)
    monkeypatch.setattr(tools, "get_published_tool", lambda _: tool)

    def unexpected(*args, **kwargs):
        pytest.fail("Une référence ne doit ni appeler le LLM ni accéder au quota.")

    monkeypatch.setattr(execute, "translate_tool_config", unexpected)
    monkeypatch.setattr(execute, "generate_structured", unexpected)
    monkeypatch.setattr(execute, "get_supabase_admin", unexpected)
    monkeypatch.setattr(tools, "extract_text", unexpected)
    monkeypatch.setattr(tools, "extract_form_values", unexpected)

    if operation == "execute":
        response = client.post("/api/execute", json={
            "toolId": tool.id, "userInputs": {}, "lang": "en",
            "execution": {"mode": "preparation"},
        })
    else:
        response = client.post(f"/api/tools/{tool.id}/extract", files={
            "file": ("note.txt", b"contexte", "text/plain")
        })

    assert response.status_code == 409
    assert response.json()["detail"] == {
        "error": "TOOL_REFERENCE_ONLY", "details": "Épreuve non disponible."
    }


@pytest.mark.parametrize("mode", [None, "preparation"])
def test_outil_executable_et_consigne_preparation(api, monkeypatch, mode):
    client, execute, _, _, _ = api
    tool = make_tool(mode)
    monkeypatch.setattr(execute, "get_published_tool", lambda _: tool)
    monkeypatch.setattr(execute, "translate_tool_config", lambda config, _: config)
    prompts = []

    def generate(**kwargs):
        prompts.append(kwargs["system_prompt"])
        return {"synthese": "Démarche préparée."}

    monkeypatch.setattr(execute, "generate_structured", generate)
    response = client.post("/api/execute", json={"toolId": tool.id, "userInputs": {}})

    assert response.status_code == 200
    assert response.json() == {"result": {"synthese": "Démarche préparée."}}
    assert len(prompts) == 1
    assert ("PREPARATION GUIDE ONLY" in prompts[0]) is (mode == "preparation")
