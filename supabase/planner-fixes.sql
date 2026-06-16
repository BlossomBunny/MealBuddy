-- ============================================================
-- Meal Planner fixes + breakfast/lunch/dinner support
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- 1. Disable RLS on meal_plan.
--    The app uses cookie-based auth, so auth.uid() is always null,
--    which blocks all reads and writes under the default RLS policy.
alter table meal_plan disable row level security;

-- 2. Enable realtime so changes sync instantly between family members.
alter publication supabase_realtime add table meal_plan;

-- 3. Allow breakfast, lunch and dinner as valid meal types.
alter table meal_plan drop constraint if exists meal_plan_meal_type_check;
alter table meal_plan add constraint meal_plan_meal_type_check
  check (meal_type in ('breakfast', 'lunch', 'dinner'));

-- 4. Unique slot per family + date + meal_type (one plan per slot per day).
--    Drop any old date-only unique constraint first.
alter table meal_plan drop constraint if exists meal_plan_family_date_unique;
alter table meal_plan drop constraint if exists meal_plan_family_date_type_unique;
alter table meal_plan add constraint meal_plan_family_date_type_unique
  unique (family_id, planned_for, meal_type);
