-- ============================================================
-- Family Meal Planner — Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- FAMILIES
-- ─────────────────────────────────────────
create table if not exists families (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  invite_code text unique not null default upper(substring(md5(random()::text), 1, 6)),
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  family_id   uuid references families(id) on delete set null,
  display_name text,
  avatar_emoji text default '🧑‍🍳',
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────
-- INGREDIENTS
-- ─────────────────────────────────────────
create table if not exists ingredients (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  emoji       text not null default '🥦',
  category    text not null default 'other',
  quantity    numeric,
  unit        text,
  expires_at  date,
  added_by    uuid references profiles(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- RECIPES
-- ─────────────────────────────────────────
create table if not exists recipes (
  id              uuid primary key default uuid_generate_v4(),
  family_id       uuid references families(id) on delete cascade, -- null = built-in
  title           text not null,
  emoji           text not null default '🍳',
  description     text,
  prep_time_mins  int,
  cook_time_mins  int,
  servings        int default 4,
  difficulty      text check (difficulty in ('easy', 'medium', 'hard')) default 'easy',
  tags            text[] default '{}',
  ingredients     jsonb not null default '[]', -- [{name, quantity, unit, emoji}]
  steps           jsonb not null default '[]', -- [{step, description, tip?}]
  is_ai_generated boolean default false,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- MEAL PLAN
-- ─────────────────────────────────────────
create table if not exists meal_plan (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  recipe_id   uuid not null references recipes(id) on delete cascade,
  planned_for date not null,
  meal_type   text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')) default 'dinner',
  servings    int default 4,
  cooked      boolean default false,
  cooked_at   timestamptz,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- SHOPPING LIST
-- ─────────────────────────────────────────
create table if not exists shopping_items (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  emoji       text default '🛒',
  quantity    numeric,
  unit        text,
  checked     boolean default false,
  added_by    uuid references profiles(id) on delete set null,
  recipe_id   uuid references recipes(id) on delete set null, -- source recipe if auto-generated
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- COOK LOG (gamification)
-- ─────────────────────────────────────────
create table if not exists cook_log (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  recipe_id   uuid references recipes(id) on delete set null,
  recipe_title text,
  cooked_at   timestamptz default now(),
  rating      int check (rating between 1 and 5),
  note        text
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table families       enable row level security;
alter table profiles       enable row level security;
alter table ingredients    enable row level security;
alter table recipes        enable row level security;
alter table meal_plan      enable row level security;
alter table shopping_items enable row level security;
alter table cook_log       enable row level security;

-- Helper: get the caller's family_id
create or replace function my_family_id()
returns uuid language sql security definer stable as $$
  select family_id from profiles where id = auth.uid()
$$;

-- Profiles: own row only
create policy "profiles_own" on profiles for all using (id = auth.uid());

-- Families: members only
create policy "families_member" on families for all
  using (id = my_family_id());

-- Ingredients: family members
create policy "ingredients_family" on ingredients for all
  using (family_id = my_family_id());

-- Recipes: built-in (family_id IS NULL) visible to all, family recipes visible to family
create policy "recipes_visible" on recipes for select
  using (family_id is null or family_id = my_family_id());
create policy "recipes_family_insert" on recipes for insert
  with check (family_id = my_family_id());
create policy "recipes_family_update" on recipes for update
  using (family_id = my_family_id());
create policy "recipes_family_delete" on recipes for delete
  using (family_id = my_family_id());

-- Meal plan: family members
create policy "meal_plan_family" on meal_plan for all
  using (family_id = my_family_id());

-- Shopping: family members
create policy "shopping_family" on shopping_items for all
  using (family_id = my_family_id());

-- Cook log: family members
create policy "cook_log_family" on cook_log for all
  using (family_id = my_family_id());

-- ─────────────────────────────────────────
-- BUILT-IN RECIPES (seed data)
-- Family-friendly: plant-based meats, passata, garlic/ginger powder,
-- no onions, no vinegar, cheddar or mozzarella only.
-- ─────────────────────────────────────────
insert into recipes (title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags, ingredients, steps) values

('Veggie Bolognese', '🍝', 'All the comfort of a bolognese — rich, saucy and totally plant-based!', 5, 30, 4, 'easy',
  ARRAY['pasta','plant-based','italian'],
  '[
    {"name":"spaghetti","quantity":400,"unit":"g","emoji":"🍝"},
    {"name":"plant mince","quantity":500,"unit":"g","emoji":"🌱"},
    {"name":"passata","quantity":500,"unit":"ml","emoji":"🫙"},
    {"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
    {"name":"dried mixed herbs","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"olive oil","quantity":2,"unit":"tbsp","emoji":"🫙"},
    {"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"},
    {"name":"cheddar","quantity":null,"unit":"grated, to serve","emoji":"🧀"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Heat olive oil in a large pan over medium heat. Add the plant mince and stir-fry for 4–5 minutes until lightly browned.","tip":"Plant mince browns faster than meat — keep it moving so it doesn''t stick!"},
    {"step":2,"description":"Sprinkle in the garlic powder and dried herbs. Stir for 30 seconds until fragrant."},
    {"step":3,"description":"Pour in the passata. Add a small splash of water (about 50ml), stir well, and season with salt and pepper."},
    {"step":4,"description":"Reduce the heat and simmer for 20 minutes, stirring occasionally, until the sauce is thick and rich."},
    {"step":5,"description":"Meanwhile, cook the spaghetti in a large pan of well-salted boiling water according to pack instructions."},
    {"step":6,"description":"Drain the pasta, toss with the sauce, and serve topped with grated cheddar. Dig in! 🍝","tip":"Save a splash of pasta water before draining — stir it in if the sauce needs loosening."}
  ]'::jsonb),

('Asian Stir-fry', '🥡', 'Quick, colourful and full of crunch. Plant-based and on the table in 20 minutes!', 5, 15, 4, 'easy',
  ARRAY['plant-based','quick','asian'],
  '[
    {"name":"Richmond meat-free chicken pieces","quantity":500,"unit":"g","emoji":"🌱"},
    {"name":"soy sauce","quantity":3,"unit":"tbsp","emoji":"🫙"},
    {"name":"sesame oil","quantity":1,"unit":"tbsp","emoji":"🫙"},
    {"name":"garlic powder","quantity":0.5,"unit":"tsp","emoji":"🧄"},
    {"name":"ground ginger","quantity":0.5,"unit":"tsp","emoji":"🫚"},
    {"name":"bell peppers (finely chopped)","quantity":2,"unit":"mixed colours","emoji":"🫑"},
    {"name":"broccoli","quantity":200,"unit":"g","emoji":"🥦"},
    {"name":"cornflour","quantity":1,"unit":"tsp","emoji":"🌽"},
    {"name":"noodles","quantity":300,"unit":"g","emoji":"🍜"},
    {"name":"vegetable oil","quantity":1,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Mix the soy sauce, sesame oil, garlic powder, ground ginger, and cornflour in a bowl. Add the chicken pieces and toss to coat. Set aside."},
    {"step":2,"description":"Cook the noodles according to pack instructions."},
    {"step":3,"description":"Heat a wok or large frying pan over high heat until very hot. Add the vegetable oil.","tip":"A screaming-hot pan is the secret to a proper stir-fry — no soggy veg!"},
    {"step":4,"description":"Add the chicken pieces and stir-fry for 4–5 minutes until golden and slightly crispy. Remove from the pan."},
    {"step":5,"description":"Add the peppers and broccoli to the same pan. Stir-fry for 3–4 minutes until tender but still with a bit of bite."},
    {"step":6,"description":"Return the chicken and noodles to the pan, pour in any remaining sauce, and toss everything together. 🥡"}
  ]'::jsonb),

('Fussy Tacos for 4', '🌮', 'Fun, colourful taco night — let everyone build their own!', 10, 10, 4, 'easy',
  ARRAY['plant-based','mexican','fun'],
  '[
    {"name":"Richmond meat-free chicken pieces","quantity":500,"unit":"g","emoji":"🌱"},
    {"name":"soft or crispy taco shells","quantity":8,"unit":"","emoji":"🫓"},
    {"name":"coriander","quantity":1,"unit":"handful (optional)","emoji":"🌿"},
    {"name":"cheddar","quantity":80,"unit":"g, grated (optional)","emoji":"🧀"},
    {"name":"cumin","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"cucumber","quantity":1,"unit":"diced","emoji":"🥒"},
    {"name":"carrot","quantity":2,"unit":"shredded","emoji":"🥕"},
    {"name":"smoked paprika","quantity":1,"unit":"tsp","emoji":"🌶️"},
    {"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Heat a splash of oil in a frying pan over medium-high heat. Add the Richmond chicken pieces, cumin, and smoked paprika. Cook for 6–8 minutes, stirring occasionally, until golden and slightly crispy at the edges.","tip":"Don''t overcrowd the pan — give them space and they''ll crisp up much better!"},
    {"step":2,"description":"Warm the taco shells in a dry frying pan for 30 seconds each side, or wrap in a damp paper towel and microwave for 30 seconds."},
    {"step":3,"description":"Dice the cucumber and shred the carrots. Set everything out on the table ready to build."},
    {"step":4,"description":"Fill your shells with chicken, then top with cucumber, carrot, cheddar, and coriander. Enjoy! 🌮","tip":"Taco bar style is always more fun — everyone gets exactly what they want."}
  ]'::jsonb),

('Banana Pancakes', '🥞', 'Fluffy, golden pancakes with a natural sweetness. Weekend hero!', 5, 15, 4, 'easy',
  ARRAY['breakfast','sweet'],
  '[
    {"name":"self-raising flour","quantity":200,"unit":"g","emoji":"🌾"},
    {"name":"egg","quantity":2,"unit":"large","emoji":"🥚"},
    {"name":"milk","quantity":200,"unit":"ml","emoji":"🥛"},
    {"name":"banana","quantity":1,"unit":"ripe, mashed","emoji":"🍌"},
    {"name":"butter","quantity":1,"unit":"tbsp","emoji":"🧈"},
    {"name":"maple syrup","quantity":null,"unit":"to serve","emoji":"🍁"},
    {"name":"berries","quantity":null,"unit":"to serve","emoji":"🫐"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Mash the banana in a large bowl until smooth. Whisk in the eggs and milk."},
    {"step":2,"description":"Sift in the flour and a pinch of salt. Stir until just combined — a few lumps are totally fine!","tip":"Overmixing makes tough pancakes. Lumpy batter = fluffy pancakes!"},
    {"step":3,"description":"Heat a non-stick pan over medium heat. Add a small knob of butter and swirl to coat."},
    {"step":4,"description":"Pour in small ladles of batter. Cook 2 min until bubbles appear on top, then flip and cook 1 min more."},
    {"step":5,"description":"Keep warm in the oven (120°C) while you cook the rest. Serve with maple syrup and berries. 🎉"}
  ]'::jsonb);
