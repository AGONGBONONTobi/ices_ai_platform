# Plateforme IA

Plateforme d'outils d'analyse et de diagnostic générés par IA (1000+ outils,
7 langues), organisée en deux applications :

| Dossier | Rôle | Stack |
| --- | --- | --- |
| `src/` | Frontend | Next.js 14 (App Router), React 18, Tailwind, shadcn/ui |
| `fast_api/` | Backend | FastAPI, Supabase, Groq, Stripe |

## Répartition des responsabilités

Toute la logique métier est dans le backend FastAPI :

- catalogue d'outils et fiche outil (lecture Supabase) ;
- traduction des outils à la volée via Groq, avec cache en base ;
- exécution des outils par le LLM et quota du plan gratuit ;
- facturation Stripe (session Checkout et webhook d'abonnement).

Le frontend Next.js conserve :

- l'authentification Supabase (email/mot de passe, Google OAuth, cookies de
  session, garde d'accès dans `src/middleware.ts`) ;
- le rendu, l'i18n des libellés d'interface et la génération PDF.

Le frontend appelle le backend via `src/lib/api/` et lui transmet le jeton
d'accès Supabase en `Authorization: Bearer <access_token>`.

## Démarrage

### Backend

```bash
cd fast_api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # renseigner Supabase / Groq / Stripe
uvicorn app.main:app --reload --port 8000
```

Guide complet de lancement : [`LAUNCH.md`](LAUNCH.md).

Détails, liste des endpoints et variables d'environnement :
[`fast_api/README.md`](fast_api/README.md).

### Frontend

```bash
npm install
npm run dev
```

`.env.local` doit contenir :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# Optionnel : URL interne utilisée seulement par le rendu serveur Next.js
# API_BASE_URL=http://fastapi:8000
```

L'application est servie sur <http://localhost:3000>, l'API sur
<http://localhost:8000> (documentation : <http://localhost:8000/docs>).

## Base de données

Scripts SQL à exécuter dans le SQL Editor de Supabase, **dans cet ordre** :

- `supabase/tools_schema.sql` — table `tools` et cycle de vie `draft`/`published` ;
- `supabase/setup_auth.sql` — table `profiles`, RLS et trigger d'inscription ;
- `supabase/stripe_schema.sql` — colonnes Stripe sur `profiles` ;
- `setup_translations.sql` — table `tool_translations` (cache de traduction).

## Catalogue d'outils

Les fiches vivent dans `data/tools/*.json` et sont la source de vérité :

```bash
npx tsx scripts/validate_tools.ts      # contrôle qualité (bloquant en CI)
npx tsx scripts/sync_tools_to_db.ts    # aperçu de la synchronisation
npx tsx scripts/sync_tools_to_db.ts --write
```

`validate_tools.ts` vérifie notamment que chaque variable `{…}` du
`promptTemplate` correspond à un input déclaré. C'est bloquant : le template
étant injecté dans l'appel LLM, une variable inconnue fuiterait telle quelle
dans le prompt.

Seuls les outils en statut `published` sont servis par l'API.

## Tests

```bash
cd fast_api && python -m pytest -q     # backend
npx tsc --noEmit && npm run lint       # frontend
```
