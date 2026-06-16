-- ============================================================
-- Breakfast & Lunch recipes — simple, healthy, filling
-- Run this in your Supabase SQL Editor.
-- ============================================================

insert into recipes (family_id, title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags, ingredients, steps, is_ai_generated)
values

-- ── BREAKFAST ───────────────────────────────────────────────

(null, 'Fruit & Yoghurt Bowl', '🍓', 'Fresh fruit on creamy yoghurt with a drizzle of honey — ready in minutes.', 5, 0, 2, 'easy', array['breakfast','healthy','no-cook'],
'[
  {"emoji":"🥛","name":"Greek yoghurt","quantity":400,"unit":"g"},
  {"emoji":"🍓","name":"Strawberries","quantity":100,"unit":"g"},
  {"emoji":"🫐","name":"Blueberries","quantity":80,"unit":"g"},
  {"emoji":"🍌","name":"Banana","quantity":1,"unit":"pieces"},
  {"emoji":"🍯","name":"Honey","quantity":2,"unit":"tbsp"},
  {"emoji":"🌱","name":"Mint (optional)","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Slice the strawberries and banana into bite-sized pieces."},
  {"step":2,"description":"Divide the Greek yoghurt between two bowls."},
  {"step":3,"description":"Arrange the fruit on top of the yoghurt."},
  {"step":4,"description":"Drizzle with honey and add a mint leaf if you have one. Serve straight away."}
]',
false),

(null, 'Granola Breakfast Bowl', '🥣', 'Crunchy granola with yoghurt and fresh fruit — a filling start to the day.', 5, 0, 2, 'easy', array['breakfast','healthy','no-cook'],
'[
  {"emoji":"🥣","name":"Granola","quantity":120,"unit":"g"},
  {"emoji":"🥛","name":"Greek yoghurt","quantity":300,"unit":"g"},
  {"emoji":"🫐","name":"Mixed berries","quantity":150,"unit":"g"},
  {"emoji":"🍯","name":"Honey","quantity":1,"unit":"tbsp"},
  {"emoji":"🥛","name":"Milk (to loosen, optional)","quantity":50,"unit":"ml"}
]',
'[
  {"step":1,"description":"Spoon the yoghurt into two bowls."},
  {"step":2,"description":"Scatter the granola over the top.","tip":"Add a splash of milk to the yoghurt first if you prefer it looser."},
  {"step":3,"description":"Top with the mixed berries and drizzle with honey. Done!"}
]',
false),

(null, 'Simple Omelette', '🍳', 'A fluffy 3-egg omelette — great plain or loaded with whatever you have in the fridge.', 5, 5, 2, 'easy', array['breakfast','lunch','quick'],
'[
  {"emoji":"🥚","name":"Eggs","quantity":6,"unit":"pieces"},
  {"emoji":"🧈","name":"Butter","quantity":10,"unit":"g"},
  {"emoji":"🧂","name":"Salt","quantity":null,"unit":null},
  {"emoji":"🌿","name":"Black pepper","quantity":null,"unit":null},
  {"emoji":"🧀","name":"Cheddar (optional)","quantity":40,"unit":"g"},
  {"emoji":"🌿","name":"Fresh chives or parsley (optional)","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Crack 3 eggs per person into a bowl. Add a pinch of salt and pepper and beat well with a fork."},
  {"step":2,"description":"Melt butter in a non-stick frying pan over medium-high heat until foaming."},
  {"step":3,"description":"Pour in the egg mixture. As the edges set, use a spatula to pull them inward so runny egg flows to the edge.","tip":"Don''t walk away — omelettes cook fast!"},
  {"step":4,"description":"When the top is just set but still slightly glossy, scatter over cheese or herbs if using."},
  {"step":5,"description":"Fold the omelette in half, slide onto a plate and serve immediately."}
]',
false),

(null, 'Veggie Omelette', '🌿', 'A filling omelette packed with peppers, mushrooms and spinach.', 10, 8, 2, 'easy', array['breakfast','lunch','healthy'],
'[
  {"emoji":"🥚","name":"Eggs","quantity":6,"unit":"pieces"},
  {"emoji":"🫑","name":"Mixed peppers","quantity":1,"unit":"pieces"},
  {"emoji":"🍄","name":"Mushrooms","quantity":100,"unit":"g"},
  {"emoji":"🥬","name":"Spinach","quantity":60,"unit":"g"},
  {"emoji":"🧅","name":"Spring onions","quantity":2,"unit":"pieces"},
  {"emoji":"🧈","name":"Butter or oil","quantity":10,"unit":"g"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Dice the peppers, slice the mushrooms and chop the spring onions."},
  {"step":2,"description":"Heat half the butter in a frying pan over medium heat. Fry the peppers and mushrooms for 3–4 minutes until softened. Add the spinach and stir until wilted. Set aside."},
  {"step":3,"description":"Beat the eggs with salt and pepper. Melt remaining butter in the pan over medium-high heat."},
  {"step":4,"description":"Pour in the eggs. As they begin to set at the edges, push them inward so runny egg fills the gaps."},
  {"step":5,"description":"Scatter the cooked veg over one half. Fold the omelette, slide onto a plate and top with spring onions."}
]',
false),

(null, 'Overnight Oats', '🌾', 'Prep in 5 minutes the night before — grab from the fridge in the morning.', 5, 0, 2, 'easy', array['breakfast','healthy','meal-prep'],
'[
  {"emoji":"🌾","name":"Rolled oats","quantity":160,"unit":"g"},
  {"emoji":"🥛","name":"Milk","quantity":300,"unit":"ml"},
  {"emoji":"🥛","name":"Greek yoghurt","quantity":150,"unit":"g"},
  {"emoji":"🍯","name":"Honey or maple syrup","quantity":2,"unit":"tbsp"},
  {"emoji":"🍌","name":"Banana","quantity":1,"unit":"pieces"},
  {"emoji":"🫐","name":"Berries (to serve)","quantity":80,"unit":"g"}
]',
'[
  {"step":1,"description":"Mix the oats, milk, yoghurt and honey together in a bowl or jar. Stir well.","tip":"Jars with lids are perfect for this — easy to grab in the morning."},
  {"step":2,"description":"Cover and refrigerate overnight (or at least 4 hours)."},
  {"step":3,"description":"In the morning, stir and loosen with a splash more milk if needed."},
  {"step":4,"description":"Slice the banana over the top and add berries. Eat cold straight from the fridge."}
]',
false),

(null, 'Banana & Peanut Butter Toast', '🍌', 'Protein-packed toast that takes 3 minutes and keeps you going all morning.', 3, 2, 2, 'easy', array['breakfast','quick','healthy'],
'[
  {"emoji":"🍞","name":"Wholegrain bread","quantity":4,"unit":"pieces"},
  {"emoji":"🥜","name":"Peanut butter","quantity":4,"unit":"tbsp"},
  {"emoji":"🍌","name":"Banana","quantity":2,"unit":"pieces"},
  {"emoji":"🍯","name":"Honey (optional)","quantity":1,"unit":"tbsp"},
  {"emoji":"🌰","name":"Chia seeds or sesame seeds (optional)","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Toast the bread to your liking."},
  {"step":2,"description":"Spread a generous tablespoon of peanut butter on each slice."},
  {"step":3,"description":"Slice the banana and lay over the top."},
  {"step":4,"description":"Drizzle with honey and sprinkle seeds if using. Serve straight away."}
]',
false),

-- ── LUNCH ───────────────────────────────────────────────────

(null, 'Simple Egg Fried Rice', '🍳', 'A quick, filling lunch using leftover rice — ready in 10 minutes.', 5, 10, 2, 'easy', array['lunch','quick','healthy'],
'[
  {"emoji":"🍚","name":"Cooked rice (day-old is best)","quantity":300,"unit":"g"},
  {"emoji":"🥚","name":"Eggs","quantity":3,"unit":"pieces"},
  {"emoji":"🧅","name":"Spring onions","quantity":3,"unit":"pieces"},
  {"emoji":"🌶️","name":"Soy sauce","quantity":2,"unit":"tbsp"},
  {"emoji":"🫒","name":"Sesame oil","quantity":1,"unit":"tsp"},
  {"emoji":"🧊","name":"Frozen peas","quantity":80,"unit":"g"},
  {"emoji":"🧄","name":"Garlic","quantity":2,"unit":"pieces"},
  {"emoji":"🫒","name":"Vegetable oil","quantity":1,"unit":"tbsp"}
]',
'[
  {"step":1,"description":"Slice the spring onions and mince the garlic."},
  {"step":2,"description":"Heat oil in a wok or large frying pan over high heat. Add garlic and stir-fry for 30 seconds."},
  {"step":3,"description":"Add the peas and rice. Break up any clumps and stir-fry for 2–3 minutes until heated through."},
  {"step":4,"description":"Push everything to the side of the pan. Crack the eggs into the empty space, scramble and mix into the rice as they cook.","tip":"High heat is the secret to good fried rice — don''t be shy with the flame."},
  {"step":5,"description":"Add soy sauce and sesame oil. Toss everything together. Top with spring onions and serve."}
]',
false),

(null, 'Tuna & Cucumber Rice Bowl', '🐟', 'A light, protein-rich bowl that comes together in minutes with store-cupboard staples.', 10, 0, 2, 'easy', array['lunch','healthy','no-cook'],
'[
  {"emoji":"🍚","name":"Cooked rice","quantity":300,"unit":"g"},
  {"emoji":"🐟","name":"Tinned tuna (in spring water)","quantity":160,"unit":"g"},
  {"emoji":"🥒","name":"Cucumber","quantity":0.5,"unit":"pieces"},
  {"emoji":"🧅","name":"Spring onions","quantity":2,"unit":"pieces"},
  {"emoji":"🌶️","name":"Soy sauce","quantity":1,"unit":"tbsp"},
  {"emoji":"🫒","name":"Sesame oil","quantity":1,"unit":"tsp"},
  {"emoji":"🍋","name":"Lemon juice","quantity":1,"unit":"tbsp"},
  {"emoji":"🌿","name":"Sesame seeds (optional)","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Dice the cucumber and slice the spring onions."},
  {"step":2,"description":"Drain the tuna and flake into a bowl. Mix in the soy sauce, sesame oil and lemon juice."},
  {"step":3,"description":"Divide the rice between two bowls. Top with tuna, cucumber and spring onions."},
  {"step":4,"description":"Scatter sesame seeds over the top if using. Serve at room temperature or cold."}
]',
false),

(null, 'Avocado & Egg Toast', '🥑', 'Creamy smashed avocado with a perfectly cooked egg — a classic that never gets old.', 5, 5, 2, 'easy', array['breakfast','lunch','healthy'],
'[
  {"emoji":"🍞","name":"Sourdough or thick bread","quantity":4,"unit":"pieces"},
  {"emoji":"🥑","name":"Avocado","quantity":2,"unit":"pieces"},
  {"emoji":"🥚","name":"Eggs","quantity":2,"unit":"pieces"},
  {"emoji":"🍋","name":"Lemon juice","quantity":1,"unit":"tbsp"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null},
  {"emoji":"🌶️","name":"Chilli flakes (optional)","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Toast the bread."},
  {"step":2,"description":"Halve and scoop the avocados into a bowl. Add lemon juice, salt and pepper and mash with a fork to your preferred texture.","tip":"Leave it chunky or go fully smooth — either works great."},
  {"step":3,"description":"Poach or fry the eggs to your liking."},
  {"step":4,"description":"Pile the smashed avocado onto the toast. Top each slice with an egg. Finish with chilli flakes if using."}
]',
false),

(null, 'Tomato & Egg Bagel', '🥯', 'A satisfying bagel with scrambled egg and fresh tomato — great for breakfast or lunch.', 5, 5, 2, 'easy', array['breakfast','lunch','quick'],
'[
  {"emoji":"🥯","name":"Bagels","quantity":2,"unit":"pieces"},
  {"emoji":"🥚","name":"Eggs","quantity":4,"unit":"pieces"},
  {"emoji":"🍅","name":"Tomatoes","quantity":2,"unit":"pieces"},
  {"emoji":"🧈","name":"Butter","quantity":10,"unit":"g"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null},
  {"emoji":"🥬","name":"Rocket or lettuce (optional)","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Slice the tomatoes. Halve and toast the bagels."},
  {"step":2,"description":"Beat the eggs with a pinch of salt and pepper."},
  {"step":3,"description":"Melt butter in a small pan over low heat. Add eggs and stir gently until just set but still creamy.","tip":"Low and slow makes the best scrambled eggs — take them off the heat while still slightly runny."},
  {"step":4,"description":"Pile scrambled egg onto the bagel bottoms. Top with sliced tomato and rocket if using. Add the bagel tops and serve."}
]',
false),

(null, 'Simple Chicken Salad', '🥗', 'Leftover or rotisserie chicken tossed with crisp salad in a light dressing.', 10, 0, 2, 'easy', array['lunch','healthy','no-cook'],
'[
  {"emoji":"🍗","name":"Cooked chicken breast","quantity":250,"unit":"g"},
  {"emoji":"🥬","name":"Mixed salad leaves","quantity":80,"unit":"g"},
  {"emoji":"🥒","name":"Cucumber","quantity":0.5,"unit":"pieces"},
  {"emoji":"🍅","name":"Cherry tomatoes","quantity":100,"unit":"g"},
  {"emoji":"🧅","name":"Red onion","quantity":0.5,"unit":"pieces"},
  {"emoji":"🍋","name":"Lemon juice","quantity":2,"unit":"tbsp"},
  {"emoji":"🫒","name":"Olive oil","quantity":2,"unit":"tbsp"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Shred or slice the cooked chicken."},
  {"step":2,"description":"Halve the cherry tomatoes. Dice the cucumber. Thinly slice the red onion."},
  {"step":3,"description":"Whisk the lemon juice and olive oil together with a pinch of salt and pepper."},
  {"step":4,"description":"Toss the salad leaves, cucumber, tomatoes and onion together. Add the chicken on top."},
  {"step":5,"description":"Drizzle over the dressing and serve straight away."}
]',
false);
