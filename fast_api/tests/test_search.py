"""Le plafond LLM ne doit pas cacher un outil correspondant à la requête.

Contrat : un titre ou code pertinent au-delà du premier lot reste suggérable,
sans envoyer plus de 50 candidats au fournisseur. L'ancien tronquage excluait
systématiquement les derniers outils d'une grande catégorie. Aucune couverture
de recherche existante ; frontière search_tools, sans seam de production.
"""

import pytest

from app.schemas import ToolSummary
from app.services import search


@pytest.mark.parametrize('query', ['métamémoire', 'metamemoire', 'T3.7'])
def test_outil_pertinent_apres_la_limite_reste_suggerable(monkeypatch, query):
    category = 'PROFILS APPRENANTS & PÉDAGOGIE'
    tools = [ToolSummary(id=f'outil-{i}', title=f'Préparer une activité de gestion {i}',
                         category=category) for i in range(75)]
    target = ToolSummary(id='psy-t3-7', title='Préparer — Métamémoire · T3.7',
                         category=category,
                         execution={'mode': 'preparation', 'notice': 'Support préparatoire.'})
    tools.append(target)
    monkeypatch.setattr(search, 'list_published_tools', lambda: tools)
    calls = []

    def provider(**kwargs):
        calls.append(kwargs)
        if len(calls) == 1:
            return {'categories': [category]}
        excerpt = kwargs['user_prompt'].split('Candidate tools:\n', 1)[1]
        assert len(excerpt.splitlines()) <= 50
        if 'psy-t3-7:' in excerpt:
            return {'results': [{'id': 'psy-t3-7', 'reason': 'Préparer la démarche ciblée.'}]}
        return {'results': []}

    monkeypatch.setattr(search, 'generate_structured', provider)
    result = search.search_tools(query)
    assert [item.id for item in result] == ['psy-t3-7']
    assert result[0].execution.mode == 'preparation'
