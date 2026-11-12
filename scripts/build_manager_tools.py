#!/usr/bin/env python3
"""Intègre les lots 5/6 dans le catalogue déclaratif, sans appel réseau.

python scripts/build_manager_tools.py          # aperçu
python scripts/build_manager_tools.py --write  # écrit les fiches et la couverture

Les documents spécifient des épreuves, pas leurs banques d'items validées.
Les outils de préparation produisent donc des documents sans score. Les
épreuves et étapes non implémentées restent consultables en mode référence.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPORTS = ROOT / 'data' / 'imports' / 'manager-lots'
TOOLS = ROOT / 'data' / 'tools'
sys.path.insert(0, str(ROOT / 'fast_api'))
from app.services.output_kinds import schema_for  # noqa: E402

BLOCK_NAMES = {
    'mesure': 'Mesure visée', 'format': 'Format cible', 'contenu': 'Contenu cible',
    'scoring': 'Calcul cible (non implémenté ici)', 'decision': 'Usage décrit',
    'avance': 'Options cibles', 'passerelle': 'Conditions et limites',
}

# Ces fiches PS décrivent des supports écrits ; les autres PS demandent des
# épreuves, un suivi longitudinal ou un service qui n'existent pas dans ce moteur.
DOCUMENTARY_PS = {'D01-PS', 'D04-PS', 'D11-PS', 'D15-PS', 'D17-PS', 'D27-PS'}

# Rattachement aux catégories déjà rendues par l'application, sans nouveau silo.
LOT5_CATEGORIES = {
    **dict.fromkeys([1, 2, 3, 4, 5, 6, 15, 16, 29, 30, 31, 41, 47, 49], 'PROFILS APPRENANTS & PÉDAGOGIE'),
    **dict.fromkeys([7, 8, 9, 10, 14, 18, 25, 26], 'PERSONNALITÉ & COMPORTEMENT PROFESSIONNEL'),
    11: 'FINANCE & GESTION', 12: 'TRANSFORMATION DIGITALE & IA',
    13: 'TRANSFORMATION DIGITALE & IA', 17: 'STRATÉGIE & MANAGEMENT',
    19: 'STRATÉGIE & MANAGEMENT', 20: 'Gouvernance, Éthique & Anti-Corruption',
    21: 'STRATÉGIE & MANAGEMENT', 22: 'MARKETING & COMMERCIAL',
    23: 'MARKETING & COMMERCIAL', 24: 'COMMUNICATION & RELATIONS EXTÉRIEURES',
    27: 'DIAGNOSTICS & ÉVALUATIONS', 28: 'GESTION DES RISQUES',
    32: 'OUTILS SECTORIELS SPÉCIALISÉS', 33: 'OUTILS SECTORIELS SPÉCIALISÉS',
    34: 'OUTILS SECTORIELS SPÉCIALISÉS', 35: 'STRATÉGIE & MANAGEMENT',
    36: 'INNOVATION & R&D', 37: 'INNOVATION & R&D', 38: 'STRATÉGIE & MANAGEMENT',
    39: 'STRATÉGIE & MANAGEMENT', 40: 'STRATÉGIE & MANAGEMENT',
    42: 'STRATÉGIE & MANAGEMENT', 43: 'INNOVATION & R&D',
    44: 'STRATÉGIE & MANAGEMENT', 45: 'STRATÉGIE & MANAGEMENT',
    46: 'TRANSFORMATION DIGITALE & IA', 48: 'COMMUNICATION & RELATIONS EXTÉRIEURES',
    50: 'STRATÉGIE & MANAGEMENT',
}

PREPARATION_NOTICE = (
    'Guide de préparation fondé sur vos informations déclarées. '
    'Il ne fait pas passer le test décrit dans le référentiel et ne produit '
    'ni score psychométrique, ni QI, ni percentile, ni diagnostic. '
    'Aucune conclusion de sélection ou d’aptitude individuelle.'
)
REFERENCE_NOTICE = (
    'Fiche méthodologique consultable. Cette étape nécessite des épreuves '
    'validées, une supervision, un service partenaire ou un protocole dédié '
    'qui ne sont pas disponibles dans le moteur actuel. Aucune passation '
    'ni résultat de test ne peut être généré ici.'
)


def normalized(value: str) -> str:
    plain = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', ' ', plain.lower()).strip()


def build_record(record: dict, source: dict, batch: str) -> dict:
    code = record['code']
    stage = record.get('stage')
    preparation = batch == '5' or stage == 'P0' or code in DOCUMENTARY_PS
    mode = 'preparation' if preparation else 'reference'
    tool_id = ('psy-' if batch == '5' else 'parcours-') + code.lower().replace('.', '-')
    title = (('Préparer — ' if preparation else '') + record['title']
             + f' · {code}')
    context = record.get('domain_context', {})
    blocks = dict(record['blocks'])
    # Les limites de domaine font partie du contrat de chaque fiche, pas d'une
    # note globale que le lecteur ou le moteur pourrait manquer.
    for key, label in [
        ('objective', 'Objectif du domaine'), ('safeguard', 'Garde-fou du domaine'),
        ('forbidden_decisions', 'Décisions exclues'), ('zone', 'Zone d’usage'),
        ('decision_level', 'Niveau de décision cible'),
    ]:
        if context.get(key):
            blocks[label] = context[key]
    reference = '\n'.join(
        f'{BLOCK_NAMES.get(key, key)} : {value}' for key, value in blocks.items()
    )
    # Aucun placeholder utilisateur ne doit apparaître dans le texte de source.
    reference = reference.replace('{', '(').replace('}', ')')
    inputs = []
    if preparation:
        inputs = [
            {'name': 'objectif', 'type': 'textarea', 'question': 'Que souhaitez-vous préparer ?',
             'help': f'Précisez votre objectif autour de « {record["title"]} ». Ce formulaire prépare une démarche, sans évaluer une personne.',
             'required': True},
            {'name': 'contexte', 'type': 'textarea', 'question': 'Quel est le contexte utile ?',
             'help': 'Décrivez une situation de façon anonyme, votre rôle et le public concerné. Évitez les noms et les données médicales ou personnelles détaillées.',
             'required': True},
            {'name': 'elements', 'type': 'textarea', 'question': 'Quels éléments factuels avez-vous déjà ?',
             'help': f'Indiquez uniquement vos observations et questions en lien avec : {record["blocks"]["mesure"]} Ne renseignez pas de score supposé.',
             'required': False},
            {'name': 'contraintes', 'type': 'textarea', 'question': 'Quelles contraintes faut-il respecter ?',
             'help': 'Langue, accessibilité, temps disponible, destinataire envisagé et limites de partage. Aucun document ne sera partagé automatiquement.',
             'required': False},
        ]
        prompt = (
            f'Prépare un support écrit pour « {record["title"]} », dans le domaine '
            f'« {record["domain"]} ». Il s’agit d’un guide de préparation et non '
            'de la passation du test ou de la mise en œuvre complète du parcours.\n\n'
            'Objectif déclaré : {objectif}\nContexte déclaré : {contexte}\n'
            'Éléments fournis : {elements}\nContraintes déclarées : {contraintes}\n\n'
            'SPÉCIFICATION SOURCE — cible de conception, jamais un résultat acquis :\n'
            f'{reference}\n\n'
            'Produis un document organisé : objectif et périmètre ; faits disponibles '
            'et informations manquantes ; préparation ou support écrit propre à '
            'cette fiche ; questions à discuter et prochaines étapes ; limites '
            'du document. Reste spécifique au construit et au contexte de la fiche. '
            'Pour une checklist, un journal ou un dossier, rédige le support '
            'modifiable lui-même, en laissant « à compléter » les faits absents. '
            'Pour un cadrage P0, prépare une notice et des questions de compréhension : '
            'ne prétends jamais avoir enregistré un consentement ou ouvert un palier. '
            'Aucun questionnaire psychométrique n’est administré ici. Ne fabrique '
            'ni items de test, ni réponses du participant, ni observations de passation. '
            'N’invente aucune aptitude, aucun score, classement, percentile, QI, '
            'diagnostic, seuil ou preuve de validation. Les méthodes de scoring '
            'mentionnées sont des spécifications futures, non des calculs à réaliser. '
            'Ne décide pas de recrutement, admission, promotion, assurance ou aptitude. '
            'Ne présente pas les banques, normes, traductions validées, partenaires, '
            'liens révocables ou suivis cités comme déjà disponibles. N’invente '
            'aucun professionnel, contact ou ressource locale. Aucun partage ni '
            'transfert n’est effectué. Mentionne le caractère préparatoire et '
            'l’absence de résultat de test dans le document final.'
        )
    else:
        # Un prompt et un schéma restent exigés par le catalogue historique.
        # Le serveur refuse ce mode avant tout appel au modèle.
        prompt = 'Fiche de référence uniquement. Aucune exécution autorisée.\n' + reference
    provenance = {
        'batch': batch, 'document': source['source_document'], 'code': code,
        'domain': record['domain'], 'blocks': blocks,
        'related_codes': record.get('related_codes', []),
    }
    if stage:
        provenance['stage'] = record.get('stage_variant', stage)
    return {
        'id': tool_id, 'title': title,
        'category': LOT5_CATEGORIES[record['domain_number']] if batch == '5'
                    else 'PROFILS APPRENANTS & PÉDAGOGIE',
        'inputs': inputs, 'promptTemplate': prompt, 'outputSchema': schema_for('document'),
        'output_kind': 'document', 'provenance': provenance,
        'execution': {'mode': mode, 'notice': PREPARATION_NOTICE if preparation else REFERENCE_NOTICE},
    }


def build_all() -> tuple[list[dict], dict]:
    tools, mappings = [], []
    for filename, batch, expected in [('catalogue-350.json', '5', 350), ('parcours-149.json', '6', 149)]:
        source = json.loads((IMPORTS / filename).read_text(encoding='utf-8'))
        records = source['records']
        if len(records) != expected:
            raise ValueError(f'{filename}: {len(records)} fiches au lieu de {expected}')
        codes = [record['code'] for record in records]
        if len(set(codes)) != len(codes):
            raise ValueError(f'{filename}: codes source dupliqués')
        for record in records:
            tool = build_record(record, source, batch)
            tools.append(tool)
            mappings.append({'batch': batch, 'code': record['code'], 'tool_id': tool['id'],
                             'mode': tool['execution']['mode'], 'domain': record['domain'],
                             'stage': record.get('stage_variant'),
                             'related_codes': record.get('related_codes', []),
                             'source_lines': record['source_lines']})
    if len(set(tool['id'] for tool in tools)) != len(tools):
        raise ValueError('Identifiants générés dupliqués')
    generated_ids = {tool['id'] for tool in tools}
    existing = [json.loads(path.read_text(encoding='utf-8')) for path in TOOLS.glob('*.json')
                if path.stem not in generated_ids]
    # Ne jamais écraser un outil existant qui aurait le même identifiant.
    for tool in tools:
        target = TOOLS / (tool['id'] + '.json')
        if target.exists():
            old = json.loads(target.read_text(encoding='utf-8'))
            if old.get('provenance', {}).get('code') != tool['provenance']['code']:
                raise ValueError(f'Collision avec une fiche existante : {target.name}')
    titles = Counter(normalized(tool['title']) for tool in existing + tools)
    collisions = [tool['id'] for tool in tools if titles[normalized(tool['title'])] > 1]
    if collisions:
        raise ValueError(f'Titres dupliqués : {collisions}')
    known_t = {m['code'] for m in mappings if m['batch'] == '5'}
    unknown = {c for m in mappings for c in m['related_codes'] if c not in known_t}
    if unknown:
        raise ValueError(f'Renvois catalogue inconnus : {unknown}')
    coverage = {
        'description': 'Guides de préparation et fiches méthodologiques ; pas de nouveaux tests psychométriques étalonnés.',
        'existing_tools': len(existing), 'imported_entries': len(tools),
        'total_catalogue_entries': len(existing) + len(tools),
        'preparation_guides': sum(t['execution']['mode'] == 'preparation' for t in tools),
        'reference_entries': sum(t['execution']['mode'] == 'reference' for t in tools),
        'lot5_domains': 50, 'lot6_domains': 30,
        'by_batch_and_mode': dict(Counter(f'lot{m["batch"]}:{m["mode"]}' for m in mappings)),
        'entries': mappings,
    }
    return tools, coverage


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    tools, coverage = build_all()
    if args.write:
        for tool in tools:
            (TOOLS / (tool['id'] + '.json')).write_text(
                json.dumps(tool, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (IMPORTS / 'coverage.json').write_text(
            json.dumps(coverage, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in coverage.items() if key != 'entries'}, ensure_ascii=False, indent=2))
    print('Fiches écrites localement.' if args.write else 'Aperçu uniquement ; --write pour générer les fiches.')


if __name__ == '__main__':
    main()
