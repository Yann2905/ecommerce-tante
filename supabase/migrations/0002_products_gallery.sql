-- ============================================================================
--  products.gallery — photos supplémentaires par produit (galerie fiche produit)
-- ----------------------------------------------------------------------------
--  Tableau d'URLs (Supabase Storage). La photo de couverture reste `image_url`.
--  La fiche produit affiche [image_url, ...gallery] en carrousel défilable.
--
--  À exécuter dans Supabase → SQL Editor.
-- ============================================================================

alter table public.products
  add column if not exists gallery text[] not null default '{}';
