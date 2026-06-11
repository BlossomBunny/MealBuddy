-- ============================================================
-- Meal Buddy — Recipe Library Expansion
-- Run this in your Supabase SQL Editor (after auth-migration.sql)
-- Adds 8 more built-in recipes (family_id = null, visible to everyone)
-- Same dietary rules as the original seed: plant-based meats, passata,
-- garlic/ginger powder, no onions, no vinegar, cheddar or mozzarella only.
-- ============================================================

insert into recipes (title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags, ingredients, steps) values

('Cheesy Veggie Quesadillas', '🧀', 'Crispy on the outside, melty and cheesy on the inside. Snack-time hero!', 10, 10, 4, 'easy',
  ARRAY['mexican','quick','snack','vegetarian'],
  '[
    {"name":"flour tortillas","quantity":8,"unit":"large","emoji":"🫓"},
    {"name":"cheddar","quantity":200,"unit":"g, grated","emoji":"🧀"},
    {"name":"sweetcorn","quantity":150,"unit":"g","emoji":"🌽"},
    {"name":"bell peppers (finely chopped)","quantity":1,"unit":"","emoji":"🫑"},
    {"name":"smoked paprika","quantity":0.5,"unit":"tsp","emoji":"🌶️"},
    {"name":"butter","quantity":1,"unit":"tbsp","emoji":"🧈"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Lay out 4 tortillas. Sprinkle cheddar evenly over each, then scatter over the sweetcorn and chopped peppers."},
    {"step":2,"description":"Dust with smoked paprika, then top each with a second tortilla to make a sandwich.","tip":"Press down gently so the filling spreads evenly to the edges."},
    {"step":3,"description":"Melt a little butter in a large frying pan over medium heat. Add a quesadilla and cook 2–3 minutes until golden underneath."},
    {"step":4,"description":"Carefully flip and cook the other side for 2–3 minutes until golden and the cheese is melted through."},
    {"step":5,"description":"Slide onto a board, slice into wedges, and repeat with the rest. Serve warm! 🧀","tip":"A pizza cutter makes slicing quesadillas super easy."}
  ]'::jsonb),

('Margherita Flatbread Pizzas', '🍕', 'Bubbly, cheesy mini pizzas ready faster than delivery!', 10, 12, 4, 'easy',
  ARRAY['italian','vegetarian','quick','kid-friendly'],
  '[
    {"name":"flatbreads or naan","quantity":4,"unit":"","emoji":"🫓"},
    {"name":"passata","quantity":200,"unit":"ml","emoji":"🫙"},
    {"name":"mozzarella","quantity":200,"unit":"g, torn","emoji":"🧀"},
    {"name":"garlic powder","quantity":0.5,"unit":"tsp","emoji":"🧄"},
    {"name":"dried mixed herbs","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"olive oil","quantity":1,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Preheat the oven to 220°C (fan 200°C). Place the flatbreads on a baking tray."},
    {"step":2,"description":"Mix the passata with the garlic powder and half the dried herbs. Spread evenly over each flatbread, leaving a small border."},
    {"step":3,"description":"Tear the mozzarella into pieces and scatter over the top. Drizzle with olive oil and the rest of the herbs.","tip":"Tearing the mozzarella (rather than slicing) gives you lovely golden bubbly patches."},
    {"step":4,"description":"Bake for 10–12 minutes until the cheese is melted and bubbling and the edges are crisp."},
    {"step":5,"description":"Slice into wedges and serve hot. 🍕"}
  ]'::jsonb),

('Creamy Tomato Pasta', '🍅', 'Silky, dreamy tomato pasta that comes together in one pan.', 5, 20, 4, 'easy',
  ARRAY['pasta','italian','vegetarian','comfort-food'],
  '[
    {"name":"pasta (penne or fusilli)","quantity":350,"unit":"g","emoji":"🍝"},
    {"name":"passata","quantity":500,"unit":"ml","emoji":"🫙"},
    {"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
    {"name":"dried basil","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"butter","quantity":1,"unit":"tbsp","emoji":"🧈"},
    {"name":"cream cheese","quantity":100,"unit":"g","emoji":"🧀"},
    {"name":"cheddar","quantity":50,"unit":"g, grated, to serve","emoji":"🧀"},
    {"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Cook the pasta in a large pan of well-salted boiling water according to pack instructions. Drain, reserving a mug of pasta water."},
    {"step":2,"description":"While the pasta cooks, melt the butter in a separate pan over medium heat. Stir in the garlic powder and dried basil for 30 seconds until fragrant."},
    {"step":3,"description":"Pour in the passata and bring to a gentle simmer for 5 minutes."},
    {"step":4,"description":"Stir in the cream cheese until melted and the sauce is silky smooth. Season with salt and pepper.","tip":"If the sauce looks thick, splash in some of the reserved pasta water until glossy."},
    {"step":5,"description":"Toss the drained pasta through the sauce until well coated. Serve topped with grated cheddar. 🍅"}
  ]'::jsonb),

('Veggie Egg Fried Rice', '🍚', 'The ultimate way to use up leftover rice — quick, tasty, and so satisfying.', 10, 10, 4, 'easy',
  ARRAY['asian','quick','rice','vegetarian'],
  '[
    {"name":"cooked rice (cold, day-old is best)","quantity":500,"unit":"g","emoji":"🍚"},
    {"name":"egg","quantity":3,"unit":"large","emoji":"🥚"},
    {"name":"frozen peas","quantity":150,"unit":"g","emoji":"🟢"},
    {"name":"carrot (diced small)","quantity":2,"unit":"","emoji":"🥕"},
    {"name":"soy sauce","quantity":3,"unit":"tbsp","emoji":"🫙"},
    {"name":"sesame oil","quantity":1,"unit":"tsp","emoji":"🫙"},
    {"name":"ground ginger","quantity":0.5,"unit":"tsp","emoji":"🫚"},
    {"name":"vegetable oil","quantity":2,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Beat the eggs in a bowl. Heat 1 tbsp of vegetable oil in a large wok or frying pan over high heat, pour in the eggs, and scramble quickly. Remove and set aside."},
    {"step":2,"description":"Add the remaining oil to the pan. Add the diced carrot and peas, and stir-fry for 3–4 minutes until just tender."},
    {"step":3,"description":"Break up the cold rice with your hands as you add it to the pan, breaking up any clumps.","tip":"Cold, day-old rice fries up much better than fresh — the grains stay separate instead of going mushy."},
    {"step":4,"description":"Stir-fry the rice for 4–5 minutes until heated through and starting to catch slightly at the edges."},
    {"step":5,"description":"Add the ground ginger, soy sauce, and sesame oil, then return the scrambled egg to the pan. Toss everything together for 1–2 minutes. Serve hot! 🍚"}
  ]'::jsonb),

('Loaded Nacho Bake', '🧀', 'A big sharing tray of crunchy nachos loaded with melty cheese — perfect for movie night!', 10, 15, 4, 'easy',
  ARRAY['mexican','plant-based','sharing','fun'],
  '[
    {"name":"tortilla chips","quantity":250,"unit":"g","emoji":"🌽"},
    {"name":"plant mince","quantity":300,"unit":"g","emoji":"🌱"},
    {"name":"passata","quantity":200,"unit":"ml","emoji":"🫙"},
    {"name":"smoked paprika","quantity":1,"unit":"tsp","emoji":"🌶️"},
    {"name":"cumin","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"cheddar","quantity":200,"unit":"g, grated","emoji":"🧀"},
    {"name":"sweetcorn","quantity":100,"unit":"g","emoji":"🌽"},
    {"name":"cherry tomatoes (diced)","quantity":100,"unit":"g","emoji":"🍅"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Heat a splash of oil in a frying pan over medium heat and cook the plant mince for 5 minutes until browned."},
    {"step":2,"description":"Stir in the smoked paprika and cumin, then add the passata. Simmer for 5 minutes until thickened into a rich sauce."},
    {"step":3,"description":"Spread the tortilla chips out on a large baking tray. Spoon the mince mixture evenly over the top, then scatter over the sweetcorn and diced tomatoes."},
    {"step":4,"description":"Cover everything generously with grated cheddar.","tip":"Layer in stages if you have extra chips and cheese — more layers means cheese in every bite!"},
    {"step":5,"description":"Bake for 8–10 minutes until the cheese is melted and bubbling. Serve straight from the tray. 🧀"}
  ]'::jsonb),

('Cheesy Veggie Omelette', '🍳', 'A fluffy, cheesy omelette packed with veggies — breakfast, lunch, or dinner!', 5, 8, 2, 'easy',
  ARRAY['breakfast','vegetarian','quick','protein'],
  '[
    {"name":"egg","quantity":4,"unit":"large","emoji":"🥚"},
    {"name":"milk","quantity":2,"unit":"tbsp","emoji":"🥛"},
    {"name":"cheddar","quantity":60,"unit":"g, grated","emoji":"🧀"},
    {"name":"bell peppers (finely chopped)","quantity":0.5,"unit":"","emoji":"🫑"},
    {"name":"cherry tomatoes (halved)","quantity":6,"unit":"","emoji":"🍅"},
    {"name":"butter","quantity":1,"unit":"tbsp","emoji":"🧈"},
    {"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Whisk the eggs with the milk, salt, and pepper in a bowl until well combined."},
    {"step":2,"description":"Melt the butter in a non-stick frying pan over medium heat. Add the chopped peppers and cook for 2 minutes to soften slightly."},
    {"step":3,"description":"Pour in the egg mixture and tilt the pan so it spreads evenly. Cook for 1–2 minutes until the edges start to set.","tip":"Use a spatula to gently push the cooked edges toward the centre, letting the runny egg flow underneath."},
    {"step":4,"description":"Scatter the cherry tomatoes and grated cheddar over one half of the omelette."},
    {"step":5,"description":"Once mostly set, fold the omelette in half over the filling and cook for another minute until the cheese melts. Slide onto plates and serve. 🍳"}
  ]'::jsonb),

('Sausage & Pepper Pasta Bake', '🍝', 'A bubbling, cheesy pasta bake that''s pure comfort food — great for batch cooking too!', 15, 30, 4, 'medium',
  ARRAY['pasta','plant-based','italian','bake'],
  '[
    {"name":"pasta (penne)","quantity":350,"unit":"g","emoji":"🍝"},
    {"name":"plant-based sausages","quantity":6,"unit":"","emoji":"🌱"},
    {"name":"passata","quantity":500,"unit":"ml","emoji":"🫙"},
    {"name":"bell peppers (sliced)","quantity":2,"unit":"mixed colours","emoji":"🫑"},
    {"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
    {"name":"dried mixed herbs","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"mozzarella","quantity":150,"unit":"g, torn","emoji":"🧀"},
    {"name":"olive oil","quantity":1,"unit":"tbsp","emoji":"🫙"}
  ]'::jsonb,
  '[
    {"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Cook the pasta in well-salted boiling water for 2 minutes less than the pack instructions, then drain.","tip":"Slightly undercooking the pasta now means it won''t go mushy after baking."},
    {"step":2,"description":"Meanwhile, heat the olive oil in a large oven-proof pan or skillet. Slice the sausages into chunks and fry for 5–6 minutes until browned all over."},
    {"step":3,"description":"Add the sliced peppers and cook for 3–4 minutes until starting to soften."},
    {"step":4,"description":"Stir in the garlic powder, dried herbs, and passata. Simmer for 5 minutes."},
    {"step":5,"description":"Add the drained pasta to the sauce and toss to coat. Top with torn mozzarella.","tip":"No oven-proof pan? Just transfer everything to a baking dish before this step."},
    {"step":6,"description":"Bake for 15–18 minutes until the cheese is golden and bubbling. Serve hot. 🍝"}
  ]'::jsonb),

('French Toast Fingers', '🍞', 'Golden, custardy French toast strips — perfect for dunking in syrup!', 5, 10, 4, 'easy',
  ARRAY['breakfast','sweet','quick','kid-friendly'],
  '[
    {"name":"bread (slightly stale)","quantity":6,"unit":"slices","emoji":"🍞"},
    {"name":"egg","quantity":3,"unit":"large","emoji":"🥚"},
    {"name":"milk","quantity":100,"unit":"ml","emoji":"🥛"},
    {"name":"cinnamon","quantity":1,"unit":"tsp","emoji":"🌿"},
    {"name":"butter","quantity":2,"unit":"tbsp","emoji":"🧈"},
    {"name":"maple syrup","quantity":null,"unit":"to serve","emoji":"🍁"},
    {"name":"berries","quantity":null,"unit":"to serve","emoji":"🫐"}
  ]'::jsonb,
  '[
    {"step":1,"description":"In a wide, shallow bowl, whisk together the eggs, milk, and cinnamon."},
    {"step":2,"description":"Slice each piece of bread into 3 thick fingers."},
    {"step":3,"description":"Dip each finger into the egg mixture, turning to coat both sides — let it soak for a few seconds.","tip":"Slightly stale bread soaks up the custard without falling apart."},
    {"step":4,"description":"Melt the butter in a large frying pan over medium heat. Fry the fingers in batches for 2–3 minutes per side until golden brown."},
    {"step":5,"description":"Keep warm in a low oven while you finish the rest. Serve stacked up with maple syrup and berries. 🍞"}
  ]'::jsonb);
