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


def tri_numero(numero: str) -> tuple:
    """Ordre naturel d'un numéro pointé : 4.10 vient après 4.9, pas avant."""
    parts = []
    for part in numero.split("."):
        parts.append((0, int(part), "") if part.isdigit() else (1, 0, part))
    return tuple(parts)


def axe_de(chapitre: str, titres: dict[str, str]) -> str:
    """Chapitre auquel rattacher une clause, par plus long préfixe déclaré.

    Découper sur le premier point suffisait tant que tous les référentiels
    suivaient la structure harmonisée ISO, où le chapitre tient en un chiffre.
    Ce n'est pas le cas partout : les sept questions centrales d'ISO 26000 sont
    numérotées 6.2 à 6.8, et les phases d'une ACV 4.2 à 4.7. Découper sur le
    premier point les aurait toutes rassemblées sous un axe « 6 » ou « 4 »
    unique, réduisant à un seul point le radar de positionnement.

    On retient donc le numéro de chapitre déclaré le plus long qui préfixe
    celui de la clause, la comparaison se faisant sur les segments pour que
    « 6.8 » ne passe pas pour un préfixe de « 6.81 ».
    """
    segments = chapitre.split(".")
    for taille in range(len(segments), 0, -1):
        candidat = ".".join(segments[:taille])
        if candidat in titres:
            return candidat
    raise SystemExit(
        f"La clause {chapitre} ne se rattache à aucun chapitre déclaré "
        f"({', '.join(sorted(titres, key=tri_numero))})."
    )


def construire(ref: dict, *, titre: str, categorie: str, contexte: dict,
               priorite: str, role: str | None = None) -> dict:
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
        chapitre = axe_de(clause["chapitre"], titres)
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
        f"{n} ({t})" for n, t in sorted(titres.items(), key=lambda x: tri_numero(x[0]))
    )
    code_lisible = ref["code"].replace("-", " ")

    # Tous les référentiels ne mènent pas à une certification : le RGPD est une
    # obligation légale et le CES de la Banque mondiale une condition de
    # financement. Annoncer un « audit de certification » y serait faux, d'où la
    # possibilité de décrire le rôle attendu dans l'habillage.
    role = role or (
        f"Tu es auditeur expérimenté, habitué aux audits de certification {code_lisible}."
    )

    prompt = (
        f"{role} L'organisme est décrit ainsi : {{contexte}}.\n\n"
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
        "role": "Tu es auditeur expérimenté en continuité d'activité, habitué aux audits de certification ISO-22301.",
        "contexte": {
            "help": "Secteur, effectif, sites, activités critiques, et objectif visé (certification, mise à niveau interne...).",
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
    "SMI-QSE": {
        "titre": "Auto-diagnostic SMI intégré QSE",
        "categorie": "Systèmes de Management ISO",
        "role": "Tu es auditeur QSE expérimenté, habitué aux audits de certification combinés ISO 9001, ISO 14001 et ISO 45001.",
        "contexte": {
            "help": "Secteur, effectif, sites, normes déjà certifiées ou visées, et organisation actuelle de la fonction QSE.",
            "placeholder": "Entreprise de BTP, 180 salariés, trois chantiers, certifiée ISO 9001 et visant l'intégration 14001 et 45001 sous 18 mois.",
        },
        "priorite": "Distingue systématiquement ce qui se mutualise de ce qui ne se mutualise pas. Les informations documentées, la veille réglementaire, l'audit interne et la revue de direction se fusionnent sans perte ; l'identification des aspects environnementaux, celle des dangers pour la santé-sécurité et la consultation des travailleurs n'ont pas d'équivalent dans les autres normes et disparaissent souvent lors de l'intégration. Signale explicitement les redondances supprimables et les exigences que la fusion risque de faire perdre.",
    },
    "ISO-26000": {
        "titre": "Diagnostic RSE ISO 26000",
        "categorie": "Labels ESG / RSE / Durabilité",
        "role": "Tu es consultant en responsabilité sociétale, familier des évaluations conduites sur la base d'ISO 26000. Cette norme énonce des lignes directrices et ne donne lieu à aucune certification : ne laisse jamais entendre le contraire, et parle de niveau de maturité, pas de conformité certifiable.",
        "contexte": {
            "help": "Secteur, effectif, implantation, parties prenantes principales, et objectif visé (structuration interne, label, exigence d'un donneur d'ordre...).",
            "placeholder": "Entreprise agroalimentaire, 120 salariés, deux sites au Bénin, sollicitée par un client européen sur ses engagements RSE.",
        },
        "priorite": "Traite en priorité la gouvernance (6.2) : c'est elle qui détermine si les autres questions centrales sont réellement arbitrées ou seulement affichées. Rattache chaque recommandation à une question centrale et à un domaine d'action, et proportionne-la à la sphère d'influence réelle de l'organisation.",
    },
    "ISO-13485": {
        "titre": "Auto-diagnostic ISO 13485",
        "categorie": "Certification de Produits & Services",
        "role": "Tu es auditeur expérimenté en dispositifs médicaux, habitué aux audits de certification ISO 13485.",
        "contexte": {
            "help": "Rôle réglementaire assumé (fabricant, mandataire, importateur, distributeur), nature des dispositifs, classe de risque, marchés visés, effectif et sites.",
            "placeholder": "Fabricant de consommables médicaux stériles, 60 salariés, un site, visant l'exportation vers l'UEMOA et l'Union européenne.",
        },
        "priorite": "Traite en priorité la gestion des risques, le dossier de dispositif médical et la traçabilité : ce sont les trois points où une non-conformité majeure bloque la certification, et ils se tiennent l'un l'autre. Rappelle que les exigences réglementaires dépendent du marché visé et ne se déduisent pas de la norme seule.",
    },
    "ISO-17020": {
        "titre": "Auto-diagnostic ISO/IEC 17020 — organisme d'inspection",
        "categorie": "Inspection Technique & Vérification",
        "role": "Tu es évaluateur pour un organisme d'accréditation, habitué aux évaluations ISO/IEC 17020. On parle d'accréditation et non de certification : emploie le vocabulaire de l'accréditation dans tout le rapport.",
        "contexte": {
            "help": "Domaines d'inspection couverts, type d'organisme revendiqué (A, B ou C), effectif d'inspecteurs, appartenance éventuelle à un groupe, et objectif visé.",
            "placeholder": "Organisme d'inspection d'ascenseurs et d'appareils de levage, 12 inspecteurs, indépendant, visant l'accréditation type A.",
        },
        "priorite": "Traite en priorité l'impartialité et le type d'organisme revendiqué : c'est le point d'entrée de toute évaluation, et un type A revendiqué à tort invalide l'ensemble du dossier. Vient ensuite la qualification et la surveillance des inspecteurs, qui est le premier motif d'écart en évaluation.",
    },
    "ISO-17025": {
        "titre": "Auto-diagnostic ISO/IEC 17025 — laboratoire",
        "categorie": "Inspection Technique & Vérification",
        "role": "Tu es évaluateur technique pour un organisme d'accréditation, habitué aux évaluations ISO/IEC 17025. On parle d'accréditation et non de certification, et la portée d'accréditation se définit essai par essai : emploie ce vocabulaire dans tout le rapport.",
        "contexte": {
            "help": "Nature des essais ou étalonnages réalisés, portée visée, effectif technique, équipements principaux, et objectif visé.",
            "placeholder": "Laboratoire d'analyses physico-chimiques de l'eau, 9 techniciens, visant l'accréditation sur huit paramètres.",
        },
        "priorite": "Traite en priorité la validation des méthodes, l'incertitude de mesure et l'assurance de la validité des résultats : ces trois exigences forment la démonstration technique de compétence, et c'est là que se concentrent les écarts en évaluation initiale. Rappelle qu'une portée revendiquée au-delà des méthodes réellement validées est le motif de refus le plus courant.",
    },
    "ISO-14040": {
        "titre": "Auto-diagnostic ACV — ISO 14040/14044",
        "categorie": "Économie Circulaire & Déchets",
        "role": "Tu es praticien de l'analyse du cycle de vie, habitué à la revue critique d'études conduites selon ISO 14040 et ISO 14044. Ces normes encadrent la conduite d'une étude et n'ouvrent droit à aucune certification de l'organisme : ton rapport apprécie l'aptitude à produire une ACV défendable, il ne vaut pas revue critique.",
        "contexte": {
            "help": "Produit ou service étudié, usage prévu des résultats (interne, communication, comparaison publique), données déjà disponibles, et compétences en interne.",
            "placeholder": "Fabricant d'emballages en carton recyclé, souhaitant comparer deux gammes et communiquer le résultat auprès de ses clients.",
        },
        "priorite": "Traite en priorité l'unité fonctionnelle, les frontières du système et la qualité des données : une étude irréprochable sur le reste s'effondre si ces trois choix sont mal posés. Si l'usage déclaré est une affirmation comparative divulguée au public, souligne les exigences renforcées qui en découlent, notamment la revue critique par un comité de parties intéressées.",
    },
    "XP-X30-901": {
        "titre": "Auto-évaluation économie circulaire — XP X30-901",
        "categorie": "Économie Circulaire & Déchets",
        "role": "Tu es évaluateur de projets d'économie circulaire, familier de la norme expérimentale XP X30-901.",
        "contexte": {
            "help": "Objet et périmètre du projet d'économie circulaire, acteurs impliqués, stade d'avancement, et ressources qui lui sont affectées.",
            "placeholder": "Projet de valorisation des déchets plastiques d'une zone industrielle, porté par trois entreprises et la commune, en phase de démarrage.",
        },
        "priorite": "Ce référentiel s'applique à un projet délimité, non à l'organisme entier : rappelle-le si le contexte décrit une entreprise plutôt qu'un projet. Traite en priorité le pilotage (chapitre 8) et la traçabilité des flux jusqu'à leur destination finale : un projet sans périmètre défini ni indicateurs ne peut rien démontrer, et une valorisation dont la destination finale est inconnue ne peut pas être revendiquée.",
    },
    "BM-CES": {
        "titre": "Auto-diagnostic CES Banque mondiale — les 10 NES",
        "categorie": "Conformité Bailleurs & Projets Financés",
        "role": "Tu es spécialiste des sauvegardes environnementales et sociales, habitué à l'examen de la conformité des projets au Cadre environnemental et social de la Banque mondiale. Il ne s'agit pas d'une certification mais d'une condition de financement opposable à l'Emprunteur.",
        "contexte": {
            "help": "Nature et localisation du projet, montant et bailleur, stade d'avancement, classification de risque si elle est connue, et composition de l'unité de gestion.",
            "placeholder": "Projet de réhabilitation de 120 km de pistes rurales, financé par l'IDA, en phase de préparation, UGP en cours de constitution.",
        },
        "priorite": "Traite en priorité la NES 1, la NES 10 et, si le projet touche au foncier, la NES 5 : l'évaluation environnementale et sociale, la mobilisation des parties prenantes et la réinstallation involontaire concentrent l'essentiel des cas de non-conformité et des suspensions de décaissement. Signale les NES sans objet pour ce projet plutôt que de les noter à zéro, et rappelle que le diagnostic ne remplace pas les instruments exigés par la Banque.",
    },
    "RGPD": {
        "titre": "Auto-évaluation RGPD — protection des données",
        "categorie": "Certification de Compétences & Personnes",
        "role": "Tu es délégué à la protection des données expérimenté, habitué aux audits de conformité au RGPD. Le RGPD est une obligation légale et non un référentiel de certification ; ton rapport constitue un état des lieux, en aucun cas une consultation juridique.",
        "contexte": {
            "help": "Secteur, effectif, pays d'établissement, types de données traitées, outils utilisés, et raison de la démarche (obligation d'un client, incident, mise en conformité).",
            "placeholder": "Établissement de microfinance, 90 salariés, établi au Bénin, traitant des données de clients et de salariés, sollicité par un partenaire européen.",
        },
        "priorite": "Traite en priorité le registre des traitements et les durées de conservation : sans registre à jour, aucune des autres obligations ne peut être démontrée, et une conservation illimitée est l'écart le plus systématiquement relevé. Si l'organisme est établi hors de l'Union européenne, précise que l'applicabilité du RGPD dépend de l'article 3 et que la loi nationale ainsi que l'Acte additionnel de la CEDEAO s'appliquent en tout état de cause.",
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
        categorie=habillage.get("categorie", args.categorie),
        contexte=habillage["contexte"],
        priorite=habillage["priorite"],
        role=habillage.get("role"),
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
