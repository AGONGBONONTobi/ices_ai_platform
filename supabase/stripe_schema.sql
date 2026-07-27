-- Script SQL pour ajouter les champs Stripe à la table profiles
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamp with time zone;
