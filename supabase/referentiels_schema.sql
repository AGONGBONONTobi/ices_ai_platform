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
