-- ============================================================
-- Remove Supabase Auth — switch to simple passcode auth
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop old RLS policies first (they depend on my_family_id())
DROP POLICY IF EXISTS "profiles_own"          ON profiles;
DROP POLICY IF EXISTS "families_member"        ON families;
DROP POLICY IF EXISTS "ingredients_family"     ON ingredients;
DROP POLICY IF EXISTS "recipes_visible"        ON recipes;
DROP POLICY IF EXISTS "recipes_family_insert"  ON recipes;
DROP POLICY IF EXISTS "recipes_family_update"  ON recipes;
DROP POLICY IF EXISTS "recipes_family_delete"  ON recipes;
DROP POLICY IF EXISTS "meal_plan_family"       ON meal_plan;
DROP POLICY IF EXISTS "shopping_family"        ON shopping_items;
DROP POLICY IF EXISTS "cook_log_family"        ON cook_log;

-- Drop the old auth trigger + functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS my_family_id();

-- Drop the FK linking profiles to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make profiles.id auto-generate (no longer tied to auth.users)
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Add passcode column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passcode TEXT NOT NULL DEFAULT '';

-- Disable RLS on all tables (we handle access in the app)
ALTER TABLE families       DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients    DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes        DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan      DISABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cook_log       DISABLE ROW LEVEL SECURITY;
