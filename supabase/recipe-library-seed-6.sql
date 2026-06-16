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
  {"emoji":"🍯","name":"Honey","quantity":2,"unit":"tbsp"}
]',
'[
  {"step":1,"description":"Slice the strawberries and banana into bite-sized pieces."},
  {"step":2,"description":"Divide the Greek yoghurt between two bowls."},
  {"step":3,"description":"Arrange the fruit on top of the yoghurt."},
  {"step":4,"description":"Drizzle with honey and serve straight away."}
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

(null, 'Simple Omelette', '🍳', 'A fluffy 3-egg omelette — great plain or with a sprinkle of cheddar.', 5, 5, 2, 'easy', array['breakfast','lunch','quick'],
'[
  {"emoji":"🥚","name":"Eggs","quantity":6,"unit":"pieces"},
  {"emoji":"🫒","name":"Vegetable oil","quantity":1,"unit":"tbsp"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null},
  {"emoji":"🧀","name":"Cheddar (optional)","quantity":40,"unit":"g"}
]',
'[
  {"step":1,"description":"Crack 3 eggs per person into a bowl. Add a pinch of salt and pepper and beat well with a fork."},
  {"step":2,"description":"Heat a little oil in a non-stick frying pan over medium-high heat."},
  {"step":3,"description":"Pour in the egg mixture. As the edges set, use a spatula to pull them inward so runny egg flows to the edge.","tip":"Don''t walk away — omelettes cook fast!"},
  {"step":4,"description":"When the top is just set but still slightly glossy, scatter over cheddar if using."},
  {"step":5,"description":"Fold the omelette in half, slide onto a plate and serve immediately."}
]',
false),

(null, 'Veggie Omelette', '🌿', 'A filling omelette packed with peppers, mushrooms and spinach.', 10, 8, 2, 'easy', array['breakfast','lunch','healthy'],
'[
  {"emoji":"🥚","name":"Eggs","quantity":6,"unit":"pieces"},
  {"emoji":"🫑","name":"Mixed peppers","quantity":1,"unit":"pieces"},
  {"emoji":"🍄","name":"Mushrooms","quantity":100,"unit":"g"},
  {"emoji":"🥬","name":"Spinach","quantity":60,"unit":"g"},
  {"emoji":"🫒","name":"Vegetable oil","quantity":1,"unit":"tbsp"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Dice the peppers and slice the mushrooms."},
  {"step":2,"description":"Heat half the oil in a frying pan over medium heat. Fry the peppers and mushrooms for 3–4 minutes until softened. Add the spinach and stir until wilted. Set aside."},
  {"step":3,"description":"Beat the eggs with salt and pepper. Add the remaining oil to the pan over medium-high heat."},
  {"step":4,"description":"Pour in the eggs. As they begin to set at the edges, push them inward so runny egg fills the gaps."},
  {"step":5,"description":"Scatter the cooked veg over one half. Fold the omelette and slide onto a plate."}
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
  {"emoji":"🧊","name":"Frozen peas","quantity":80,"unit":"g"},
  {"emoji":"🫑","name":"Mixed peppers","quantity":0.5,"unit":"pieces"},
  {"emoji":"🧄","name":"Garlic powder","quantity":0.5,"unit":"tsp"},
  {"emoji":"🫒","name":"Vegetable oil","quantity":1,"unit":"tbsp"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Dice the peppers."},
  {"step":2,"description":"Heat oil in a wok or large frying pan over high heat. Add garlic powder and stir for a few seconds until fragrant."},
  {"step":3,"description":"Add the peppers and peas. Stir-fry for 2 minutes, then add the rice. Break up any clumps and stir-fry for 2–3 minutes until heated through."},
  {"step":4,"description":"Push everything to the side. Crack the eggs into the empty space, scramble, then mix into the rice as they cook.","tip":"High heat is the secret to good fried rice — don''t be shy with the flame."},
  {"step":5,"description":"Season with salt and pepper. Toss everything together and serve."}
]',
false),

(null, 'Chicken & Cucumber Rice Bowl', '🍗', 'A light, protein-rich bowl with tender chicken and cool cucumber.', 10, 0, 2, 'easy', array['lunch','healthy','no-cook'],
'[
  {"emoji":"🍚","name":"Cooked rice","quantity":300,"unit":"g"},
  {"emoji":"🍗","name":"Cooked chicken breast","quantity":200,"unit":"g"},
  {"emoji":"🥒","name":"Cucumber","quantity":0.5,"unit":"pieces"},
  {"emoji":"🍋","name":"Lemon juice","quantity":1,"unit":"tbsp"},
  {"emoji":"🫒","name":"Olive oil","quantity":1,"unit":"tbsp"},
  {"emoji":"🧄","name":"Garlic powder","quantity":0.25,"unit":"tsp"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null},
  {"emoji":"🌿","name":"Sesame seeds (optional)","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Slice or shred the cooked chicken. Dice the cucumber."},
  {"step":2,"description":"Mix the lemon juice, olive oil, garlic powder and a pinch of salt and pepper together to make a simple dressing."},
  {"step":3,"description":"Divide the rice between two bowls. Top with chicken and cucumber."},
  {"step":4,"description":"Drizzle the dressing over each bowl. Scatter sesame seeds if using. Serve at room temperature or cold."}
]',
false),

(null, 'Egg & Spinach Toast', '🥚', 'A perfectly cooked egg on toast with garlicky wilted spinach — simple and satisfying.', 5, 5, 2, 'easy', array['breakfast','lunch','healthy'],
'[
  {"emoji":"🍞","name":"Sourdough or thick bread","quantity":4,"unit":"pieces"},
  {"emoji":"🥚","name":"Eggs","quantity":2,"unit":"pieces"},
  {"emoji":"🥬","name":"Spinach","quantity":80,"unit":"g"},
  {"emoji":"🫒","name":"Olive oil","quantity":1,"unit":"tbsp"},
  {"emoji":"🧄","name":"Garlic powder","quantity":0.25,"unit":"tsp"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null},
  {"emoji":"🌶️","name":"Chilli flakes (optional)","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Toast the bread."},
  {"step":2,"description":"Heat a little olive oil in a pan over medium heat. Add the spinach and garlic powder, stir until wilted, about 1–2 minutes. Season with salt and pepper."},
  {"step":3,"description":"Poach or fry the eggs to your liking."},
  {"step":4,"description":"Pile the spinach onto the toast. Top each slice with an egg. Finish with chilli flakes if using."}
]',
false),

(null, 'Spinach & Mushroom Egg Bagel', '🥯', 'Fluffy scrambled eggs with wilted spinach and mushrooms piled into a toasted bagel.', 5, 8, 2, 'easy', array['breakfast','lunch','quick'],
'[
  {"emoji":"🥯","name":"Bagels","quantity":2,"unit":"pieces"},
  {"emoji":"🥚","name":"Eggs","quantity":4,"unit":"pieces"},
  {"emoji":"🍄","name":"Mushrooms","quantity":100,"unit":"g"},
  {"emoji":"🥬","name":"Spinach","quantity":60,"unit":"g"},
  {"emoji":"🫒","name":"Vegetable oil","quantity":1,"unit":"tbsp"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Halve and toast the bagels."},
  {"step":2,"description":"Slice the mushrooms. Heat a little oil in a frying pan over medium heat and fry the mushrooms for 3–4 minutes until golden. Add the spinach and stir until just wilted. Season and set aside."},
  {"step":3,"description":"Beat the eggs with a pinch of salt and pepper. Add a little more oil to the pan over low heat. Add eggs and stir gently until just set but still creamy.","tip":"Low and slow makes the best scrambled eggs — take them off the heat while still slightly runny."},
  {"step":4,"description":"Pile the scrambled egg onto the bagel bottoms. Top with the mushroom and spinach mixture. Add the bagel tops and serve."}
]',
false),

(null, 'Simple Chicken Salad', '🥗', 'Leftover chicken tossed with crisp salad leaves, cucumber and peppers in a light dressing.', 10, 0, 2, 'easy', array['lunch','healthy','no-cook'],
'[
  {"emoji":"🍗","name":"Cooked chicken breast","quantity":250,"unit":"g"},
  {"emoji":"🥬","name":"Mixed salad leaves","quantity":80,"unit":"g"},
  {"emoji":"🥒","name":"Cucumber","quantity":0.5,"unit":"pieces"},
  {"emoji":"🫑","name":"Mixed peppers","quantity":1,"unit":"pieces"},
  {"emoji":"🍋","name":"Lemon juice","quantity":2,"unit":"tbsp"},
  {"emoji":"🫒","name":"Olive oil","quantity":2,"unit":"tbsp"},
  {"emoji":"🧂","name":"Salt and pepper","quantity":null,"unit":null}
]',
'[
  {"step":1,"description":"Shred or slice the cooked chicken."},
  {"step":2,"description":"Slice the peppers and dice the cucumber."},
  {"step":3,"description":"Whisk the lemon juice and olive oil together with a pinch of salt and pepper."},
  {"step":4,"description":"Toss the salad leaves, cucumber and peppers together. Add the chicken on top."},
  {"step":5,"description":"Drizzle over the dressing and serve straight away."}
]',
false);
