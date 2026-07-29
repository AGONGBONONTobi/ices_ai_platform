"""Lecture du socle normatif (chantier B5).

Un diagnostic ISO ne doit jamais reposer sur ce que le modèle « se rappelle »
d'une norme : versions confondues, exigences approximatives, score inventé. Les
clauses du référentiel concerné sont chargées ici puis injectées dans le
contexte au moment de l'exécution.

Deux sources, dans cet ordre :

1. la base — c'est elle qui fait foi, et qui permet d'éditer une clause depuis
   le back-office sans redéploiement ;
2. les fichiers de `data/referentiels/` — repli utilisé tant que la migration
   `supabase/referentiels_schema.sql` n'est pas appliquée, sur le même principe
   que `tools_repository` pour la colonne `status`.

Sans aucune des deux, on ne dégrade pas silencieusement vers un prompt sans
référentiel : `load_referentiel` renvoie `None` et l'appelant décide.
"""

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.services.supabase_client import get_supabase_anon

logger = logging.getLogger(__name__)

# fast_api/app/services/referentiels.py -> racine du dépôt
LOCAL_DIR = Path(__file__).resolve().parents[3] / "data" / "referentiels"

# Nombre de clauses au-delà duquel on n'injecte plus tout le référentiel d'un
# bloc : à 100+ clauses le contexte devient coûteux et le modèle se disperse.
MAX_INJECTED_CLAUSES = 40

# Au-dessus de ce niveau de maturité déclaré, la clause n'est plus un sujet
# d'audit : elle reste citée avec son exigence, mais sans ses preuves attendues
# ni ses erreurs fréquentes. Sur une échelle 0-4, cela vise « formalisé » et
# en dessous.
SEUIL_CLAUSE_DETAILLEE = 2.0


class Clause:
    __slots__ = ("chapitre", "intitule", "exigence", "preuves", "erreurs_frequentes", "poids")

    def __init__(self, data: dict[str, Any]) -> None:
        self.chapitre = str(data.get("chapitre", ""))
        self.intitule = str(data.get("intitule", ""))
        self.exigence = str(data.get("exigence", ""))
        self.preuves = list(data.get("preuves") or [])
        self.erreurs_frequentes = list(data.get("erreurs_frequentes") or [])
        self.poids = float(data.get("poids") or 1)

    def as_dict(self) -> dict[str, Any]:
        return {
            "chapitre": self.chapitre,
            "intitule": self.intitule,
            "exigence": self.exigence,
            "preuves": self.preuves,
            "erreurs_frequentes": self.erreurs_frequentes,
            "poids": self.poids,
        }


class Referentiel:
    __slots__ = ("code", "version", "label", "echelle", "clauses")

    def __init__(self, data: dict[str, Any], clauses: list[Clause]) -> None:
        self.code = str(data.get("code", ""))
        self.version = str(data.get("version", ""))
        self.label = str(data.get("label", ""))
        self.echelle: dict[str, str] = dict(data.get("echelle") or {})
        self.clauses = clauses

    @property
    def reference(self) -> str:
        return f"{self.code}:{self.version}" if self.version else self.code

    def clause(self, chapitre: str) -> Clause | None:
        return next((c for c in self.clauses if c.chapitre == chapitre), None)


def _from_local(code: str, version: str | None) -> Referentiel | None:
    if not LOCAL_DIR.is_dir():
        return None

    for path in sorted(LOCAL_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            logger.warning("Référentiel local illisible : %s", path.name)
            continue

        if data.get("code") != code:
            continue
        if version and data.get("version") != version:
            continue

        clauses = [Clause(c) for c in data.get("clauses") or []]
        return Referentiel(data, clauses)

    return None


def _from_database(code: str, version: str | None) -> Referentiel | None:
    client = get_supabase_anon()

    query = client.table("referentiels").select("*").eq("code", code)
    if version:
        query = query.eq("version", version)

    try:
        response = query.eq("statut", "actif").limit(1).execute()
    except Exception:  # noqa: BLE001 — table absente tant que la migration n'est pas passée
        logger.info(
            "Table `referentiels` indisponible : repli sur data/referentiels/. "
            "Exécuter supabase/referentiels_schema.sql."
        )
        return None

    rows = response.data or []
    if not rows:
        return None

    row = rows[0]
    clauses_response = (
        client.table("clauses")
        .select("*")
        .eq("referentiel_id", row["id"])
        .order("ordre")
        .execute()
    )
    clauses = [Clause(c) for c in clauses_response.data or []]
    return Referentiel(row, clauses)


@lru_cache(maxsize=32)
def load_referentiel(code: str, version: str | None = None) -> Referentiel | None:
    """Référentiel demandé, ou `None` s'il est introuvable dans les deux sources."""
    if not code:
        return None

    referentiel = _from_database(code, version) or _from_local(code, version)
    if referentiel is None:
        logger.warning("Référentiel introuvable : %s %s", code, version or "(toute version)")
    return referentiel


def render_clauses(
    referentiel: Referentiel,
    chapitres: list[str] | None = None,
    *,
    niveaux: dict[str, float] | None = None,
) -> str:
    """Met en forme les clauses pour injection dans le prompt.

    Les preuves attendues et les erreurs fréquentes sont incluses : c'est ce que
    l'utilisateur ne peut pas produire seul, et donc ce qui donne sa valeur au
    résultat. Sans elles, le modèle ne peut que paraphraser la question.

    `niveaux` donne le positionnement déclaré par clause. Quand il est fourni,
    seules les clauses en écart reçoivent le détail complet : sur une clause déjà
    pilotée, il n'y a pas d'écart à décrire, et lui joindre ses preuves attendues
    et ses erreurs fréquentes coûte du contexte sans rien apporter au rapport.
    Le détail se concentre donc là où l'audit se joue — ce qui, accessoirement,
    fait porter la dépense de tokens sur les clauses qui la justifient.
    """
    clauses = referentiel.clauses
    if chapitres:
        retenues = [c for c in clauses if c.chapitre in set(chapitres)]
        clauses = retenues or clauses

    clauses = clauses[:MAX_INJECTED_CLAUSES]

    def _en_ecart(clause: Clause) -> bool:
        """Vrai si la clause mérite son détail complet."""
        if niveaux is None:
            return True
        niveau = niveaux.get(clause.chapitre)
        # Une clause non renseignée reste détaillée : on ne sait pas si elle tient.
        return niveau is None or niveau <= SEUIL_CLAUSE_DETAILLEE

    lignes = [f"RÉFÉRENTIEL : {referentiel.label} ({referentiel.reference})"]

    if referentiel.echelle:
        echelle = ", ".join(
            f"{k} = {v}" for k, v in sorted(referentiel.echelle.items())
        )
        lignes.append(f"Échelle de maturité : {echelle}")

    lignes.append("")
    lignes.append(
        "Clauses applicables. Appuie chaque constat et chaque action sur la clause "
        "correspondante, en citant son numéro. N'invente aucune exigence absente "
        "de cette liste."
    )

    for clause in clauses:
        lignes.append("")
        lignes.append(f"[{clause.chapitre}] {clause.intitule}")
        lignes.append(f"  Exigence : {clause.exigence}")

        if not _en_ecart(clause):
            continue

        if clause.preuves:
            lignes.append("  Preuves attendues :")
            lignes.extend(f"    - {p}" for p in clause.preuves)
        if clause.erreurs_frequentes:
            lignes.append("  Écarts fréquemment constatés :")
            lignes.extend(f"    - {e}" for e in clause.erreurs_frequentes)

    return "\n".join(lignes)
