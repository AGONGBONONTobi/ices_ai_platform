# Lancer le projet

Le projet tourne en **deux processus** qu'il faut démarrer tous les deux :

| Processus | Dossier | Port | Rôle |
| --- | --- | --- | --- |
| Backend FastAPI | `fast_api/` | `8000` | Catalogue, exécution IA, Stripe |
| Frontend Next.js | racine | `3000` | Interface, authentification |

Le frontend ne fonctionne pas sans le backend : les pages catalogue, outil,
login et signup lisent leurs données via l'API.

---

## 1. Prérequis

- **Node.js 18+** et **npm**
- **Python 3.10+**
- Un projet **Supabase** avec les tables créées (voir
  [Base de données](#5-base-de-données))
- Une clé API **Groq**
- (Optionnel) Des clés **Stripe** pour la facturation

---

## 2. Installation (une seule fois)

### Backend

```bash
cd fast_api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Créer le fichier de configuration :

```bash
cp .env.example .env
```

Puis renseigner `fast_api/.env` :

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GROQ_API_KEY=...

# Optionnels — sans eux, seule la facturation est indisponible
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=

FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
```

> Les quatre premières variables sont **obligatoires** : le backend refuse de
> démarrer si l'une manque.

### Frontend

```bash
cd ..          # revenir à la racine
npm install
```

Créer `.env.local` à la racine :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 3. Lancement quotidien

Ouvrir **deux terminaux**.

**Terminal 1 — backend :**

```bash
cd fast_api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend :**

```bash
npm run dev
```

Puis ouvrir <http://localhost:3000> (redirection automatique vers
`/fr`, `/en`… selon la langue du navigateur).

### Adresses utiles

| URL | Description |
| --- | --- |
| <http://localhost:3000/fr> | Catalogue des outils |
| <http://localhost:3000/fr/login> | Connexion |
| <http://localhost:8000/docs> | Documentation interactive de l'API |
| <http://localhost:8000/api/health> | Vérification de l'état du backend |

---

## 4. Vérifier que tout fonctionne

```bash
# Le backend répond
curl http://localhost:8000/api/health
# → {"status":"ok"}

# Le backend voit bien la base
curl http://localhost:8000/api/tools/count
# → {"count":1081}

# Le frontend répond
curl -o /dev/null -w "%{http_code}\n" http://localhost:3000/fr
# → 200
```

Le catalogue doit afficher le nombre d'outils dans l'en-tête. S'il affiche
« 0 outil » ou l'état vide, c'est que le backend est éteint ou mal configuré.

---

## 5. Base de données

À exécuter une fois dans le **SQL Editor** de Supabase, dans cet ordre :

1. `supabase/setup_auth.sql` — table `profiles`, RLS, trigger d'inscription
2. `supabase/stripe_schema.sql` — colonnes Stripe sur `profiles`
3. `setup_translations.sql` — table `tool_translations` (cache de traduction)

Pour remplir le catalogue d'outils :

```bash
npx tsx scripts/generate_tools_from_catalog_v2.ts
```

---

## 6. Mode production

```bash
# Backend (sans --reload, avec plusieurs workers)
cd fast_api
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend
npm run build
npm run start
```

En production, penser à :

- pointer `NEXT_PUBLIC_API_BASE_URL` vers l'URL publique du backend ;
- ajouter cette même URL de frontend dans `CORS_ORIGINS` et `FRONTEND_URL`
  côté backend ;
- déclarer le webhook Stripe sur `https://<backend>/api/stripe/webhook`.

Si le frontend et le backend partagent un réseau privé (Docker, service mesh),
définir en plus `API_BASE_URL` côté Next.js : le rendu serveur utilisera cette
URL interne, le navigateur gardant `NEXT_PUBLIC_API_BASE_URL`.

---

## 7. Problèmes courants

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| `pydantic_core.ValidationError` au démarrage du backend | Variable manquante dans `fast_api/.env` | Comparer avec `.env.example` |
| Catalogue vide, console « Impossible de charger le catalogue » | Backend éteint | Démarrer uvicorn sur le port 8000 |
| Erreur CORS dans la console du navigateur | Origine non autorisée | Ajouter l'URL du frontend à `CORS_ORIGINS` |
| `401` sur l'exécution d'un outil | Session expirée | Se reconnecter sur `/fr/login` |
| `QUOTA_EXCEEDED` | 3 exécutions gratuites atteintes | Passer en PRO, ou augmenter `FREE_TIER_LIMIT` |
| Checkout Stripe en `503` | `STRIPE_PRO_PRICE_ID` non défini | Créer un prix dans Stripe et le renseigner |
| `Failed to fetch Inter from Google Fonts` au build | Pas d'accès réseau | Relancer `npm run build` |
| Port déjà utilisé | Instance précédente encore active | `uvicorn ... --port 8001` / `npm run dev -- -p 3001` |

---

## 8. Arrêter

`Ctrl+C` dans chacun des deux terminaux.
