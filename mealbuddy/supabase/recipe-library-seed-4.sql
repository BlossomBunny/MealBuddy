-- ============================================================
-- Meal Buddy — Recipe Library Expansion #4
-- Run this in your Supabase SQL Editor (after recipe-library-seed-3.sql)
-- Adds 5 more built-in recipes (family_id = null, visible to everyone)
-- Focus: filling, healthy diet-friendly meals — less creamy, more
-- cucumber, and rice/bagel/noodle dishes with chicken & broccoli,
-- no cheese.
-- Same dietary rules as before: plant-based meats/butter, passata,
-- garlic/ginger powder, no onions, no vinegar, cheddar or mozzarella
-- only (not used in this batch), no seafood/lamb/venison, and no
-- olives or pickles/gherkins.
-- ============================================================

insert into recipes (title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags, ingredients, steps) values

('Chicken, Broccoli & Rice Bowl', '🥦', 'A simple, protein-packed bowl with golden chicken, steamed broccoli and fluffy rice in a savoury garlic-ginger glaze.', 10, 20, 4, 'easy',
ARRAY['rice','chicken','broccoli','healthy','high-protein','quick'],
'[
{"name":"rice (basmati or jasmine)","quantity":300,"unit":"g","emoji":"🍚"},
{"name":"chicken breast (diced)","quantity":500,"unit":"g","emoji":"🍗"},
{"name":"broccoli (cut into florets)","quantity":300,"unit":"g","emoji":"🥦"},
{"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
{"name":"ground ginger","quantity":1,"unit":"tsp","emoji":"🫚"},
{"name":"soy sauce","quantity":3,"unit":"tbsp","emoji":"🫙"},
{"name":"honey","quantity":1,"unit":"tbsp","emoji":"🍯"},
{"name":"sesame oil","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"sesame seeds","quantity":1,"unit":"tbsp, optional","emoji":"🌱"},
{"name":"vegetable oil","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"}
]'::jsonb,
'[
{"step":1,"description":"Cook the rice according to pack instructions, then fluff with a fork and set aside."},
{"step":2,"description":"Steam or boil the broccoli for 4–5 minutes until tender but still with a bit of bite. Drain and set aside."},
{"step":3,"description":"Heat the vegetable oil in a large frying pan over medium-high heat. Add the diced chicken and cook for 6–7 minutes, stirring occasionally, until golden and cooked through."},
{"step":4,"description":"Stir in the garlic powder and ground ginger and cook for 30 seconds until fragrant."},
{"step":5,"description":"In a small bowl, mix the soy sauce, honey and sesame oil. Pour over the chicken and simmer for 2–3 minutes until glossy and the chicken is well coated.","tip":"For extra veg, stir the broccoli through the chicken at this stage so it soaks up the glaze."},
{"step":6,"description":"Serve the chicken over the rice with the broccoli alongside, sprinkled with sesame seeds. 🥦"}
]'::jsonb),

('Chicken & Cucumber Bagels', '🥯', 'Toasted bagels piled high with juicy chicken, crisp cucumber and a light herby yoghurt dressing — a fresh, filling lunch.', 15, 10, 4, 'easy',
ARRAY['bagel','chicken','cucumber','lunch','quick','healthy'],
'[
{"name":"bagels","quantity":4,"unit":"","emoji":"🥯"},
{"name":"chicken breast","quantity":400,"unit":"g","emoji":"🍗"},
{"name":"cucumber (sliced)","quantity":1,"unit":"","emoji":"🥒"},
{"name":"natural yoghurt","quantity":4,"unit":"tbsp","emoji":"🥣"},
{"name":"lemon juice","quantity":1,"unit":"tbsp","emoji":"🍋"},
{"name":"dried dill or mixed herbs","quantity":1,"unit":"tsp","emoji":"🌿"},
{"name":"garlic powder","quantity":0.5,"unit":"tsp","emoji":"🧄"},
{"name":"lettuce or spinach leaves","quantity":1,"unit":"handful","emoji":"🥬"},
{"name":"olive oil","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"}
]'::jsonb,
'[
{"step":1,"description":"Heat the olive oil in a frying pan over medium heat. Season the chicken breasts with salt and pepper and cook for 6–7 minutes per side until golden and cooked through. Rest for a few minutes, then slice."},
{"step":2,"description":"Meanwhile, mix the yoghurt, lemon juice, dried dill and garlic powder in a small bowl, and season with salt and pepper. This is your dressing.","tip":"Make the dressing ahead of time and chill it — it tastes even better once the flavours have had time to mingle."},
{"step":3,"description":"Slice the bagels in half and toast until golden."},
{"step":4,"description":"Spread the yoghurt dressing over both halves of each bagel."},
{"step":5,"description":"Layer the lettuce, cucumber slices and sliced chicken onto the bottom halves."},
{"step":6,"description":"Top with the other bagel half and serve. 🥯"}
]'::jsonb),

('Lemon Chicken Rice with Cucumber & Tomato Salad', '🍋', 'Zingy lemon herb chicken served with fluffy rice and a crunchy cucumber and tomato salad — light, fresh and filling.', 10, 20, 4, 'easy',
ARRAY['rice','chicken','cucumber','healthy','quick'],
'[
{"name":"rice","quantity":300,"unit":"g","emoji":"🍚"},
{"name":"chicken breast (sliced)","quantity":500,"unit":"g","emoji":"🍗"},
{"name":"lemon juice","quantity":2,"unit":"tbsp","emoji":"🍋"},
{"name":"dried oregano","quantity":1,"unit":"tsp","emoji":"🌿"},
{"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
{"name":"olive oil","quantity":2,"unit":"tbsp","emoji":"🫙"},
{"name":"cucumber (diced)","quantity":1,"unit":"","emoji":"🥒"},
{"name":"cherry tomatoes (halved)","quantity":150,"unit":"g","emoji":"🍅"},
{"name":"fresh parsley (chopped, optional)","quantity":1,"unit":"handful","emoji":"🌿"},
{"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"}
]'::jsonb,
'[
{"step":1,"description":"Cook the rice according to pack instructions."},
{"step":2,"description":"In a bowl, toss the sliced chicken with the lemon juice, dried oregano, garlic powder, 1 tbsp of the olive oil, and a pinch of salt and pepper. Leave to marinate for 10 minutes if you have time.","tip":"Even 10 minutes makes a difference — the lemon helps tenderise the chicken and boosts the flavour."},
{"step":3,"description":"Heat the remaining olive oil in a frying pan over medium-high heat. Cook the chicken for 6–7 minutes, turning occasionally, until golden and cooked through."},
{"step":4,"description":"While the chicken cooks, toss the diced cucumber and cherry tomatoes with a small drizzle of olive oil, a squeeze of lemon juice, and salt and pepper to make the salad."},
{"step":5,"description":"Serve the chicken over the rice with the cucumber and tomato salad on the side, scattered with fresh parsley. 🍋"}
]'::jsonb),

('Sweet Chilli Chicken & Broccoli Rice', '🌶️', 'Sticky sweet chilli chicken with broccoli and rice — a quick, healthy dinner with a gentle kick.', 10, 20, 4, 'easy',
ARRAY['rice','chicken','broccoli','spicy','quick','healthy'],
'[
{"name":"rice","quantity":300,"unit":"g","emoji":"🍚"},
{"name":"chicken breast (diced)","quantity":500,"unit":"g","emoji":"🍗"},
{"name":"broccoli (cut into florets)","quantity":300,"unit":"g","emoji":"🥦"},
{"name":"sweet chilli sauce","quantity":4,"unit":"tbsp","emoji":"🌶️"},
{"name":"soy sauce","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
{"name":"ground ginger","quantity":0.5,"unit":"tsp","emoji":"🫚"},
{"name":"vegetable oil","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"sesame seeds","quantity":1,"unit":"tbsp, optional","emoji":"🌱"}
]'::jsonb,
'[
{"step":1,"description":"Cook the rice according to pack instructions."},
{"step":2,"description":"Steam or boil the broccoli for 4–5 minutes until tender but still with a bit of bite. Drain and set aside."},
{"step":3,"description":"Heat the vegetable oil in a large frying pan over medium-high heat. Add the diced chicken and cook for 6–7 minutes until golden and cooked through."},
{"step":4,"description":"Stir in the garlic powder and ground ginger and cook for 30 seconds until fragrant."},
{"step":5,"description":"Add the sweet chilli sauce and soy sauce, and toss the chicken and broccoli together until everything is glossy and well coated. Simmer for 1–2 minutes.","tip":"If you like it spicier, add a pinch of chilli flakes with the sweet chilli sauce."},
{"step":6,"description":"Serve over the rice, sprinkled with sesame seeds. 🌶️"}
]'::jsonb),

('Chicken, Broccoli & Cucumber Noodle Salad', '🥢', 'A refreshing noodle salad with golden chicken, crisp broccoli and cool cucumber in a light soy-sesame dressing — great warm or cold.', 15, 10, 4, 'easy',
ARRAY['noodles','chicken','broccoli','cucumber','healthy','quick','salad'],
'[
{"name":"noodles (medium egg or rice noodles)","quantity":300,"unit":"g","emoji":"🍜"},
{"name":"chicken breast (sliced)","quantity":400,"unit":"g","emoji":"🍗"},
{"name":"broccoli (small florets)","quantity":200,"unit":"g","emoji":"🥦"},
{"name":"cucumber (sliced into ribbons or batons)","quantity":1,"unit":"","emoji":"🥒"},
{"name":"soy sauce","quantity":3,"unit":"tbsp","emoji":"🫙"},
{"name":"sesame oil","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"honey","quantity":1,"unit":"tsp","emoji":"🍯"},
{"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
{"name":"ground ginger","quantity":0.5,"unit":"tsp","emoji":"🫚"},
{"name":"sesame seeds","quantity":1,"unit":"tbsp","emoji":"🌱"},
{"name":"vegetable oil","quantity":1,"unit":"tbsp","emoji":"🫙"}
]'::jsonb,
'[
{"step":1,"description":"Cook the noodles according to pack instructions, then drain and rinse under cold water to stop them sticking together."},
{"step":2,"description":"Steam or boil the broccoli for 3–4 minutes until just tender, then refresh under cold water and drain well."},
{"step":3,"description":"Heat the vegetable oil in a frying pan over medium-high heat. Season the chicken and cook for 6–7 minutes, turning occasionally, until golden and cooked through. Slice."},
{"step":4,"description":"In a small bowl, whisk together the soy sauce, sesame oil, honey, garlic powder and ground ginger to make the dressing."},
{"step":5,"description":"Toss the noodles, broccoli, cucumber and chicken together with the dressing until well coated.","tip":"This salad is just as good cold the next day — keep it in the fridge for an easy packed lunch."},
{"step":6,"description":"Sprinkle with sesame seeds and serve warm or chilled. 🥢"}
]'::jsonb);
