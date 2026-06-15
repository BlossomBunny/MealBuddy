-- ============================================================
-- Shopping list automation — staples list
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Things you buy every month (milk, bread, eggs, etc.) — configured
-- once, then added to the shopping list with one tap.
create table if not exists staple_items (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  emoji       text default '🛒',
  category    text not null default 'other',
  quantity    numeric,
  unit        text,
  created_at  timestamptz default now()
);

-- RLS is disabled across this app (access is controlled at the
-- application layer), so no policies are needed here — matches the
-- existing tables.
