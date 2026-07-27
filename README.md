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

Scripts SQL à exécuter dans le SQL Editor de Supabase :

- `supabase/setup_auth.sql` — table `profiles`, RLS et trigger d'inscription ;
- `supabase/stripe_schema.sql` — colonnes Stripe sur `profiles` ;
- `setup_translations.sql` — table `tool_translations` (cache de traduction).

Le catalogue (`data/tools/*.json`) est généré et importé par les scripts de
`scripts/` (`npx tsx scripts/generate_tools_from_catalog_v2.ts`).

## Autres dossiers

- `react-app/` — application Vite indépendante (site vitrine).
- `index.html`, `css/`, `js/`, `assets/` — ancienne version statique du site.
