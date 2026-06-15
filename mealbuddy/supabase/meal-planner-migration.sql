-- ============================================================
-- Weekly meal planner — allow "not cooking" days
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- A planned meal no longer has to be tied to a recipe — it can be a
-- Takeaway / Eating Out / Microwave Meal day instead.
ALTER TABLE meal_plan ALTER COLUMN recipe_id DROP NOT NULL;

-- 'takeaway' | 'eating_out' | 'microwave' | NULL (NULL = a real recipe is planned)
ALTER TABLE meal_plan ADD COLUMN IF NOT EXISTS special TEXT;

-- Every row must be either a recipe or a special "not cooking" option
ALTER TABLE meal_plan DROP CONSTRAINT IF EXISTS meal_plan_recipe_or_special;
ALTER TABLE meal_plan ADD CONSTRAINT meal_plan_recipe_or_special
  CHECK (recipe_id IS NOT NULL OR special IS NOT NULL);

ALTER TABLE meal_plan DROP CONSTRAINT IF EXISTS meal_plan_special_check;
ALTER TABLE meal_plan ADD CONSTRAINT meal_plan_special_check
  CHECK (special IS NULL OR special IN ('takeaway', 'eating_out', 'microwave'));
