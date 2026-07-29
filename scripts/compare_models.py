#!/usr/bin/env python3
"""Compare deux modèles sur le même diagnostic normatif.

La question posée est celle du cadrage : l'outil transmet-il une expertise que
l'utilisateur n'aurait pas pu produire seul ? Le critère objectif retenu est
l'ancrage dans le référentiel — une recommandation qui cite la clause dont elle
découle est vérifiable ; « mettre en place des procédures écrites » ne l'est pas.

    python3 scripts/compare_models.py [modeleA] [modeleB]
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "fast_api"))

from app.schemas import ToolConfig  # noqa: E402
from app.services.generation import GenerationError, generate_structured  # noqa: E402
from app.services.prompt_builder import build_system_prompt, build_user_prompt  # noqa: E402
from app.services.referentiels import load_referentiel, render_clauses  # noqa: E402
from app.services.scoring import compute_scores, render_scores  # noqa: E402

DEFAULT_TOOL = "auto-diagnostic-iso-9001"

CONTEXTE = (
    "PME agroalimentaire au Bénin, 40 salariés, un site de production à Cotonou. "
    "Nous transformons des produits locaux pour la distribution nationale. "
    "Nous visons la certification ISO 9001 dans les 12 mois. Aucun responsable "
    "qualité à temps plein aujourd'hui."
)

# Positionnement réaliste d'une PME qui démarre : des pratiques opérationnelles
# réelles mais peu formalisées, et rien sur l'amélioration continue.
# `A` couvre l'Annexe A d'ISO 27001, dont les chapitres sont numérotés A.5 à A.8.
NIVEAUX = {
    "4": 1, "5": 1, "6": 0, "7": 2, "8": 2, "9": 1, "10": 0, "A": 1,
}
NIVEAU_PAR_DEFAUT = 1

CLAUSE_REF = re.compile(r"\b(?:A|4|5|6|7|8|9|10)\.\d\b")


def answers(tool: ToolConfig) -> dict:
    par_score = {o.score: o.label for o in tool.inputs[1].options}
    out = {"contexte": CONTEXTE}
    for i in tool.inputs:
        if i.type == "select" and i.chapitre:
            niveau = NIVEAUX.get(i.chapitre.split(".")[0], NIVEAU_PAR_DEFAUT)
            out[i.name] = par_score[float(niveau)]
    return out


def anchored(items: list[str]) -> int:
    return sum(1 for r in items if CLAUSE_REF.search(str(r)))


def run(tool: ToolConfig, model: str, clauses: str, scores: dict) -> dict | None:
    started = time.time()
    try:
        result = generate_structured(
            system_prompt=build_system_prompt(tool, "fr"),
            user_prompt=build_user_prompt(
                tool, answers(tool), clauses=clauses, scores=render_scores(scores)
            ),
            output_schema=tool.outputSchema,
            model=model,
        )
    except GenerationError as error:
        print(f"\n### {model}\n  ÉCHEC : {error}")
        return None

    result = {**result, **scores}
    recos = [str(r) for r in result.get("recommandations", [])]

    print(f"\n{'=' * 78}\n### {model}   ({time.time() - started:.1f}s)")
    print(f"  recommandations           : {len(recos)}")
    print(f"  dont ancrées sur une clause : {anchored(recos)}/{len(recos)}")
    print("\n  Extraits :")
    for r in recos[:5]:
        print(f"    - {r[:150]}")
    return {"model": model, "recos": recos, "anchored": anchored(recos)}


def main() -> int:
    args = sys.argv[1:]

    # Permet de ramener la charge sous la limite de tokens/minute du palier
    # gratuit, afin de comparer la qualité à charge égale.
    max_clauses = None
    if "--max-clauses" in args:
        i = args.index("--max-clauses")
        max_clauses = int(args[i + 1])
        del args[i : i + 2]

    if max_clauses:
        from app.services import referentiels as ref_module

        ref_module.MAX_INJECTED_CLAUSES = max_clauses

    # Premier argument non-modèle : l'identifiant de l'outil à tester.
    tool_id = DEFAULT_TOOL
    if args and args[0].startswith("auto-diagnostic"):
        tool_id = args.pop(0)

    models = args or ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"]

    path = ROOT / "data" / "tools" / f"{tool_id}.json"
    tool = ToolConfig(**json.loads(path.read_text(encoding="utf-8")))
    referentiel = load_referentiel(tool.referentiel_code, tool.referentiel_version)
    if referentiel is None:
        print("Référentiel introuvable.", file=sys.stderr)
        return 1

    clauses = render_clauses(referentiel, [i.chapitre for i in tool.inputs if i.chapitre])
    scores = compute_scores(tool, answers(tool))

    print(f"Outil      : {tool.title}")
    print(f"Référentiel: {referentiel.reference} — {len(referentiel.clauses)} clauses injectées")
    print(f"Score calculé (identique pour les deux) : {scores['score_global']}/100")

    results = [r for m in models if (r := run(tool, m, clauses, scores))]

    if len(results) > 1:
        print(f"\n{'=' * 78}\nAncrage dans le référentiel :")
        for r in results:
            total = len(r["recos"]) or 1
            print(f"  {r['model']:32} {r['anchored']}/{len(r['recos'])}  ({r['anchored'] * 100 // total} %)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
