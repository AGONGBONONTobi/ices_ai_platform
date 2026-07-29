"""Scoring déterministe (chantier B6).

Jusqu'ici, le score d'un auto-diagnostic était demandé au modèle. Deux
exécutions avec des réponses identiques donnaient donc des scores différents,
ce qui disqualifie un outil censé produire un positionnement et une feuille de
route.

Le score est désormais **calculé** à partir des options choisies par
l'utilisateur, chacune portant une valeur de maturité. Le modèle ne produit plus
que l'interprétation et le plan d'actions : il commente un résultat, il ne le
décide pas.

Un champ participe au score dès lors qu'il est de type `select` et que ses
options portent un `score`. Un outil dont aucune option n'est cotée n'est pas
scorable : `compute_scores` renvoie alors `None` et l'outil retombe sur le
comportement antérieur.
"""

from typing import Any

from app.schemas import ToolConfig, ToolInput


def _option_score(tool_input: ToolInput, value: Any) -> float | None:
    """Valeur de maturité de l'option choisie, `None` si elle n'est pas cotée."""
    for option in tool_input.options or []:
        if isinstance(option, str):
            continue
        if option.label == str(value):
            return None if option.score is None else float(option.score)
    return None


def _max_scale(tool_input: ToolInput) -> float:
    """Borne haute de l'échelle du champ (une grille 0-4 vaut 4)."""
    scores = [
        float(o.score)
        for o in tool_input.options or []
        if not isinstance(o, str) and o.score is not None
    ]
    return max(scores) if scores else 0.0


def is_scorable(tool: ToolConfig) -> bool:
    """Au moins un champ porte des options cotées."""
    return any(
        i.type == "select" and _max_scale(i) > 0 for i in tool.inputs
    )


def compute_scores(
    tool: ToolConfig, user_inputs: dict[str, Any]
) -> dict[str, Any] | None:
    """Score global et scores par axe, sur 100.

    Le regroupement se fait sur `axe` — l'intitulé lisible du chapitre — et non
    sur `chapitre`, qui porte le numéro exact de la clause et sert à sélectionner
    les clauses à injecter. C'est ce regroupement qui permet de rendre un score
    « par chapitre de la norme » plutôt qu'un score global opaque.
    """
    if not is_scorable(tool):
        return None

    # axe -> [(valeur obtenue, valeur maximale, poids)]
    par_axe: dict[str, list[tuple[float, float, float]]] = {}

    for tool_input in tool.inputs:
        if tool_input.type != "select":
            continue

        maximum = _max_scale(tool_input)
        if maximum <= 0:
            continue

        valeur = _option_score(tool_input, user_inputs.get(tool_input.name))
        if valeur is None:
            continue

        axe = tool_input.axe or tool_input.chapitre or tool_input.label or tool_input.name
        poids = float(tool_input.poids or 1)
        par_axe.setdefault(axe, []).append((valeur, maximum, poids))

    if not par_axe:
        return None

    axes = []
    total_obtenu = total_max = 0.0

    for axe, mesures in par_axe.items():
        obtenu = sum(v * p for v, _, p in mesures)
        maximum = sum(m * p for _, m, p in mesures)
        total_obtenu += obtenu
        total_max += maximum
        if maximum > 0:
            axes.append({"axe": axe, "score": round(obtenu / maximum * 100)})

    if total_max <= 0:
        return None

    return {
        "score_global": round(total_obtenu / total_max * 100),
        "axes": sorted(axes, key=lambda a: a["axe"]),
    }


def render_scores(scores: dict[str, Any]) -> str:
    """Rappel du calcul dans le prompt, pour que le modèle commente ces chiffres."""
    lignes = [
        "SCORES DÉJÀ CALCULÉS À PARTIR DES RÉPONSES — ne les recalcule pas, "
        "ne les modifie pas, reprends-les tels quels et commente-les :",
        f"  Score global : {scores['score_global']}/100",
    ]
    for axe in scores["axes"]:
        lignes.append(f"  {axe['axe']} : {axe['score']}/100")
    return "\n".join(lignes)
