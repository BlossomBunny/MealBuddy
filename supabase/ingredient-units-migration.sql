-- ============================================================
-- Ingredient secondary units
-- Lets an ingredient show a second quantity/unit alongside the
-- primary one, e.g. "1 pack · 6 pieces" or "500 g · 2.5 cups".
-- Run this in your Supabase SQL Editor.
-- ============================================================

alter table ingredients
  add column if not exists secondary_quantity numeric,
  add column if not exists secondary_unit text;
