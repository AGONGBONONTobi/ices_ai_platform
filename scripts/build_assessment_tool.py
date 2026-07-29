#!/usr/bin/env python3
"""Construit une fiche d'auto-diagnostic à partir d'un référentiel (chantier B6).

La fiche « Auto-diagnostic ISO 9001 » du catalogue posait 5 questions ouvertes
génériques et laissait le modèle inventer un score. Elle pose désormais une
question par clause, rattachée à son chapitre, avec une grille de maturité cotée
— ce qui rend le score calculable et reproductible.

Écrire ce générateur plutôt que la fiche à la main permet de traiter les normes
suivantes (14001, 45001, 27001) sans repartir de zéro : il suffit d'ajouter le
socle correspondant dans data/referentiels/.

    python3 scripts/build_assessment_tool.py ISO-9001 2015 auto-diagnostic-iso-9001
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "fast_api"))

from app.services.output_kinds import schema_for  # noqa: E402

REFERENTIELS_DIR = ROOT / "data" / "referentiels"
TOOLS_DIR = ROOT / "data" / "tools"


def slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def load_referentiel(code: str, version: str) -> dict:
    for path in sorted(REFERENTIELS_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("code") == code and data.get("version") == version:
            return data
    raise SystemExit(f"Référentiel introuvable : {code}:{version}")


def build(referentiel: dict, tool_id: str) -> dict:
    echelle = referentiel["echelle"]
    # Les niveaux sont l'échelle de cotation : leur clé est le score.
    options = [
        {"label": f"{niveau} · {libelle}", "score": float(niveau)}
        for niveau, libelle in sorted(echelle.items())
    ]

    titres = {
        c["numero"]: f"{c['numero']} — {c['titre']}" for c in referentiel["chapitres"]
    }

    inputs = []
    for clause in referentiel["clauses"]:
        inputs.append(
            {
                "name": f"c{slug(clause['chapitre'])}",
                "type": "select",
                "question": f"{clause['chapitre']} — {clause['intitule']}",
                "help": clause["exigence"],
                "options": options,
                "required": True,
                # `chapitre` sert à sélectionner les clauses à injecter, il doit
                # donc être exact. `axe` est l'intitulé lisible sous lequel le
                # score sera regroupé et affiché.
                "chapitre": clause["chapitre"],
                "axe": titres.get(clause["chapitre"].split(".")[0], clause["chapitre"]),
                "poids": clause.get("poids", 1),
            }
        )

    # Le contexte de l'organisme conditionne la pertinence des recommandations :
    # les mêmes écarts n'appellent pas les mêmes priorités selon la taille et le
    # secteur. On l'ajoute en tête, sans effet sur le score.
    inputs.insert(
        0,
        {
            "name": "contexte",
            "type": "textarea",
            "question": "Décrivez brièvement votre organisme",
            "help": "Secteur, effectif, sites, nature des produits ou services, et objectif visé (certification, mise à niveau interne...).",
            "placeholder": "PME agroalimentaire, 40 salariés, un site de production, visant la certification sous 12 mois.",
            "required": True,
        },
    )

    chapitres = ", ".join(
        f"{c['numero']} ({c['titre']})" for c in referentiel["chapitres"]
    )

    prompt = (
        f"Tu es auditeur qualité expérimenté, habitué aux audits de certification "
        f"{referentiel['code']}. L'organisme est décrit ainsi : {{contexte}}.\n\n"
        f"Les clauses applicables et leur grille de maturité te sont fournies plus bas, "
        f"ainsi que le positionnement déclaré pour chacune et les scores déjà calculés.\n\n"
        f"Produis un rapport de pré-audit :\n"
        f"- pour chaque chapitre parmi {chapitres}, un constat appuyé sur les clauses "
        f"réellement concernées, en citant leur numéro ;\n"
        f"- pour les clauses les plus faibles, indique l'écart précis par rapport à "
        f"l'exigence et la preuve qui serait demandée en audit ;\n"
        f"- des recommandations priorisées, chacune rattachée à un numéro de clause, "
        f"actionnables et proportionnées au contexte décrit.\n\n"
        f"N'invente aucune exigence absente des clauses fournies. Ne recalcule pas les scores."
    )

    return {
        "id": tool_id,
        "title": f"Auto-diagnostic {referentiel['code'].replace('-', ' ')}",
        "category": "Systèmes de Management ISO",
        "output_kind": "assessment",
        "referentiel_code": referentiel["code"],
        "referentiel_version": referentiel["version"],
        "inputs": inputs,
        "promptTemplate": prompt,
        "outputSchema": schema_for("assessment"),
    }


def main() -> int:
    if len(sys.argv) < 4:
        print(__doc__)
        return 1

    code, version, tool_id = sys.argv[1], sys.argv[2], sys.argv[3]
    referentiel = load_referentiel(code, version)
    tool = build(referentiel, tool_id)

    path = TOOLS_DIR / f"{tool_id}.json"
    path.write_text(json.dumps(tool, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    questions = len([i for i in tool["inputs"] if i["type"] == "select"])
    chapitres = sorted({i["chapitre"] for i in tool["inputs"] if i.get("chapitre")})
    print(f"{path.relative_to(ROOT)}")
    print(f"  {questions} questions cotées, réparties sur {len(chapitres)} chapitres : {', '.join(chapitres)}")
    print(f"  référentiel : {code}:{version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
