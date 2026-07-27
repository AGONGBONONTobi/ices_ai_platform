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
