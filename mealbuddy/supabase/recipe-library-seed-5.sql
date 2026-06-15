-- ============================================================
-- Meal Buddy — Recipe Library Expansion #5
-- Run this in your Supabase SQL Editor (after recipe-library-seed-4.sql)
-- Adds 3 more built-in recipes (family_id = null, visible to everyone)
-- Includes the new "dessert" category plus a requested Japanese
-- rice-ball recipe.
-- Same dietary rules as before: plant-based meats where applicable,
-- passata, garlic/ginger powder, no onions, no vinegar, cheddar or
-- mozzarella only (not used in this batch), no seafood/lamb/venison,
-- no olives or pickles/gherkins.
-- ============================================================

insert into recipes (title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags, ingredients, steps) values

('Yakitori Onigiri', '🍙', 'Sticky rice balls glazed with Kikkoman yakitori sauce — a fun, portable Japanese snack with an optional savoury filling.', 15, 10, 4, 'easy',
ARRAY['japanese','rice','snack','quick','fun'],
'[
{"name":"sushi or short-grain rice","quantity":300,"unit":"g","emoji":"🍚"},
{"name":"Kikkoman yakitori sauce/glaze","quantity":4,"unit":"tbsp","emoji":"🫙"},
{"name":"garlic powder","quantity":0.5,"unit":"tsp","emoji":"🧄"},
{"name":"ground ginger","quantity":0.5,"unit":"tsp","emoji":"🫚"},
{"name":"meat-free chicken pieces (e.g. Richmond), optional filling","quantity":100,"unit":"g","emoji":"🌱"},
{"name":"sesame seeds","quantity":1,"unit":"tbsp","emoji":"🌱"},
{"name":"nori (seaweed) sheets, optional","quantity":2,"unit":"","emoji":"🌿"},
{"name":"salt","quantity":null,"unit":"to taste","emoji":"🧂"}
]'::jsonb,
'[
{"step":1,"description":"Cook the rice according to pack instructions, then leave to cool for a few minutes until just warm enough to handle."},
{"step":2,"description":"If using the meat-free chicken filling, fry the pieces with the garlic powder and ground ginger for 5–6 minutes until golden, then chop into small pieces and toss with a spoonful of the yakitori sauce.","tip":"Skip this step entirely for a simple, filling-free onigiri — they're just as good plain."},
{"step":3,"description":"Wet your hands with a little water and a pinch of salt to stop the rice sticking. Take a handful of rice and flatten it in your palm."},
{"step":4,"description":"Spoon a little of the filling into the centre, then fold the rice around it and shape into a triangle or ball, pressing gently to compact it. Repeat to make about 8 onigiri."},
{"step":5,"description":"Brush each onigiri generously with the Kikkoman yakitori sauce.","tip":"For a 'yaki' (grilled) finish, pan-fry the glazed onigiri for 1–2 minutes per side in a dry non-stick pan until lightly charred."},
{"step":6,"description":"Sprinkle with sesame seeds and wrap a strip of nori around the base of each one if using. Serve warm or pack into lunchboxes. 🍙"}
]'::jsonb),

('Greek Yoghurt & Berry Pots', '🍓', 'Layered pots of creamy Greek yoghurt, honey and mixed berries with crunchy granola — a quick no-cook treat that still feels indulgent.', 10, 0, 4, 'easy',
ARRAY['dessert','quick','healthy','sweet'],
'[
{"name":"natural Greek yoghurt","quantity":500,"unit":"g","emoji":"🥣"},
{"name":"mixed berries (strawberries, blueberries, raspberries)","quantity":200,"unit":"g","emoji":"🫐"},
{"name":"honey","quantity":2,"unit":"tbsp","emoji":"🍯"},
{"name":"granola","quantity":100,"unit":"g","emoji":"🌾"}
]'::jsonb,
'[
{"step":1,"description":"Roughly chop any larger berries, such as strawberries, into smaller pieces."},
{"step":2,"description":"In a bowl, stir the honey through the Greek yoghurt until well combined."},
{"step":3,"description":"In small glasses or pots, layer the yoghurt, berries and granola, repeating until everything is used up.","tip":"Build these just before serving so the granola stays crunchy — or layer it on top only."},
{"step":4,"description":"Finish with a final scattering of granola and a light drizzle of honey on top."},
{"step":5,"description":"Chill for 10 minutes before serving, or tuck in straight away. 🍓"}
]'::jsonb),

('Baked Cinnamon Apples', '🍎', 'Soft baked apples filled with oats, cinnamon and a touch of honey — a cosy, better-for-you dessert that smells amazing while it cooks.', 10, 25, 4, 'easy',
ARRAY['dessert','bake','healthy','sweet'],
'[
{"name":"apples (cored)","quantity":4,"unit":"","emoji":"🍎"},
{"name":"oats","quantity":60,"unit":"g","emoji":"🌾"},
{"name":"ground cinnamon","quantity":1,"unit":"tsp","emoji":"🍁"},
{"name":"honey","quantity":3,"unit":"tbsp","emoji":"🍯"},
{"name":"raisins, optional","quantity":30,"unit":"g","emoji":"🍇"},
{"name":"natural yoghurt, to serve, optional","quantity":null,"unit":"","emoji":"🥣"}
]'::jsonb,
'[
{"step":1,"description":"Preheat the oven to 180°C (160°C fan)."},
{"step":2,"description":"Core the apples, leaving the base intact to hold the filling, and place them in a small baking dish."},
{"step":3,"description":"In a bowl, mix the oats, cinnamon, raisins (if using) and half the honey."},
{"step":4,"description":"Spoon the oat mixture into the centre of each apple, pressing down gently to pack it in."},
{"step":5,"description":"Drizzle the remaining honey over the tops of the apples and add a splash of water to the bottom of the dish.","tip":"The water creates steam in the oven, which helps keep the apples soft rather than dry."},
{"step":6,"description":"Bake for 25 minutes until the apples are soft and the filling is golden."},
{"step":7,"description":"Serve warm, with a spoonful of natural yoghurt if you like. 🍎"}
]'::jsonb);
