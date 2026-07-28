#!/usr/bin/env python3
"""Attribue un `output_kind` à chaque fiche du catalogue (chantier B7).

Le catalogue a été généré avec un `outputSchema` unique imposé à toutes les
fiches — score global, axes, recommandations — alors qu'une minorité d'outils
relève d'un diagnostic scoré. Ce script :

1. classe chaque fiche par heuristique sur son titre et sa catégorie ;
2. remplace son `outputSchema` par le schéma canonique du type retenu ;
3. retire du `promptTemplate` les consignes de scoring devenues contradictoires
   pour les types non scorés.

Les schémas canoniques sont importés du backend : il n'en existe qu'une seule
définition, dans `fast_api/app/services/output_kinds.py`.

L'heuristique n'est pas infaillible. Elle produit `catalogue_classification.csv`
pour relecture, et toute correction manuelle du champ `output_kind` d'une fiche
est préservée (option --respect-manual, active par défaut).

    python3 scripts/classify_tools.py --dry-run     # n'écrit rien
    python3 scripts/classify_tools.py               # applique
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "fast_api"))

from app.services.output_kinds import CANONICAL_SCHEMAS, OUTPUT_KINDS  # noqa: E402

TOOLS_DIR = ROOT / "data" / "tools"
REPORT = ROOT / "catalogue_classification.csv"

# Règles ordonnées : la première qui accroche l'emporte. L'ordre encode les
# priorités — « Checklist conformité » est un audit avant d'être un tableau.
RULES: list[tuple[str, str]] = [
    (
        "profile",
        r"\btest d[eu']|\bprofil\b|personnalit|comportement(al)?\b|apprenant|"
        r"intelligence (émotionnelle|culturelle)|styles? de leadership|"
        r"motivation intrinsèque|connaissance de soi|johari|andragogie|"
        r"bilan de compétences|soft skills",
    ),
    (
        "assessment",
        r"diagnostic|\baudit\b|auto-?diagnostic|auto-?évaluation|auto-?positionnement|"
        r"maturit|conformité|\bISO\s?\d|évaluation d|niveau de maîtrise|"
        r"scoring|éligibilité|readiness",
    ),
    (
        "table",
        r"matrice|cartographie|checklist|\bgrille\b|dashboard|tableau de bord|"
        r"reporting|registre|\bRACI\b|heat ?map|analytics|\bKPI",
    ),
    (
        "document",
        r"template|modèle d|\bstatuts\b|fiche de poste|offre d'emploi|\bcharte\b|"
        r"politique d|\bplan d|business plan|\bcontrat\b|procédure|lettre|"
        r"\brapport\b|note de|feuille de route|cahier des charges",
    ),
]

DEFAULT_KIND = "analysis"

# Le premier nom du titre nomme le livrable et prime sur tout le reste :
# « Plan d'audit interne » est un plan, pas un audit.
DELIVERABLE_PREFIX: list[tuple[str, str]] = [
    (
        "document",
        r"^\s*(template|modèle|plan|charte|politique|procédure|lettre|note|"
        r"cahier des charges|contrat|statuts|feuille de route|pitch|rapport)\b",
    ),
    (
        "table",
        r"^\s*(matrice|cartographie|checklist|grille|dashboard|tableau de bord|"
        r"registre|reporting)\b",
    ),
    ("profile", r"^\s*(test|profil|bilan de compétences)\b"),
]

# Recours quand le titre ne dit rien du livrable. Table explicite : réutiliser
# les motifs de RULES sur la catégorie ferait basculer « JURIDIQUE & CONFORMITÉ »
# — modèles de contrat compris — en diagnostic scoré, à cause du seul mot
# « conformité ».
CATEGORY_FALLBACK: list[tuple[str, str]] = [
    (r"AUDITS|DIAGNOSTICS|Systèmes de Management ISO|Certification|"
     r"Labels ESG|Conformité Bailleurs|Inspection|Économie Circulaire|"
     r"Gouvernance, Éthique", "assessment"),
    (r"PERSONNALITÉ|PROFILS APPRENANTS", "profile"),
    (r"REPORTING", "table"),
    (r"TEMPLATES", "document"),
]

# Consignes de scoring à retirer des fiches non scorées : elles contrediraient
# le schéma de sortie et désorientent le modèle.
SCORING_SENTENCE = re.compile(
    r"[^.!?]*\b(score\s+global|note\s+sur\s+100|sur\s+100|par\s+axe|"
    r"recommandations?\s+priorisé|niveaux?\s+de\s+maturité)\b[^.!?]*[.!?]",
    re.IGNORECASE,
)


def classify(title: str, category: str) -> str:
    """Le titre prime sur la catégorie.

    La catégorie ne décrit qu'un domaine : « JURIDIQUE & CONFORMITÉ » contient
    le mot « conformité » et ferait basculer en diagnostic scoré jusqu'aux
    modèles de contrat qu'elle contient. Elle ne sert donc que de recours quand
    le titre ne dit rien du livrable.
    """
    for kind, pattern in DELIVERABLE_PREFIX:
        if re.search(pattern, title, re.IGNORECASE):
            return kind

    for kind, pattern in RULES:
        if re.search(pattern, title, re.IGNORECASE):
            return kind

    for pattern, kind in CATEGORY_FALLBACK:
        if re.search(pattern, category, re.IGNORECASE):
            return kind

    return DEFAULT_KIND


def strip_scoring(template: str) -> str:
    """Retire les consignes de scoring, sauf si cela viderait le template.

    Une phrase porteuse de variables `{…}` est conservée même si elle mentionne
    un score : la supprimer déconnecterait les réponses de l'utilisateur du
    prompt métier.
    """

    def drop(match: re.Match[str]) -> str:
        sentence = match.group(0)
        return sentence if "{" in sentence else ""

    cleaned = SCORING_SENTENCE.sub(drop, template)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    return cleaned if len(cleaned) >= 40 else template


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="n'écrit aucune fiche")
    parser.add_argument(
        "--force",
        action="store_true",
        help="réécrit aussi les fiches dont l'output_kind a été corrigé à la main",
    )
    args = parser.parse_args()

    files = sorted(TOOLS_DIR.glob("*.json"))
    if not files:
        print(f"Aucune fiche dans {TOOLS_DIR}", file=sys.stderr)
        return 1

    counts: Counter[str] = Counter()
    changed = kept = stripped = 0
    rows = []

    for path in files:
        tool = json.loads(path.read_text(encoding="utf-8"))
        existing = tool.get("output_kind")

        if existing in OUTPUT_KINDS and not args.force:
            kind, source = existing, "manuel"
            kept += 1
        else:
            kind, source = classify(tool["title"], tool["category"]), "heuristique"

        counts[kind] += 1
        rows.append((tool["id"], tool["title"], tool["category"], kind, source))

        before = json.dumps(tool, sort_keys=True)

        tool["output_kind"] = kind
        tool["outputSchema"] = CANONICAL_SCHEMAS[kind]
        if kind != "assessment":
            new_template = strip_scoring(tool["promptTemplate"])
            if new_template != tool["promptTemplate"]:
                tool["promptTemplate"] = new_template
                stripped += 1

        if json.dumps(tool, sort_keys=True) != before:
            changed += 1
            if not args.dry_run:
                path.write_text(
                    json.dumps(tool, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
                )

    if not args.dry_run:
        with REPORT.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["id", "titre", "categorie", "output_kind", "source"])
            writer.writerows(rows)

    total = len(files)
    print(f"{total} fiches analysées{'  (simulation)' if args.dry_run else ''}\n")
    for kind, n in counts.most_common():
        print(f"  {kind:11} {n:5}  {n * 100 // total:3} %")
    print(f"\n  fiches modifiées            : {changed}")
    print(f"  consignes de score retirées : {stripped}")
    if kept:
        print(f"  classements manuels gardés  : {kept}")
    if not args.dry_run:
        print(f"\n  relecture : {REPORT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
