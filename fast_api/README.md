# Backend FastAPI — Plateforme IA

Backend de la plateforme d'outils d'analyse IA. Il contient toute la logique
métier qui vivait auparavant dans les Route Handlers et Server Components
Next.js (`src/app/api/*`, `src/lib/i18n/translateTool.ts`, `src/lib/stripe/*`).

Le frontend Next.js ne parle plus à Supabase que pour l'**authentification**
(cookies de session) ; il transmet le jeton d'accès à cette API en
`Authorization: Bearer <access_token>`.

## Endpoints

Toutes les routes sont montées sous `/api`.

| Méthode | Route | Auth | Remplace |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | — |
| `GET` | `/api/tools?lang=fr` | — | requête Supabase de `src/app/[lang]/page.tsx` |
| `GET` | `/api/tools/count` | — | requête Supabase des pages login/signup |
| `GET` | `/api/tools/{id}?lang=fr` | — | `src/app/[lang]/tool/[id]/page.tsx` + `translateTool.ts` |
| `GET` | `/api/me` | ✅ | lectures `profiles` des Server Components |
| `POST` | `/api/execute` | ✅ | `src/app/api/execute/route.ts` |
| `POST` | `/api/stripe/checkout` | ✅ | `src/app/api/stripe/checkout/route.ts` |
| `POST` | `/api/stripe/webhook` | signature Stripe | `src/app/api/stripe/webhook/route.ts` |

Documentation interactive : <http://localhost:8000/docs>

## Ce qui reste côté Next.js

- Supabase Auth (login, signup, OAuth Google, cookies de session) : `AuthForm`,
  `src/app/auth/callback`, `src/app/auth/signout`, `src/middleware.ts`.
- Rendu, i18n des libellés d'interface, génération PDF.

## Différences de comportement notables

- **Checkout Stripe** : l'ancienne route Next répondait par une redirection 303.
  L'API renvoie maintenant `{"url": "..."}` et c'est le composant
  `CheckoutButton` qui redirige le navigateur.
- **Quota dépassé** : renvoyé en `403` avec
  `{"detail": {"error": "QUOTA_EXCEEDED", "details": "..."}}`. Le client
  l'expose via `ApiError.code`.
- **Catalogue traduit** : `/api/tools` n'applique que les traductions déjà en
  cache (traduire 1000+ outils à la volée serait prohibitif). La traduction LLM
  se déclenche à l'ouverture d'un outil, comme avant.

## Installation

```bash
cd fast_api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # puis renseigner les clés
```

## Lancement

```bash
uvicorn app.main:app --reload --port 8000
```

Côté frontend, pointer Next.js vers l'API dans `.env.local` :

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# Optionnel : URL interne utilisée uniquement par le rendu serveur
# API_BASE_URL=http://fastapi:8000
```

## Variables d'environnement

| Variable | Requis | Description |
| --- | --- | --- |
| `SUPABASE_URL` | ✅ | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | ✅ | Clé publique — lectures publiques + vérification des jetons |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Clé service role — profils, webhooks, cache de traduction |
| `GROQ_API_KEY` | ✅ | Clé API Groq |
| `GROQ_MODEL` | — | Défaut `llama-3.1-8b-instant` |
| `STRIPE_SECRET_KEY` | — | Requis pour la facturation |
| `STRIPE_WEBHOOK_SECRET` | — | Requis pour `/api/stripe/webhook` |
| `STRIPE_PRO_PRICE_ID` | — | Sans lui, `/api/stripe/checkout` répond `503` |
| `FRONTEND_URL` | — | Base des `success_url` / `cancel_url` Stripe |
| `CORS_ORIGINS` | — | Origines autorisées, séparées par des virgules |
| `FREE_TIER_LIMIT` | — | Exécutions gratuites par compte (défaut `3`) |

## Webhook Stripe

L'URL à déclarer dans le dashboard Stripe devient
`https://<backend>/api/stripe/webhook` (et non plus l'URL du frontend Next.js).

Événements traités : `checkout.session.completed`,
`customer.subscription.updated`, `customer.subscription.deleted`.

## Structure

```
fast_api/
├── app/
│   ├── main.py            # application, CORS, montage des routers
│   ├── config.py          # settings (pydantic-settings)
│   ├── deps.py            # auth Bearer + chargement du profil
│   ├── schemas.py         # modèles Pydantic (portage de tool-schema.ts)
│   ├── i18n.py            # locales, noms de langues
│   ├── routers/
│   │   ├── tools.py           # catalogue et fiche outil
│   │   ├── execute.py         # exécution LLM + quota
│   │   ├── profile.py         # /me
│   │   └── stripe_routes.py   # checkout + webhook
│   └── services/
│       ├── supabase_client.py # clients anon / service role
│       ├── groq_client.py
│       ├── stripe_client.py
│       ├── prompt_builder.py  # portage de prompt-builder.ts
│       └── translation.py     # portage de translateTool.ts
└── requirements.txt
```
