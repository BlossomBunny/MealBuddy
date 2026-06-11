-- ============================================================
-- Add category to shopping_items
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';
