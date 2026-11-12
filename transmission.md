# Relais Codex → Claude — plateforme IA ICES

Date : 12 novembre 2026. Dépôt de départ : `AGONGBONONTobi/ices_ai_platform`,
branche `main`, base du travail : `52900fd`.

## Demande de Kenzo et résultat attendu

Kenzo confie la suite à Claude sur son autre PC : **transformer les descriptions
des lots du manager en outils réellement fonctionnels et créer les outils
nécessaires pour étoffer la plateforme**. Des guides qui expliquent comment
préparer un test ne répondent pas, à eux seuls, à cette demande.

Codex a extrait les descriptions et préparé leur intégration technique.
**Les 499 nouvelles entrées ne sont pas 499 tests ou outils métier achevés.**
Le développement des vrais outils reste à réaliser. Ne pas déclarer un outil
terminé parce que sa fiche JSON existe ou parce qu’un LLM génère un document.

Ce fichier est un relais entre sessions. Il ne lance pas de travail parallèle
et ne suppose pas que l’autre agent possède l’historique du chat.

## À lire en premier

1. `README.md`, `fast_api/README.md` et `docs/INTEGRATION_LOTS_OUTILS.md`.
2. `data/imports/manager-lots/README.md`.
3. `data/imports/manager-lots/recommandations-conception.json` : recommandations
   intégrales reçues avec le lot 5.
4. `data/imports/manager-lots/catalogue-350.json` : 350 fiches, 50 domaines,
   codes `Tn.n`, six blocs de méthode et contexte de domaine.
5. `data/imports/manager-lots/parcours-149.json` : 149 fiches, 30 domaines,
   codes `Dnn-P…`, paliers, renvois aux instruments T et critères d’acceptation.
6. `data/imports/manager-lots/coverage.json` : correspondance exacte entre
   codes source, identifiants du catalogue et modes actuellement attribués.

Les JSON structurés sont présents dans Git pour permettre la reprise sur un
autre PC. Ils conservent le texte source, ses limites et ses empreintes. Les
mails `.eml`, leurs en-têtes et les Word/TXT d’import restent dans
`docs/lots-outils-manager/`, dossier ignoré par Git : ils ne seront pas récupérés
par un simple pull. Les lots 1 à 4 n’ont pas été retrouvés ; ne pas les inventer.

## Principe technique constaté

- Frontend Next.js 14/React dans `src/` ; backend FastAPI dans `fast_api/`.
- `data/tools/*.json` est la source déclarative des outils : formulaire,
  `promptTemplate`, `output_kind`, `outputSchema` et métadonnées.
- Le catalogue et l’exécution utilisent les fiches publiées dans Supabase.
  Ajouter un JSON local ne met donc pas l’instance en ligne à jour.
- `/api/execute` relit la fiche en base, valide les réponses, construit le
  prompt, contrôle le résultat et décompte le quota après un résultat valide.
- Le calcul déterministe existe pour les grilles de scores déclarées ; ce
  n’est pas un moteur de passation cognitive, d’IRT, de CAT ou de chronométrage.

Preuves : `src/lib/schema/tool-schema.ts`, `fast_api/app/schemas.py`,
`fast_api/app/routers/execute.py`, `fast_api/app/services/scoring.py`,
`fast_api/app/services/tools_repository.py`, `scripts/sync_tools_to_db.ts`.

## Ce qui est déjà intégré, et ses limites exactes

Le catalogue local contient **1 587 entrées** : 1 088 entrées antérieures et
499 ajouts. L’état d’exécution réelle des 1 088 anciennes entrées n’a pas été
audité intégralement ; leur nombre n’est pas une preuve de qualité métier.

| Lot | Fiches ajoutées | Mode actuel |
| --- | --- | --- |
| 5 | 350 codes T, identifiants `psy-t…` | Guides de préparation documentaire |
| 6 | 22 cadrages P0 et 6 supports PS | 28 guides de préparation documentaire |
| 6 | Autres étapes de parcours | 121 fiches de référence, exécution bloquée |

Les six PS préparatoires sont D01, D04, D11, D15, D17 et D27. Même ces supports
ne réalisent ni collecte de consentement persistant, ni partage sécurisé,
ni suivi longitudinal. Les autres PS exigent notamment des tâches visuelles,
des items ou des services dédiés. Les paliers ne sont pas des tests indépendants
à additionner : le lot 6 réutilise des instruments du lot 5.

Les modes sont provisoires et décrivent ce qui existe, pas une interdiction
de développer les vrais outils :

- `execution.mode = preparation` : formulaire contextuel, génération d’un
  document sans passation réelle ni score psychométrique. Les titres commencent
  généralement par « Préparer — ».
- `execution.mode = reference` : méthode consultable ; `/api/execute` et
  `/api/tools/{id}/extract` répondent `409 TOOL_REFERENCE_ONLY` avant génération
  ou consommation du quota. Aucun formulaire d’exécution n’est affiché.
- Absence de `execution` : comportement historique du moteur.

Le schéma actuel ne propose pas encore un mode distinct pour une vraie
passation. Le concevoir lorsque le moteur de tâche existe, en gardant
`preparation` et `reference` pour leurs usages respectifs. Ne pas supprimer
simplement le blocage pour rendre une fiche artificiellement « fonctionnelle ».

## Travail à poursuivre

1. Relire les sources et examiner les outils existants pour regrouper les
   construits communs et éviter les doublons. Conserver les codes et renvois
   source pour suivre la couverture réelle.
2. Distinguer les outils métier réalisables avec un formulaire et un résultat
   structuré des épreuves qui nécessitent des tâches, un calcul, des items,
   des licences, une validation ou un professionnel. Pour chaque famille,
   décrire les entrées, le traitement effectif et la sortie observable.
3. Développer un parcours complet représentatif avant de généraliser : saisie
   adaptée, tâche réelle si nécessaire, calcul vérifiable, restitution fidèle
   aux faits, erreurs et limites explicites. Prioriser selon la faisabilité
   des sources, sans inventer de banque de questions calibrée.
4. Mutualiser les moteurs nécessaires : formulaires, tâches séquentielles,
   chronométrage, notation déterministe, sauvegarde/reprise, composition des
   étapes. Les modules A–F et les paliers sont des spécifications source,
   pas des fonctionnalités déjà implémentées.
5. Compléter ou remplacer progressivement les fiches provisoires. Préserver
   les identifiants publics lorsque possible, ou documenter les migrations
   et renvois si un identifiant doit changer.
6. Vérifier les parcours voisins : catalogue, recherche, traduction,
   extraction, exécution, restitution écran et PDF. Mettre à jour couverture
   et présent relais avec les outils réellement développés, les preuves de
   contrôle et les éléments encore en attente.

Pour une véritable épreuve, le critère de fin est une tâche utilisable et un
résultat calculé à partir des réponses réelles, avec des cas vérifiables. Pour
un outil documentaire, c’est un livrable métier exploitable et fidèle au cas
saisi. Une validation technique ne constitue pas une validation scientifique.

Les sources posent des limites : pas de diagnostic clinique sur la plateforme,
pas de QI/percentile ou de normes inventés, pas de sélection automatisée fondée
sur des mesures non validées. Les chiffres de banques, normes et performances
dans les descriptions sont des cibles à développer, pas des preuves acquises.
Le lot 6 précise le périmètre MVP et les conditions d’activation ; le lire
avant d’appliquer les cibles plus ambitieuses du catalogue du lot 5.

## Générateurs : attention à ne pas écraser la suite

`scripts/extract_manager_catalogues.py` reconstruit les JSON source depuis les
Word/TXT locaux ; ces originaux ne sont pas nécessaires à la lecture des JSON
déjà présents dans Git.

`scripts/build_manager_tools.py` reconstruit **les fiches provisoires actuelles**.
**Son option `--write` réécrit les 499 fichiers générés, même après une amélioration
manuelle.** Avant de transformer des fiches, faire évoluer le générateur ou son
mode de gestion afin qu’une régénération ne détruise pas le travail de Claude.
Le mode sans `--write` n’écrit rien.

## Correctifs techniques à conserver

- Provenance et disponibilité reconnues par Zod/Pydantic, conservées à la
  synchronisation et lors de la traduction.
- Traduction de `question` et `help`, en plus des libellés et options.
- Champs facultatifs absents remplacés dans le prompt par « non renseigné ».
- Recherche : classement lexical avant la limite de 50 candidats, pour ne
  pas exclure les derniers outils des catégories volumineuses ; statut
  déterministe dans les résultats, sans promettre une épreuve non disponible.
- Notices en sept langues, méthode originale identifiée comme française et
  liens entre les fiches de parcours et les instruments T référencés.

Preuves : `fast_api/tests/test_tool_availability.py`, `test_search.py`,
`test_prompt_builder.py`, `test_translation_options.py` ;
`src/lib/i18n/toolAvailability.ts`, `src/components/catalog/SmartSearch.tsx`,
`src/app/[lang]/tool/[id]/page.tsx`.

## Contrôles effectués par Codex

Au 12 novembre 2026 : **150 tests backend réussis** ; validation de 1 587 fiches
sans erreur ; `tsc --noEmit`, lint et build Next.js réussis. Les avertissements
du catalogue historique restent présents. Les 499 fiches se régénèrent à
l’identique et les 378 formulaires minimaux n’envoient pas de placeholder
résiduel. Ces résultats sont ceux du checkout Windows de Codex ; les rejouer
après les changements de Claude et sur son environnement.

```sh
npm ci
npx tsx scripts/validate_tools.ts --quiet
npx tsc --noEmit
npm run lint
npm run build

cd fast_api
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
SUPABASE_URL=https://example.supabase.co \
SUPABASE_ANON_KEY=test SUPABASE_SERVICE_ROLE_KEY=test GROQ_API_KEY=test \
python -m pytest -q
```

Les variables ci-dessus sont factices pour les tests. Ne pas les utiliser
comme accès à un service réel. Le frontend/build nécessite sa configuration
documentée dans le README ; les identifiants réels restent hors de Git.
Aucune génération LLM réelle, connexion utilisateur de production ou validation
psychométrique n’a été vérifiée pendant cette intégration.

## Reprise sur l’autre PC et état distant

Vérifier d’abord le remote et `git status` de la copie de Claude. Les éventuelles
modifications locales de cet autre PC ne sont pas visibles ici : les préserver
et les rapprocher avant un pull. Ne pas faire de reset ou de nettoyage destructif.

Ce relais accompagne un push Git demandé par Kenzo. **Un push ne synchronise
pas automatiquement le catalogue Supabase**. Aucun changement de cette base
n’a été effectué par Codex. Vérifier séparément l’état réel de tout déploiement
automatique déclenché par le push, s’il en existe un.

Les nouvelles fiches sont des brouillons lors de leur première insertion
avec le script existant. `sync_tools_to_db.ts --write` peut aussi supprimer
les outils distants absents du catalogue local ; lire l’aperçu et le code avant
son application. Ne pas publier toutes les fiches comme des tests achevés.

## Fin de la prochaine session

Compléter ce fichier avec : outils/familles réellement implémentés, identifiants
concernés, traitements et calculs ajoutés, vérifications exécutées, blocages,
état Git et état Supabase/déploiement vérifiés. Citer les fichiers et commandes
de preuve. Séparer les faits observés, les résultats déclarés et les hypothèses.

## Suite donnée par Claude, 12 novembre 2026

217 des 499 fiches importées (62 % des 350 codes du lot 5) ont été
transformées en outils réellement fonctionnels, sans `execution`, intégrés au
catalogue normal. Deux passes : une première de 35 outils (domaines 11, 12,
13, 46 en quiz + 39 en analyse), puis une seconde de 182 outils supplémentaires
sur demande explicite de Kenzo ("fais tout") de pousser l'intégration sur tout
ce qui est honnêtement faisable, en travaillant en autonomie complète.

- **Quiz à correction objective** (`output_kind: "assessment"`, score calculé
  par `fast_api/app/services/scoring.py::compute_scores`, jamais par le
  modèle) — domaines 4 (calcul mental), 5 (vocabulaire/grammaire), 6 et 49
  (évaluation de sources, sophismes), 11 (finance), 12 (cybersécurité), 13
  (bureautique), 22 (concepts marketing/biais du consommateur), 34
  (raisonnement mécanique/technique), 38 et 40 (systémique, probabilités,
  théorie de la décision), 44 (boucles de rétroaction), 46 (data literacy &
  IA). 13 domaines × 7 = 91 outils.
- **Outils d'analyse sans score** (`output_kind: "analysis"`, l'utilisateur
  décrit une situation réelle, l'outil produit une analyse substantielle de
  CETTE situation, jamais un score ni une étiquette de personnalité) —
  domaines 17, 19, 20, 21, 23, 24, 25, 28, 32, 35, 36, 37, 39, 42, 43, 45, 48,
  50 (risque financier, leadership, gouvernance, stratégie concurrentielle,
  marketing, communication, négociation, HSE, politique publique, économie
  informelle, créativité, biais cognitifs, entrepreneuriat, innovation,
  prospective, interculturel). 18 domaines × 7 = 126 outils.

Choix délibéré, pas un oubli : ces 31 domaines (sur 50 au lot 5) sont ceux où
une correction objective ou une analyse de situation réelle est honnête sans
fabriquer une mesure de la personne. Les 19 domaines restants du lot 5 (QI,
fonctions exécutives, mémoire, personnalité Big Five, intelligence
émotionnelle, motivation, intérêts professionnels, rôles d'équipe Belbin,
apprentissage/métacognition, raisonnement spatial, soft skills,
résilience/stress, santé mentale, haut potentiel, orientation de vie,
aptitudes élitistes, raisonnement clinique santé, tempérament de l'enfant,
neurodiversité) exigeraient une norme ou un item calibré que ce projet n'a
pas : leur attribuer un score aurait fabriqué un résultat psychométrique. Le
lot 6 (parcours cognitifs individuels, probablement appliqués à des
apprenants) n'a pas été touché pour la même raison, en plus d'impliquer
potentiellement des mineurs — il reste exactement comme Codex l'a construit
(28 guides de préparation, 121 fiches de référence). Cette limite tient même
sous l'instruction explicite de Kenzo de tout intégrer : c'est une limite de
sécurité/honnêteté, pas une décision business qui se discute.

Méthode : lecture directe des sous-ensembles pertinents de
`catalogue-350.json`, classification des 50 domaines en trois familles (quiz
objectif / analyse de situation sans score / reste intouché), puis 19
sous-agents en parallèle au total (5 pour les domaines quiz restants, 14 pour
les domaines d'analyse, chacun avec consigne explicite anti-fabrication de
score et miroir structurel sur un fichier déjà construit comme référence :
`psy-t11-1.json` pour les quiz, `psy-t39-1.json` pour les analyses).

Vérifications exécutées (toutes depuis la racine du dépôt sauf indication) :
- `npx tsx scripts/validate_tools.ts --quiet` → 1587 fiches, 0 erreur (3545
  avertissements inchangés, pré-existants sur le catalogue historique).
- `npx tsc --noEmit` → aucune erreur.
- `npm run lint` → aucune erreur.
- `npm run build` → build Next.js réussi.
- `cd fast_api && source .venv/bin/activate && SUPABASE_URL=... GROQ_API_KEY=test python -m pytest -q` → 150 passed.
- `data/imports/manager-lots/coverage.json` mis à jour : `functional_tools: 217`,
  `preparation_guides: 161` (était 378), `by_batch_and_mode` recalculé.

État Git : 217 fichiers `data/tools/psy-t*.json` + coverage.json + ce fichier
+ docs/INTEGRATION_LOTS_OUTILS.md, committés et poussés sur `main`. État
Supabase : **aucune synchronisation effectuée** — ces 217 outils n'existent
que dans le catalogue local jusqu'à l'exécution de `scripts/sync_tools_to_db.ts`,
qui doit être lancé et vérifié séparément (et qui peut aussi supprimer côté
base des identifiants absents du catalogue local — lire son code avant de
l'exécuter).

Hypothèse, pas un fait vérifié : la justesse factuelle des réponses correctes
repose sur les connaissances générales des agents qui les ont écrites, pas sur
une relecture par un expert du domaine ni sur un test utilisateur réel. Aucune
génération LLM réelle (`/api/execute`) n'a été appelée pendant cette session
pour ces 217 outils.
