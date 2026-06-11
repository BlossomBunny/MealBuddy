-- ============================================================
-- Meal Buddy — Recipe Library Expansion #2
-- Run this in your Supabase SQL Editor (after recipe-library-seed.sql)
-- Adds 10 more built-in recipes (family_id = null, visible to everyone)
-- Built around your preferences: chicken, beef/plant-based mince,
-- pork/plant-based sausages, plant-based "chicken", eggs, broccoli,
-- mushrooms, sweet potato, carrots, pasta/rice/potatoes/bread,
-- Asian/Italian/Mexican/British comfort food, quick weeknight &
-- batch-cook/freezer-friendly meals.
-- Same dietary rules as before: plant-based meats, passata,
-- garlic/ginger powder, no onions, no vinegar, cheddar or mozzarella
-- only, and no seafood/lamb/venison.
-- ============================================================

insert into recipes (title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags, ingredients, steps) values

('Chicken & Broccoli Stir-Fry', '🥦', 'A speedy, saucy stir-fry that''s on the table before you know it!', 10, 12, 4, 'easy',
  ARRAY['asian','quick','chicken','rice'],
  '[
    {"name":"chicken breast (diced)","quantity":500,"unit":"g","emoji":"🍗"},
    {"name":"broccoli (cut into small florets)","quantity":300,"unit":"g","emoji":"🥦"},
    {"name":"carrots (sliced)","quantity":2,"unit":"","emoji":"🥕"},
    {"name":"rice","quantity":300,"unit":"g","emoji":"🍚"},
    {"name":"soy sauce","quantity":4,"unit":"tbsp","emoji":"🫙"},
    {"name":"sesame oil","quantity":1,"unit":"tsp","emoji":"🫙"},
    {"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
    {"name":"ground ginger","quantity":1,"unit":"tsp","emoji":"🫚"},
    {"name":"vegetable oil","quantity":2,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Cook the rice according to pack instructions and keep warm."},
    {"step":2,"description":"Heat 1 tbsp vegetable oil in a wok or large frying pan over high heat. Stir-fry the chicken for 5–6 minutes until cooked through and golden. Remove and set aside."},
    {"step":3,"description":"Add the remaining oil to the pan, then stir-fry the broccoli and carrots for 4–5 minutes until just tender but still a little crisp.","tip":"Cutting the broccoli into small, even florets helps it cook quickly without going soggy."},
    {"step":4,"description":"Stir in the garlic powder and ginger and cook for 30 seconds until fragrant."},
    {"step":5,"description":"Return the chicken to the pan, add the soy sauce and sesame oil, and toss everything together for 1–2 minutes until well coated and piping hot."},
    {"step":6,"description":"Serve over the rice. 🥦"}
  ]'::jsonb),

('Chicken Fried Rice', '🍚', 'A protein-packed twist on fried rice — perfect for using up leftover chicken.', 10, 12, 4, 'easy',
  ARRAY['asian','quick','rice','chicken'],
  '[
    {"name":"cooked rice (cold, day-old is best)","quantity":500,"unit":"g","emoji":"🍚"},
    {"name":"chicken breast (diced small)","quantity":350,"unit":"g","emoji":"🍗"},
    {"name":"egg","quantity":2,"unit":"large","emoji":"🥚"},
    {"name":"frozen peas","quantity":100,"unit":"g","emoji":"🟢"},
    {"name":"carrots (diced small)","quantity":2,"unit":"","emoji":"🥕"},
    {"name":"soy sauce","quantity":3,"unit":"tbsp","emoji":"🫙"},
    {"name":"sesame oil","quantity":1,"unit":"tsp","emoji":"🫙"},
    {"name":"ground ginger","quantity":0.5,"unit":"tsp","emoji":"🫚"},
    {"name":"vegetable oil","quantity":2,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Heat 1 tbsp oil in a large wok or frying pan over high heat. Add the diced chicken and stir-fry for 6–7 minutes until cooked through and golden. Remove and set aside."},
    {"step":2,"description":"Beat the eggs, pour into the pan, and scramble quickly. Remove and set aside with the chicken."},
    {"step":3,"description":"Add the remaining oil, then stir-fry the carrot and peas for 3–4 minutes until tender."},
    {"step":4,"description":"Break up the cold rice with your hands as you add it to the pan, breaking up any clumps. Stir-fry for 4–5 minutes until heated through.","tip":"Cold, day-old rice fries up much better than fresh — the grains stay separate instead of going mushy."},
    {"step":5,"description":"Add the ground ginger and soy sauce, then return the chicken and egg to the pan. Drizzle over the sesame oil and toss everything together for 1–2 minutes. Serve hot! 🍚"}
  ]'::jsonb),

('Creamy Mushroom Pasta Bake', '🍄', 'Rich, creamy, and packed with mushrooms — the ultimate cosy pasta bake.', 10, 30, 4, 'medium',
  ARRAY['italian','vegetarian','bake','comfort-food'],
  '[
    {"name":"pasta (penne)","quantity":350,"unit":"g","emoji":"🍝"},
    {"name":"mushrooms (sliced)","quantity":300,"unit":"g","emoji":"🍄"},
    {"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
    {"name":"dried mixed herbs","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"butter","quantity":2,"unit":"tbsp","emoji":"🧈"},
    {"name":"cream cheese","quantity":150,"unit":"g","emoji":"🧀"},
    {"name":"milk","quantity":200,"unit":"ml","emoji":"🥛"},
    {"name":"cheddar","quantity":100,"unit":"g, grated","emoji":"🧀"},
    {"name":"mozzarella","quantity":100,"unit":"g, torn","emoji":"🧀"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Cook the pasta in well-salted boiling water for 2 minutes less than the pack instructions, then drain."},
    {"step":2,"description":"Melt the butter in a large oven-proof pan or skillet over medium-high heat. Fry the mushrooms for 5–6 minutes until golden and most of their liquid has evaporated.","tip":"Don't overcrowd the pan — if needed, fry the mushrooms in two batches so they brown nicely instead of steaming."},
    {"step":3,"description":"Stir in the garlic powder and dried herbs and cook for 30 seconds until fragrant."},
    {"step":4,"description":"Add the cream cheese and milk, stirring until melted into a smooth sauce. Season with salt and pepper."},
    {"step":5,"description":"Toss the drained pasta through the sauce, then stir in half the cheddar."},
    {"step":6,"description":"If your pan isn't oven-proof, transfer everything to a baking dish. Top with the remaining cheddar and the torn mozzarella."},
    {"step":7,"description":"Bake for 12–15 minutes until golden and bubbling. Serve hot. 🍄"}
  ]'::jsonb),

('Veggie & Mushroom Calzone Pockets', '🥟', 'Folded pizza pockets stuffed with melty cheese and veggies — hand-held dinner fun!', 20, 18, 4, 'medium',
  ARRAY['italian','vegetarian','fun','bake'],
  '[
    {"name":"pizza dough balls (or flatbreads)","quantity":4,"unit":"","emoji":"🥟"},
    {"name":"passata","quantity":150,"unit":"ml","emoji":"🫙"},
    {"name":"garlic powder","quantity":0.5,"unit":"tsp","emoji":"🧄"},
    {"name":"dried oregano","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"mushrooms (sliced)","quantity":200,"unit":"g","emoji":"🍄"},
    {"name":"bell peppers (diced)","quantity":1,"unit":"","emoji":"🫑"},
    {"name":"mozzarella","quantity":200,"unit":"g, torn","emoji":"🧀"},
    {"name":"olive oil","quantity":1,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Preheat the oven to 220°C (fan 200°C). On a floured surface, roll out each piece of dough into an oval."},
    {"step":2,"description":"Mix the passata with the garlic powder and oregano."},
    {"step":3,"description":"Heat a little oil in a pan and fry the mushrooms and peppers for 4–5 minutes until softened and any liquid has cooked off.","tip":"Cook off as much liquid as you can here so your calzones don't go soggy."},
    {"step":4,"description":"Spread the passata mixture over one half of each dough oval, leaving a border around the edge. Top with the mushroom and pepper mixture and the torn mozzarella."},
    {"step":5,"description":"Fold the dough over the filling to make a half-moon shape and press the edges firmly to seal — crimp with a fork for extra security."},
    {"step":6,"description":"Brush the tops with olive oil and place on a baking tray."},
    {"step":7,"description":"Bake for 15–18 minutes until golden and crisp. Serve hot. 🥟"}
  ]'::jsonb),

('BBQ Plant-Based Chicken Wraps', '🌯', 'Smoky, saucy plant-based chicken wrapped up with melty cheese — a quick midweek favourite.', 10, 12, 4, 'easy',
  ARRAY['mexican','plant-based','quick','wraps'],
  '[
    {"name":"plant-based chicken pieces","quantity":300,"unit":"g","emoji":"🌱"},
    {"name":"passata","quantity":150,"unit":"ml","emoji":"🫙"},
    {"name":"smoked paprika","quantity":1,"unit":"tsp","emoji":"🌶️"},
    {"name":"brown sugar","quantity":1,"unit":"tsp","emoji":"🍯"},
    {"name":"garlic powder","quantity":0.5,"unit":"tsp","emoji":"🧄"},
    {"name":"tortilla wraps","quantity":4,"unit":"","emoji":"🫓"},
    {"name":"cheddar","quantity":100,"unit":"g, grated","emoji":"🧀"},
    {"name":"bell peppers (sliced)","quantity":1,"unit":"","emoji":"🫑"},
    {"name":"vegetable oil","quantity":1,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Heat the oil in a frying pan over medium heat and cook the plant-based chicken pieces for 5–6 minutes until golden, following the pack instructions."},
    {"step":2,"description":"Add the sliced peppers and cook for 2–3 minutes until just softened."},
    {"step":3,"description":"Stir in the passata, smoked paprika, brown sugar, and garlic powder. Simmer for 4–5 minutes until thickened into a sticky, smoky sauce.","tip":"The brown sugar balances the smoky paprika to give a BBQ flavour without needing any vinegar."},
    {"step":4,"description":"Warm the tortilla wraps according to the pack instructions."},
    {"step":5,"description":"Divide the BBQ plant-chicken mixture between the wraps, sprinkle with cheddar, and roll up tightly. Serve warm. 🌯"}
  ]'::jsonb),

('Loaded Sweet Potato Boats', '🍠', 'Baked sweet potatoes loaded with a smoky plant mince filling and melted cheese.', 10, 45, 4, 'easy',
  ARRAY['mexican','vegetarian','plant-based','bake'],
  '[
    {"name":"sweet potatoes","quantity":4,"unit":"medium","emoji":"🍠"},
    {"name":"plant-based mince","quantity":250,"unit":"g","emoji":"🌱"},
    {"name":"passata","quantity":200,"unit":"ml","emoji":"🫙"},
    {"name":"smoked paprika","quantity":1,"unit":"tsp","emoji":"🌶️"},
    {"name":"cumin","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"sweetcorn","quantity":100,"unit":"g","emoji":"🌽"},
    {"name":"cheddar","quantity":100,"unit":"g, grated","emoji":"🧀"},
    {"name":"olive oil","quantity":1,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Prick the sweet potatoes a few times with a fork, rub with a little oil, and place on a baking tray."},
    {"step":2,"description":"Bake for 40–45 minutes until tender all the way through.","tip":"A knife should slide in easily when they're ready — bigger potatoes may need a little longer."},
    {"step":3,"description":"Meanwhile, heat the remaining oil in a pan and cook the plant-based mince with the smoked paprika and cumin for 5 minutes."},
    {"step":4,"description":"Stir in the passata and sweetcorn and simmer for 8–10 minutes until thickened."},
    {"step":5,"description":"Slice the sweet potatoes open lengthways and fluff up the inside with a fork."},
    {"step":6,"description":"Spoon the filling into each potato and top generously with grated cheddar."},
    {"step":7,"description":"Return to the oven for 5 minutes until the cheese is melted. Serve hot. 🍠"}
  ]'::jsonb),

('Beef & Carrot Cottage Pie', '🥧', 'A classic, hearty cottage pie with a fluffy mashed potato top — perfect for batch cooking!', 20, 40, 6, 'medium',
  ARRAY['british','comfort-food','bake','batch-cook'],
  '[
    {"name":"beef mince (or plant-based mince)","quantity":500,"unit":"g","emoji":"🥩"},
    {"name":"carrots (diced)","quantity":3,"unit":"","emoji":"🥕"},
    {"name":"passata","quantity":300,"unit":"ml","emoji":"🫙"},
    {"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
    {"name":"dried mixed herbs","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"potatoes","quantity":1,"unit":"kg","emoji":"🥔"},
    {"name":"butter","quantity":2,"unit":"tbsp","emoji":"🧈"},
    {"name":"milk","quantity":100,"unit":"ml","emoji":"🥛"},
    {"name":"cheddar","quantity":80,"unit":"g, grated","emoji":"🧀"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Peel and chop the potatoes into chunks, then boil in salted water for 15–20 minutes until tender."},
    {"step":2,"description":"Meanwhile, brown the mince in a large pan over medium-high heat for 6–8 minutes."},
    {"step":3,"description":"Add the diced carrots, garlic powder, and dried herbs, and cook for 3–4 minutes."},
    {"step":4,"description":"Stir in the passata and simmer for 10–15 minutes until thickened into a rich sauce.","tip":"The longer this simmers, the better it tastes — give it extra time if you have it."},
    {"step":5,"description":"Drain the potatoes and mash with the butter and milk until smooth. Season to taste."},
    {"step":6,"description":"Preheat the oven to 200°C (fan 180°C). Spoon the meat mixture into a baking dish, then spread the mash on top and fluff the surface with a fork."},
    {"step":7,"description":"Sprinkle the cheddar over the top and bake for 20–25 minutes until golden and bubbling. Serve hot. 🥧","tip":"This freezes brilliantly — assemble, cool, and freeze before baking for an easy future meal."}
  ]'::jsonb),

('Sausage, Sweet Potato & Broccoli Traybake', '🌭', 'Everything roasts together on one tray — easy, colourful, and great for batch cooking.', 10, 35, 4, 'easy',
  ARRAY['british','plant-based','bake','batch-cook'],
  '[
    {"name":"plant-based sausages","quantity":8,"unit":"","emoji":"🌱"},
    {"name":"sweet potatoes (cubed)","quantity":2,"unit":"large","emoji":"🍠"},
    {"name":"broccoli (cut into florets)","quantity":1,"unit":"head","emoji":"🥦"},
    {"name":"bell peppers (sliced)","quantity":1,"unit":"","emoji":"🫑"},
    {"name":"olive oil","quantity":2,"unit":"tbsp","emoji":"🫙"},
    {"name":"smoked paprika","quantity":1,"unit":"tsp","emoji":"🌶️"},
    {"name":"dried mixed herbs","quantity":1,"unit":"tsp","emoji":"🌿"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Place the sweet potato cubes and sausages on a large baking tray, drizzle with the oil, and toss with the smoked paprika and dried herbs."},
    {"step":2,"description":"Roast for 20 minutes."},
    {"step":3,"description":"Add the broccoli florets and pepper slices to the tray, toss everything together again, and return to the oven for 15 minutes until tender and golden.","tip":"Cut the sweet potato into small, even pieces so everything finishes cooking at the same time."},
    {"step":4,"description":"Serve straight from the tray. 🌭"}
  ]'::jsonb),

('Mushroom & Cheddar Jacket Potatoes', '🥔', 'Fluffy baked potatoes topped with a creamy mushroom and cheese filling.', 5, 60, 4, 'easy',
  ARRAY['british','vegetarian','comfort-food'],
  '[
    {"name":"baking potatoes","quantity":4,"unit":"large","emoji":"🥔"},
    {"name":"mushrooms (sliced)","quantity":250,"unit":"g","emoji":"🍄"},
    {"name":"butter","quantity":2,"unit":"tbsp","emoji":"🧈"},
    {"name":"garlic powder","quantity":0.5,"unit":"tsp","emoji":"🧄"},
    {"name":"cream cheese","quantity":100,"unit":"g","emoji":"🧀"},
    {"name":"cheddar","quantity":100,"unit":"g, grated","emoji":"🧀"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Prick the potatoes a few times with a fork and place directly on the oven shelf. Bake for 60 minutes until the skins are crisp and the centres are soft.","tip":"No time to wait? Microwave the potatoes for 5 minutes first to speed things up, then finish in the oven for 25–30 minutes for crispy skins."},
    {"step":2,"description":"About 10 minutes before the potatoes are ready, melt the butter in a pan and fry the mushrooms for 6–7 minutes until golden."},
    {"step":3,"description":"Stir in the garlic powder and cream cheese until melted into a creamy sauce."},
    {"step":4,"description":"Slice the potatoes open and fluff up the insides with a fork."},
    {"step":5,"description":"Spoon the mushroom mixture over each potato and top with the grated cheddar. Serve hot. 🥔"}
  ]'::jsonb),

('Crispy Chicken Goujons with Sweet Potato Wedges', '🍗', 'Crunchy oven-baked chicken strips with golden sweet potato wedges — a guaranteed family favourite.', 15, 25, 4, 'easy',
  ARRAY['british','kid-friendly','quick','bake'],
  '[
    {"name":"chicken breast (cut into strips)","quantity":500,"unit":"g","emoji":"🍗"},
    {"name":"breadcrumbs","quantity":150,"unit":"g","emoji":"🍞"},
    {"name":"egg (beaten)","quantity":2,"unit":"large","emoji":"🥚"},
    {"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
    {"name":"smoked paprika","quantity":0.5,"unit":"tsp","emoji":"🌶️"},
    {"name":"sweet potatoes (cut into wedges)","quantity":3,"unit":"large","emoji":"🍠"},
    {"name":"olive oil","quantity":2,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Toss the sweet potato wedges with 1 tbsp of the oil, spread out on a baking tray, and roast for 25–30 minutes, turning halfway."},
    {"step":2,"description":"Mix the breadcrumbs with the garlic powder and smoked paprika in a shallow bowl."},
    {"step":3,"description":"Dip each chicken strip into the beaten egg, then coat in the breadcrumb mixture, pressing gently so it sticks.","tip":"Pressing the crumbs on firmly gives you an extra-crunchy coating that won't fall off."},
    {"step":4,"description":"Place the coated chicken strips on a separate baking tray and drizzle with the remaining oil."},
    {"step":5,"description":"Bake for 15–18 minutes, turning halfway, until golden and cooked through."},
    {"step":6,"description":"Serve the goujons with the sweet potato wedges. 🍗"}
  ]'::jsonb);
