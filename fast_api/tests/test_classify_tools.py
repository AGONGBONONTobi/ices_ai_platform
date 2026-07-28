"""Classification des fiches par type de sortie (scripts/classify_tools.py).

Le script vit à la racine du dépôt mais sa logique mérite d'être verrouillée :
sa première version classait tous les outils juridiques en diagnostic scoré,
parce que la catégorie « JURIDIQUE & CONFORMITÉ » contient le mot « conformité ».
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

from classify_tools import classify, strip_scoring  # noqa: E402


@pytest.mark.parametrize(
    "titre,categorie,attendu",
    [
        # Le premier nom du titre nomme le livrable et prime sur tout le reste.
        ("Plan d'audit interne qualité", "AUDITS & CONFORMITÉ", "document"),
        ("Template de NDA & accord de confidentialité", "JURIDIQUE & CONFORMITÉ", "document"),
        ("Matrice des risques projet", "GESTION DE PROJETS & PMO", "table"),
        ("Test d'intelligence émotionnelle", "PERSONNALITÉ", "profile"),
        # Vrais diagnostics
        ("Auto-diagnostic ISO 9001", "Systèmes de Management ISO", "assessment"),
        ("Audit de la biodiversité & capital naturel", "AUDITS & CONFORMITÉ", "assessment"),
        # Ni livrable nommé, ni diagnostic
        ("Analyse des flux de trésorerie", "FINANCE & GESTION", "analysis"),
        ("Outil de veille juridique sectorielle", "JURIDIQUE & CONFORMITÉ", "analysis"),
    ],
)
def test_classification(titre, categorie, attendu):
    assert classify(titre, categorie) == attendu


def test_la_categorie_ne_prime_jamais_sur_le_titre():
    """« conformité » dans la catégorie ne doit pas transformer un modèle en audit."""
    assert classify("Template de contrat commercial", "JURIDIQUE & CONFORMITÉ") == "document"


def test_la_categorie_sert_de_recours_quand_le_titre_est_muet():
    assert classify("Outil sectoriel", "DIAGNOSTICS & ÉVALUATIONS") == "assessment"
    assert classify("Outil sectoriel", "MARKETING & COMMERCIAL") == "analysis"


def test_les_consignes_de_scoring_sont_retirees():
    avant = (
        "Tu es un consultant expert. Rédige la fiche de poste demandée. "
        "Analyse ces informations et donne un score global sur 100, une évaluation par axe."
    )
    apres = strip_scoring(avant)
    assert "score global" not in apres
    assert "Rédige la fiche de poste demandée." in apres


def test_le_template_n_est_jamais_vide_apres_nettoyage():
    """Un template entièrement consacré au scoring doit être conservé tel quel."""
    avant = "Donne un score global sur 100."
    assert strip_scoring(avant) == avant
