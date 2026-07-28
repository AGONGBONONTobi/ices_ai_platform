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
