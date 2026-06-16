-- ============================================================
-- Leftovers in the weekly planner
-- Lets a planned day be marked as "Leftovers" from an earlier
-- recipe, with optional extra ingredients that get deducted
-- from the pantry when logged.
-- Run this in your Supabase SQL Editor.
-- ============================================================

alter table meal_plan
  add column if not exists leftover_recipe_id uuid references recipes(id) on delete set null,
  add column if not exists leftover_extra_ingredients jsonb default '[]'::jsonb;

-- Extend the special check to include 'leftovers'
alter table meal_plan drop constraint if exists meal_plan_special_check;
alter table meal_plan add constraint meal_plan_special_check
  check (special is null or special in ('takeaway', 'eating_out', 'microwave', 'leftovers'));
