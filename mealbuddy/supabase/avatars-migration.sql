-- ============================================================
-- Meal Buddy — Avatars & Family Icons
-- Run this in your Supabase SQL Editor
-- Adds support for custom photo avatars (profiles) and
-- custom family icons, plus a public storage bucket to hold them.
-- ============================================================

-- Profiles: optional uploaded photo (falls back to avatar_emoji if null)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Families: optional emoji icon + optional uploaded photo
ALTER TABLE families ADD COLUMN IF NOT EXISTS icon_emoji TEXT DEFAULT '👨‍👩‍👧‍👦';
ALTER TABLE families ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- ─────────────────────────────────────────
-- STORAGE: public "avatars" bucket
-- ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view avatar images (bucket is public)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Uploads/updates/deletes — handled in-app (same model as the rest of this app,
-- which uses passcode auth instead of Supabase Auth + RLS)
DROP POLICY IF EXISTS "avatars_public_insert" ON storage.objects;
CREATE POLICY "avatars_public_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_public_update" ON storage.objects;
CREATE POLICY "avatars_public_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_public_delete" ON storage.objects;
CREATE POLICY "avatars_public_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');
