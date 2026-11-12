# Spécifications des lots d’outils 5 et 6

Ces fichiers sont une transcription structurée des documents reçus du manager,
pas des banques d’items, des tests étalonnés ou des preuves de validation.

- `catalogue-350.json` : 350 fiches `Tn.n`, 50 domaines, 6 blocs par fiche.
- `parcours-149.json` : 149 fiches `Dnn-P…`, 30 domaines, 7 blocs par fiche.
- `recommandations-conception.json` : texte complet des recommandations du
  manager, avec empreintes des sources ; à lire avant de développer les outils.

Les blocs conservent le texte original. `domain_context` conserve l’introduction
du domaine et ses champs utiles ; le parcours ajoute les critères d’acceptation.
`source_lines` référence le fichier texte extrait du Word. Les empreintes SHA-256
du Word, du texte et du document de recommandations permettent d’identifier la
version utilisée. Les références `related_codes` sont les codes T littéralement
présents dans les blocs : une plage reste décrite dans le texte original.

Les préambules et sections finales sont conservés dans les métadonnées. Les
exigences qu’ils décrivent restent des spécifications à mettre en œuvre, jamais
des fonctionnalités ou validations déjà acquises. En particulier, un palier
P0 ou PS ne suffit pas à rendre une fiche exécutable par un LLM : certaines
requièrent des items visuels, des tâches animées, des mesures de temps ou des
formes parallèles.

Pour régénérer depuis les sources locales :

```sh
python scripts/extract_manager_catalogues.py
```

Utiliser `--source-dir` et `--output-dir` pour d’autres emplacements. Les sources
Word et TXT sont dans `docs/lots-outils-manager/`, dossier local exclu de Git.
Le script ne les modifie pas et n’exécute aucun contenu de pièce jointe.
