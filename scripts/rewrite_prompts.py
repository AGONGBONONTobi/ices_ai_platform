#!/usr/bin/env python3
"""Réécrit les `promptTemplate` restés à l'état de souche.

Le catalogue a été généré avec des prompts qui se contentent de rappeler les
réponses de l'utilisateur : « Tu es un expert en X. L'utilisateur a répondu :
… ». Aucune tâche n'est demandée, aucune méthode n'est imposée. Le modèle ne
peut alors que paraphraser le formulaire, et le livrable n'apporte rien que le
client n'ait déjà saisi.

Ce script réécrit ces prompts sur le patron des auto-diagnostics ISO, qui sont
les seules fiches du catalogue à produire un résultat défendable : posture
d'expert, méthode explicite, livrables énumérés, et garde-fou contre
l'invention de références réglementaires.

Ce qui n'est PAS touché : les `inputs`, l'`outputSchema` et l'`output_kind`.
Seul le prompt change, donc le formulaire vu par l'utilisateur reste identique
et aucune exécution passée ne devient illisible.

Limite assumée : un prompt ne remplace pas des données. Les outils qui rendent
un score sans grille de cotation dans leurs `inputs` continueront de produire
un chiffre que personne ne peut auditer — cela se corrige en ajoutant une
cotation aux options, pas en améliorant la rédaction.

Usage :
    python3 scripts/rewrite_prompts.py --kind analysis --limit 5    # aperçu
    python3 scripts/rewrite_prompts.py --kind analysis --limit 5 --write
    python3 scripts/rewrite_prompts.py --ids mon-outil --write
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS_DIR = ROOT / "data" / "tools"
sys.path.insert(0, str(ROOT / "fast_api"))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / "fast_api" / ".env")

from groq import Groq  # noqa: E402

MODEL = os.environ.get("GROQ_MODEL_CAPABLE", "llama-3.3-70b-versatile")
PLACEHOLDER = re.compile(r"\{([^{}]+)\}")

# Ce que le livrable doit être, selon sa nature. Repris de output_kinds.py :
# le prompt réécrit doit servir le schéma de sortie, pas le contredire.
ATTENDU_PAR_TYPE = {
    "analysis": (
        "une analyse structurée, SANS score. Le prompt doit demander : une synthèse "
        "qui répond directement à la question posée, 4 à 6 sections de fond rédigées "
        "en prose continue (chacune portant un sujet DISTINCT), et des points clés "
        "opérationnels."
    ),
    "document": (
        "un document prêt à l'emploi, SANS score et SANS commentaire sur le document. "
        "Le prompt doit demander la rédaction du livrable lui-même, tel que le client "
        "l'utilisera : les sections réelles du document, dans l'ordre, avec la "
        "formulation finale — jamais des consignes sur ce qu'il faudrait écrire."
    ),
    "assessment": (
        "un diagnostic avec un score global et des scores par axe. Le prompt doit "
        "demander un constat par axe appuyé sur les faits déclarés, puis des "
        "recommandations priorisées et actionnables, chacune rattachée à l'axe dont "
        "elle découle."
    ),
    "table": (
        "un tableau, SANS score. Le prompt doit définir précisément les colonnes "
        "attendues et ce que chaque ligne représente."
    ),
    "profile": (
        "un profil mesurant des DIMENSIONS, jamais une performance. Le prompt ne doit "
        "comporter aucun jugement de valeur : on décrit une manière de fonctionner, on "
        "ne dit jamais qu'une dimension est « à améliorer »."
    ),
}

META_PROMPT = """Tu conçois les prompts d'une plateforme d'outils professionnels.

On te donne une fiche d'outil dont le prompt est resté à l'état de souche : il se \
contente de rappeler les réponses de l'utilisateur sans rien demander. Résultat, le \
modèle qui l'exécute paraphrase le formulaire et le client ne reçoit rien qu'il n'ait \
déjà saisi.

Réécris ce prompt. Ta réponse est le nouveau prompt, et rien d'autre — pas de \
préambule, pas de guillemets autour, pas de JSON.

Le nouveau prompt doit contenir, dans cet ordre :

1. Une posture d'expert CRÉDIBLE et SPÉCIFIQUE du métier concerné — pas « tu es un \
expert en {sujet} », mais le praticien réel qui produirait ce livrable, et devant qui \
il devra être défendu.
2. Un rappel compact du cas, en injectant les variables du formulaire.
3. Une MÉTHODE numérotée, propre au métier : les étapes de raisonnement, le cadre \
d'analyse, l'ordre dans lequel on traite les choses. C'est le cœur de la valeur — \
c'est ce que le client ne sait pas faire seul.
4. Les livrables attendus, énumérés.
5. Des contraintes de rédaction fermant les défauts connus.

Règles impératives :
- N'utilise QUE les variables listées ci-dessous, avec la syntaxe {nom_exact}. \
Inventer un nom de variable casse l'outil.
- Le prompt doit interdire de reprendre telle quelle une appréciation fournie par \
l'utilisateur : si le formulaire demande au client de juger sa propre situation, le \
prompt doit dire de la RÉÉVALUER à partir des faits, pas de la recopier.
- Le prompt doit interdire d'inventer des numéros d'articles, de normes ou de textes \
réglementaires : nommer l'obligation sans en fabriquer la référence.
- Le prompt doit interdire deux sections qui disent la même chose.
- Écris en français, à la deuxième personne du singulier, en t'adressant au modèle.
- Vise 1500 à 3000 caractères. Un prompt court ne produit rien de vendable.
- Ne demande jamais un format de sortie (JSON, markdown) : le socle technique s'en \
charge déjà."""


def est_souche(prompt: str) -> bool:
    """Vrai si le prompt se borne à rappeler les réponses de l'utilisateur."""
    if "a répondu" not in prompt:
        return False
    return prompt.rstrip().endswith(".") and len(prompt.split("a répondu")[-1]) < 400


def decrire_inputs(tool: dict) -> str:
    lignes = []
    for champ in tool.get("inputs", []):
        libelle = champ.get("question") or champ.get("label") or champ["name"]
        ligne = f"- {{{champ['name']}}} ({champ.get('type','text')}) : {libelle}"
        options = champ.get("options") or []
        if options:
            labels = [o.get("label", o) if isinstance(o, dict) else o for o in options]
            ligne += f"\n    options : {' | '.join(str(l) for l in labels[:6])}"
        lignes.append(ligne)
    return "\n".join(lignes)


def reecrire(client: Groq, tool: dict) -> str:
    kind = tool.get("output_kind", "analysis")
    message = f"""FICHE À TRAITER

Titre : {tool['title']}
Catégorie : {tool['category']}

Variables disponibles (les seules autorisées) :
{decrire_inputs(tool)}

Nature du livrable : {ATTENDU_PAR_TYPE.get(kind, ATTENDU_PAR_TYPE['analysis'])}

Prompt actuel, à remplacer :
{tool['promptTemplate']}

Écris le nouveau prompt."""

    reponse = client.chat.completions.create(
        messages=[
            {"role": "system", "content": META_PROMPT},
            {"role": "user", "content": message},
        ],
        model=MODEL,
        temperature=0.3,
    )
    return (reponse.choices[0].message.content or "").strip()


def valider(nouveau: str, tool: dict) -> str | None:
    """Retourne un motif de rejet, ou None si le prompt est acceptable."""
    declarees = {c["name"] for c in tool.get("inputs", [])}
    utilisees = set(PLACEHOLDER.findall(nouveau))

    inconnues = utilisees - declarees
    if inconnues:
        return f"variables inventées : {', '.join(sorted(inconnues))}"
    if not utilisees:
        return "aucune variable du formulaire n'est utilisée"
    if len(nouveau) < 800:
        return f"trop court ({len(nouveau)} caractères)"
    if nouveau.lstrip().startswith(("{", "```")):
        return "la réponse n'est pas un prompt en texte brut"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kind", help="ne traiter qu'un type de livrable")
    parser.add_argument("--ids", nargs="*", help="identifiants précis à traiter")
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--write", action="store_true", help="écrire les fichiers")
    args = parser.parse_args()

    fiches = []
    for chemin in sorted(TOOLS_DIR.glob("*.json")):
        tool = json.loads(chemin.read_text())
        if args.ids:
            if tool["id"] not in args.ids:
                continue
        elif not est_souche(tool.get("promptTemplate", "")):
            continue
        if args.kind and tool.get("output_kind") != args.kind:
            continue
        fiches.append((chemin, tool))

    fiches = fiches[: args.limit]
    if not fiches:
        print("Aucune fiche à traiter.")
        return 0

    print(f"{len(fiches)} fiche(s), modèle {MODEL}"
          f"{'' if args.write else ' — APERÇU, rien ne sera écrit'}\n")

    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    reussis = rejetes = 0

    for chemin, tool in fiches:
        try:
            nouveau = reecrire(client, tool)
        except Exception as erreur:  # noqa: BLE001
            print(f"  ✗ {tool['id']} — échec de génération : {erreur}")
            rejetes += 1
            continue

        motif = valider(nouveau, tool)
        if motif:
            print(f"  ✗ {tool['id']} — rejeté : {motif}")
            rejetes += 1
            continue

        avant = len(tool["promptTemplate"])
        print(f"  ✓ {tool['id']} — {avant} → {len(nouveau)} caractères")
        reussis += 1

        if args.write:
            tool["promptTemplate"] = nouveau
            chemin.write_text(
                json.dumps(tool, ensure_ascii=False, indent=2) + "\n"
            )
        else:
            print("    " + nouveau[:300].replace("\n", "\n    ") + " […]\n")

    print(f"\n{reussis} réécrit(s), {rejetes} rejeté(s).")
    if args.write:
        print("Lancer maintenant : npx tsx scripts/validate_tools.ts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
