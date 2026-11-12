# Intégration des lots d’outils 5 et 6

## Principe du projet

La plateforme propose un catalogue de fiches déclaratives (`data/tools/*.json`).
Chaque fiche définit les informations à renseigner, la méthode à suivre et le
format du livrable. Le frontend Next.js affiche le formulaire ; l’API FastAPI
relit la fiche publiée dans Supabase, valide les réponses, appelle le modèle IA
et contrôle le résultat. Les scores existants adossés à une grille sont calculés
côté serveur. Les fiches locales doivent être synchronisées vers Supabase pour
apparaître dans une instance déployée.

## Contenu intégré

| Source | Couverture | Mode disponible dans ce moteur |
| --- | --- | --- |
| Lot 5 — catalogue de 350 outils | 50 domaines, 350 codes `Tn.n` | 350 guides de préparation documentaire |
| Lot 6 — parcours cognitifs | 30 domaines, 149 fiches `Dnn-P…` | 28 supports de préparation, 121 références consultables |

Le catalogue local passe de **1 088 à 1 587 entrées**. Les 499 nouvelles entrées
sont 378 guides de préparation et 121 fiches de référence. Elles ne constituent
pas 499 nouveaux tests psychométriques étalonnés.

Le lot 6 présente plusieurs paliers d’un parcours et réutilise des instruments
du lot 5 : les deux nombres ne représentent donc pas des tests indépendants.
Les codes source et leurs renvois sont conservés pour rendre ce lien visible.

Les 28 supports du lot 6 sont les 22 cadrages P0 et six supports PS : dossier
de consultation D01, conversation éducative D04, checklist D11, journal D15,
débrief D17 et guide d’alternatives D27. Ils préparent des documents à compléter ;
ils n’enregistrent pas un consentement et n’activent pas un palier du parcours.
Les autres PS nécessitent des tâches, un suivi ou des services dédiés : ils
restent des références, comme P1/P2/P3/P4/PB/PR/PF.

## Utilisation et limites

Chaque guide possède un formulaire contextualisé et une méthode issue de sa
fiche source. Il produit un support écrit sans note, percentile, QI, diagnostic
ou décision d’aptitude. Les banques, normes, tâches visuelles, durées mesurées,
partenariats, liens révocables et validations linguistiques cités dans les
documents sont des spécifications cibles ; leur existence n’est pas affirmée.

Le mode `reference` est refusé par l’API avec `409 TOOL_REFERENCE_ONLY` sur
l’exécution et l’extraction de document. Le refus repose sur la fiche en base,
avant tout appel de génération ou décompte de quota. Le frontend explique ce
statut et ne propose pas de formulaire pour ces fiches. Les outils historiques
sans champ `execution` conservent leur fonctionnement.

Les badges sont disponibles dans les sept langues de l’application. Les blocs
de méthode originaux restent en français et sont identifiés comme tels. Une
traduction d’interface ne constitue pas une validation psychométrique.

## Fichiers et régénération

- `data/imports/manager-lots/catalogue-350.json` et `parcours-149.json` :
  transcription fidèle, contexte des domaines, limites, critères et lignes source.
- `data/imports/manager-lots/coverage.json` : correspondance exhaustive
  source → fiche, modes et couverture.
- `scripts/extract_manager_catalogues.py` : extraction déterministe depuis les
  textes locaux, sans appel IA ni exécution des documents Word.
- `scripts/build_manager_tools.py` : génération déterministe des fiches,
  contrôle des collisions et des codes référencés, aperçu par défaut.

Depuis la racine du dépôt :

```sh
python scripts/extract_manager_catalogues.py
python scripts/build_manager_tools.py
python scripts/build_manager_tools.py --write
npx tsx scripts/validate_tools.ts --quiet
```

L’extraction nécessite les sources locales de `docs/lots-outils-manager/`,
exclues de Git. Les JSON structurés permettent de régénérer les fiches même
sans les mails originaux. Aucun outil historique n’est remplacé par le générateur.
Une collision d’identifiant ou de titre interrompt l’opération.

## Passage vers une instance déployée

Cette intégration porte sur le code et le catalogue locaux. Aucun changement
de base distante, publication, commit ou push n’est réalisé par la génération.
Une instance déployée nécessite les accès et la procédure de synchronisation
documentés dans le README. Les nouvelles fiches entrent en brouillon par défaut.
Relire le plan de synchronisation avant toute application : le script existant
peut aussi supprimer de la base des identifiants absents du catalogue local.

Les prochaines étapes pour de vraies passations sont les banques d’items,
les modules de tâche, les protocoles de consentement et de supervision, puis
les validations par population, langue et usage décrites dans les sources.

## Vérifications locales du 12 novembre 2026

- 1 587 fiches contrôlées par `validate_tools.ts` : aucune erreur. Les
  avertissements de qualité du catalogue historique restent recensés.
- 150 tests backend réussis, dont les refus d’exécution des références,
  les champs facultatifs, la traduction et la recherche au-delà du plafond.
- `tsc --noEmit`, `npm run lint` et `npm run build` réussis.
- 499 fiches régénérées à l’identique ; provenance et schéma conservés après
  validation ; 378 formulaires minimaux sans variable résiduelle ni score calculé.
- Revue indépendante : 3 143 blocs comparés aux textes sources et corrections
  vérifiées aux frontières de l’API.

Ces contrôles utilisent des données et identifiants factices pour les services
distants. Ils ne constituent pas une évaluation d’une génération IA réelle,
une validation scientifique ou une mise à jour de l’instance en ligne.
