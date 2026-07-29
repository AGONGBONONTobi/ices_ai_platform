"""Choix du modèle selon l'exigence de l'outil.

Un modèle unique ne convient pas au catalogue. Mesuré sur le même diagnostic
ISO 9001, à charge égale :

    llama-3.1-8b-instant       0/7 recommandations rattachées à une clause
    llama-3.3-70b-versatile    8/8

Et surtout : avec un référentiel complet en contexte (~3 000 tokens), le modèle
par défaut est refusé par le fournisseur — la requête dépasse la limite de
tokens par minute du palier gratuit. Le routage n'est donc pas un confort, il
conditionne le fonctionnement des outils normatifs.

Le routage reste volontairement simple et lisible : ce sont les outils qui
raisonnent sur un référentiel ou qui rédigent un livrable qui justifient le
modèle le plus capable. Le reste garde le modèle rapide, qui est gratuit.
"""

from app.config import get_settings
from app.schemas import ToolConfig

# Types de sortie qui exigent de la rédaction ou du raisonnement structuré.
DEMANDING_KINDS = frozenset({"document", "assessment"})


def needs_capable_model(tool: ToolConfig) -> bool:
    """Vrai si l'outil justifie le modèle le plus capable.

    Deux cas :
    - il s'adosse à un référentiel normatif — le contexte est volumineux et la
      réponse doit être rattachée à des clauses précises ;
    - il produit un livrable rédigé ou un diagnostic, où la qualité de rédaction
      fait la valeur du résultat.
    """
    if tool.referentiel_code:
        return True
    return tool.output_kind in DEMANDING_KINDS


def select_model(tool: ToolConfig) -> str:
    """Modèle à utiliser pour cet outil."""
    settings = get_settings()

    if not settings.model_routing_enabled:
        return settings.groq_model

    if needs_capable_model(tool) and settings.groq_model_capable:
        return settings.groq_model_capable

    return settings.groq_model
