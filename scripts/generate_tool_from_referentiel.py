#!/usr/bin/env python3
"""Génère un auto-diagnostic à partir d'un référentiel.

Les quatre premiers auto-diagnostics ont été saisis à la main, et rien ne
garantissait que les clauses cotées dans le formulaire soient exactement celles
injectées dans le prompt. Un écart entre les deux fausse le score sans que rien
ne le signale.

La fiche est donc dérivée du référentiel : une clause donne un champ coté,
rattaché à son chapitre, avec l'exigence en aide et le poids du référentiel.
Le score calculé et les clauses injectées portent par construction sur le même
périmètre.

Usage :
    python3 scripts/generate_tool_from_referentiel.py ISO-22301
    python3 scripts/generate_tool_from_referentiel.py ISO-22301 --write
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REFERENTIELS = ROOT / "data" / "referentiels"
TOOLS = ROOT / "data" / "tools"

# Schéma commun aux diagnostics normatifs : le score et les axes sont calculés
# en Python, le modèle ne fait que les commenter (cf. services/scoring.py).
OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "score_global": {"type": "number", "description": "Score sur 100"},
        "axes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "axe": {"type": "string"},
                    "score": {"type": "number", "description": "Score sur 100"},
                },
                "required": ["axe", "score"],
            },
        },
        "recommandations": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["score_global", "axes", "recommandations"],
}


def charger(code: str) -> tuple[Path, dict]:
    for chemin in sorted(REFERENTIELS.glob("*.json")):
        data = json.loads(chemin.read_text(encoding="utf-8"))
        if data.get("code") == code:
            return chemin, data
    raise SystemExit(f"Référentiel introuvable pour le code {code}.")


def construire(ref: dict, *, titre: str, categorie: str, contexte: dict,
               priorite: str) -> dict:
    titres = {c["numero"]: c["titre"] for c in ref["chapitres"]}
    options = [
        {"label": f"{n} · {txt}", "score": float(n)}
        for n, txt in sorted(ref["echelle"].items())
    ]

    inputs = [
        {
            "name": "contexte",
            "type": "textarea",
            "question": "Décrivez brièvement votre organisme",
            "help": contexte["help"],
            "placeholder": contexte["placeholder"],
            "required": True,
        }
    ]

    for clause in ref["clauses"]:
        chapitre = clause["chapitre"].split(".")[0]
        inputs.append(
            {
                "name": "c" + clause["chapitre"].replace(".", "_"),
                "type": "select",
                "question": f"{clause['chapitre']} — {clause['intitule']}",
                "help": clause["exigence"],
                "options": options,
                "required": True,
                "chapitre": clause["chapitre"],
                "axe": f"{chapitre} — {titres[chapitre]}",
                "poids": clause["poids"],
            }
        )

    chapitres = ", ".join(
        f"{n} ({t})" for n, t in sorted(titres.items(), key=lambda x: int(x[0]))
    )
    code_lisible = ref["code"].replace("-", " ")

    prompt = (
        f"Tu es auditeur expérimenté, habitué aux audits de certification "
        f"{code_lisible}. L'organisme est décrit ainsi : {{contexte}}.\n\n"
        "Les clauses applicables et leur grille de maturité te sont fournies plus bas, "
        "ainsi que le positionnement déclaré pour chacune et les scores déjà calculés.\n\n"
        "Produis un rapport de pré-audit :\n"
        f"- pour chaque chapitre parmi {chapitres}, un constat appuyé sur les clauses "
        "réellement concernées, en citant leur numéro ;\n"
        "- pour les clauses les plus faibles, indique l'écart précis par rapport à "
        "l'exigence et la preuve qui serait demandée en audit ;\n"
        "- des recommandations priorisées, chacune rattachée à un numéro de clause, "
        "actionnables et proportionnées au contexte décrit.\n\n"
        f"{priorite}\n\n"
        "N'invente aucune exigence absente des clauses fournies. Ne recalcule pas les "
        "scores."
    )

    return {
        "id": f"auto-diagnostic-{ref['code'].lower().replace('-', '-')}",
        "title": titre,
        "category": categorie,
        "output_kind": "assessment",
        "referentiel_code": ref["code"],
        "referentiel_version": ref["version"],
        "inputs": inputs,
        "promptTemplate": prompt,
        "outputSchema": OUTPUT_SCHEMA,
    }


# Ce qui ne se déduit pas du référentiel : la façon de se présenter au client et
# le point sur lequel un auditeur de ce domaine insiste réellement.
HABILLAGE = {
    "ISO-22301": {
        "titre": "Auto-diagnostic ISO 22301",
        "contexte": {
            "help": "Secteur, effectif, sites, activités critiques, et objectif visé.",
            "placeholder": "Cabinet de conseil, 60 salariés, deux bureaux à Cotonou, visant la certification sous 18 mois.",
        },
        "priorite": "Traite en priorité les clauses du chapitre 8 : c'est là que se joue la capacité réelle de reprise, et un dispositif bien documenté mais jamais exercé n'a aucune valeur en audit.",
    },
    "ISO-37001": {
        "titre": "Auto-diagnostic ISO 37001",
        "contexte": {
            "help": "Secteur, effectif, pays d'activité, recours à des intermédiaires ou agents, exposition aux marchés publics.",
            "placeholder": "Entreprise de BTP, 200 salariés, répondant à des appels d'offres publics et travaillant avec des agents commerciaux.",
        },
        "priorite": "Traite en priorité l'appréciation du risque de corruption et la diligence raisonnable : des contrôles génériques, non proportionnés au risque réellement apprécié, sont l'écart le plus fréquemment relevé.",
    },
    "ISO-50001": {
        "titre": "Auto-diagnostic ISO 50001",
        "contexte": {
            "help": "Secteur, effectif, sites, principaux usages énergétiques et objectif visé.",
            "placeholder": "Unité de transformation agroalimentaire, 80 salariés, un site, forte consommation de froid.",
        },
        "priorite": "Traite en priorité la revue énergétique, les indicateurs et la situation énergétique de référence : sans référence établie, aucune amélioration de la performance ne peut être démontrée en audit.",
    },
    "ISO-22000": {
        "titre": "Auto-diagnostic ISO 22000",
        "contexte": {
            "help": "Position dans la chaîne alimentaire, effectif, sites, nature des produits et objectif visé.",
            "placeholder": "Unité de production de jus de fruits, 45 salariés, un site, distribution nationale.",
        },
        "priorite": "Traite en priorité l'analyse des dangers et le plan de maîtrise : c'est la seule partie qui ne peut pas être compensée par de la documentation, et c'est là que se concentrent les non-conformités majeures.",
    },
    "ISO-37301": {
        "titre": "Auto-diagnostic ISO 37301",
        "contexte": {
            "help": "Secteur, effectif, pays d'activité, nature des obligations de conformité applicables.",
            "placeholder": "Établissement de microfinance, 150 salariés, soumis à la réglementation bancaire régionale.",
        },
        "priorite": "Traite en priorité l'identification des obligations de conformité et le dispositif de remontée des préoccupations : un système qui ne recense pas ses obligations ne peut pas démontrer qu'il les respecte.",
    },
    "ISO-20000-1": {
        "titre": "Auto-diagnostic ISO/IEC 20000-1",
        "contexte": {
            "help": "Nature des services fournis, effectif, clients internes ou externes, périmètre visé.",
            "placeholder": "DSI interne, 25 personnes, services applicatifs et poste de travail pour 900 utilisateurs.",
        },
        "priorite": "Traite en priorité le chapitre 8 : il concentre l'essentiel du temps d'audit, et un catalogue de services non tenu à jour invalide tout ce qui s'y rattache.",
    },
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("code", help="code du référentiel, ex. ISO-22301")
    parser.add_argument("--categorie", default="Systèmes de Management ISO")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    _, ref = charger(args.code)
    habillage = HABILLAGE.get(args.code)
    if habillage is None:
        raise SystemExit(
            f"Aucun habillage défini pour {args.code}. Ajoute une entrée dans HABILLAGE."
        )

    tool = construire(
        ref,
        titre=habillage["titre"],
        categorie=args.categorie,
        contexte=habillage["contexte"],
        priorite=habillage["priorite"],
    )

    cible = TOOLS / f"{tool['id']}.json"
    cotees = len(tool["inputs"]) - 1
    axes = sorted({i["axe"] for i in tool["inputs"] if i.get("axe")})

    print(f"{tool['id']} — {cotees} clauses cotées, {len(axes)} axes")
    if args.write:
        cible.write_text(json.dumps(tool, ensure_ascii=False, indent=2) + "\n")
        print(f"  écrit dans {cible.relative_to(ROOT)}")
    else:
        print("  aperçu — relancer avec --write")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
