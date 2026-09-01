-- ============================================================
-- SETUP COMPLET SUPABASE — Plateforme IA
-- À coller intégralement dans le SQL Editor (Supabase Dashboard) et exécuter (Run).
-- Ordre déjà résolu : auth/profiles -> tools -> translations -> referentiels -> stripe.
-- ============================================================

-- ==================== 1. AUTH & PROFILS ====================
-- Script SQL pour configurer Supabase Auth et la table profiles
-- À exécuter dans le SQL Editor de Supabase (Dashboard -> SQL Editor)

-- 1. Activer l'extension "uuid-ossp" (nécessaire pour générer des UUID si besoin)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Créer la table des profils liés à auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  plan text DEFAULT 'free' NOT NULL, -- 'free' ou 'pro' pour la suite (Stripe)
  tools_used_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Sécurité (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Autoriser chaque utilisateur à lire et modifier uniquement son propre profil
CREATE POLICY "Les utilisateurs peuvent lire et modifier leur propre profil" 
  ON public.profiles 
  FOR ALL 
  USING (auth.uid() = id);

-- 4. Fonction Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- 5. Créer le trigger qui s'active après chaque insertion dans auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==================== 2. CATALOGUE D'OUTILS ====================
-- Table `tools` : catalogue des fiches d'outils.
--
-- Cette table existait en production sans être versionnée dans le dépôt : la base
-- n'était donc pas reproductible depuis les scripts SQL. Ce fichier la décrit et
-- ajoute le cycle de vie éditorial (draft / published) prévu au cadrage.
--
-- À exécuter dans le SQL Editor de Supabase, AVANT setup_translations.sql
-- (qui déclare une clé étrangère vers tools.id).

-- 1. Table (création idempotente : ne touche pas à une table existante)
CREATE TABLE IF NOT EXISTS public.tools (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  config jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Cycle de vie éditorial
--    Un outil n'est visible du public qu'en 'published'. Le banc de tests
--    automatisé (chantier B) fera basculer le statut selon le score qualité.
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS quality_score numeric,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  ALTER TABLE public.tools
    ADD CONSTRAINT tools_status_check
    CHECK (status IN ('draft', 'published', 'deprecated'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- 3. Publication de l'existant.
--    Sans cette ligne, l'ajout de la colonne (DEFAULT 'draft') masquerait
--    d'un coup tout le catalogue. À retirer une fois le chantier B en place :
--    la publication deviendra alors le résultat du banc de tests, pas un acquis.
UPDATE public.tools SET status = 'published' WHERE status = 'draft';

-- 4. Index de lecture du catalogue (filtre + tri appliqués par tools_repository)
CREATE INDEX IF NOT EXISTS tools_status_category_idx
  ON public.tools (status, category, id);

-- 5. Lecture publique limitée aux outils publiés.
--    ATTENTION : les policies RLS se combinent en OU. Si une policy permissive
--    préexistante (type « Allow public read access to tools ») subsiste, les
--    brouillons resteront lisibles. Vérifier avant :
--      SELECT policyname, cmd, qual FROM pg_policies
--       WHERE schemaname = 'public' AND tablename = 'tools';
--    et supprimer les policies SELECT qui ne filtrent pas sur `status`.
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des outils publiés" ON public.tools;
CREATE POLICY "Lecture publique des outils publiés"
  ON public.tools
  FOR SELECT
  USING (status = 'published');

-- ==================== 3. TRADUCTIONS ====================
CREATE TABLE IF NOT EXISTS public.tool_translations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id text NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  lang text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  inputs jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(tool_id, lang)
);

ALTER TABLE public.tool_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tool_translations" ON public.tool_translations FOR SELECT USING (true);

-- ==================== 4. RÉFÉRENTIELS & CLAUSES ====================
-- Socle normatif : référentiels et clauses (chantier B4).
--
-- Sans ces tables, un diagnostic ISO reposait sur ce que le modèle « se
-- rappelait » de la norme : versions confondues, exigences approximatives,
-- score inventé. Les clauses sont désormais injectées dans le contexte au
-- moment de l'exécution.
--
-- Point légal : le texte officiel ISO est protégé. On ne stocke ici que des
-- reformulations rédigées par l'équipe, appuyées sur la structure publique de
-- la norme (numérotation et intitulés des chapitres).
--
-- À exécuter dans le SQL Editor de Supabase.

-- 1. Un référentiel = un code + une version. Une révision n'écrase jamais
--    l'ancienne : elle est ajoutée à côté, l'ancienne passant en 'déprécié'.
--    Les rapports déjà générés restent ainsi traçables.
CREATE TABLE IF NOT EXISTS public.referentiels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,                       -- 'ISO-9001'
  version text NOT NULL,                    -- '2015'
  label text NOT NULL,
  statut text NOT NULL DEFAULT 'actif',
  echelle jsonb NOT NULL DEFAULT '{}'::jsonb,   -- niveaux 0..4 et leur libellé
  note_legale text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (code, version)
);

DO $$
BEGIN
  ALTER TABLE public.referentiels
    ADD CONSTRAINT referentiels_statut_check
    CHECK (statut IN ('actif', 'déprécié'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- 2. Une clause = une exigence reformulée, sa grille de maturité et — c'est ce
--    qui fait la valeur de l'outil — les preuves qu'un auditeur recherche et
--    les erreurs qu'il rencontre le plus souvent.
CREATE TABLE IF NOT EXISTS public.clauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referentiel_id uuid NOT NULL REFERENCES public.referentiels(id) ON DELETE CASCADE,
  chapitre text NOT NULL,                   -- '4.1'
  intitule text NOT NULL,
  exigence text NOT NULL,
  preuves jsonb NOT NULL DEFAULT '[]'::jsonb,
  erreurs_frequentes jsonb NOT NULL DEFAULT '[]'::jsonb,
  poids numeric NOT NULL DEFAULT 1,
  ordre integer NOT NULL DEFAULT 0,
  UNIQUE (referentiel_id, chapitre)
);

CREATE INDEX IF NOT EXISTS clauses_referentiel_idx
  ON public.clauses (referentiel_id, ordre);

-- 3. Rattachement d'un outil à un référentiel.
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS referentiel_code text,
  ADD COLUMN IF NOT EXISTS referentiel_version text;

-- 4. Lecture publique : le socle n'est pas un secret, c'est le produit.
--    L'écriture reste réservée au service role (back-office et scripts de sync).
ALTER TABLE public.referentiels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clauses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des référentiels actifs" ON public.referentiels;
CREATE POLICY "Lecture publique des référentiels actifs"
  ON public.referentiels FOR SELECT USING (statut = 'actif');

DROP POLICY IF EXISTS "Lecture publique des clauses" ON public.clauses;
CREATE POLICY "Lecture publique des clauses"
  ON public.clauses FOR SELECT USING (true);

-- ==================== 5. STRIPE ====================
-- Script SQL pour ajouter les champs Stripe à la table profiles
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamp with time zone;
