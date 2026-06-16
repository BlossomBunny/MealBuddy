-- ============================================================
-- Store active meal slots per family
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Add active_meal_slots column to families table
alter table families
  add column if not exists active_meal_slots text[] not null
  default array['breakfast','lunch','dinner']::text[];

-- Enable realtime so slot changes sync instantly across family devices
alter publication supabase_realtime add table families;
