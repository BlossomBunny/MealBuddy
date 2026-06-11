-- ============================================================
-- Meal Buddy — Recipe Library Expansion #3
-- Run this in your Supabase SQL Editor (after recipe-library-seed-2.sql)
-- Adds 5 more built-in recipes (family_id = null, visible to everyone)
-- Jacket potato variations (spicy chicken, chicken katsu curry) and
-- pasta variations (chicken & broccoli, chicken/tomato/basil, Mexican chicken).
-- Same dietary rules as before: plant-based meats/butter, passata,
-- garlic/ginger powder, no onions, no vinegar, cheddar or mozzarella
-- only, no seafood/lamb/venison, and no olives or pickles/gherkins.
-- ============================================================

insert into recipes (title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags, ingredients, steps) values

('Spicy Chicken Jacket Potatoes', '🌶️', 'Fluffy baked potatoes loaded with smoky, spicy chicken and melted cheddar.', 15, 60, 4, 'easy',
ARRAY['british','chicken','spicy','comfort-food','jacket-potato'],
'[
{"name":"baking potatoes","quantity":4,"unit":"large","emoji":"🥔"},
{"name":"chicken breast (diced)","quantity":500,"unit":"g","emoji":"🍗"},
{"name":"passata","quantity":200,"unit":"ml","emoji":"🫙"},
{"name":"smoked paprika","quantity":1.5,"unit":"tsp","emoji":"🌶️"},
{"name":"chilli powder","quantity":1,"unit":"tsp","emoji":"🌶️"},
{"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
{"name":"cumin","quantity":0.5,"unit":"tsp","emoji":"🌿"},
{"name":"cheddar","quantity":100,"unit":"g, grated","emoji":"🧀"},
{"name":"vegetable oil","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"}
]'::jsonb,
'[
{"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Prick the potatoes a few times with a fork and place directly on the oven shelf. Bake for 60 minutes until the skins are crisp and the centres are soft.","tip":"No time to wait? Microwave the potatoes for 5 minutes first, then finish in the oven for 25–30 minutes for crispy skins."},
{"step":2,"description":"About 20 minutes before the potatoes are ready, heat the oil in a frying pan over medium-high heat. Add the diced chicken and cook for 6–7 minutes until golden and cooked through."},
{"step":3,"description":"Stir in the smoked paprika, chilli powder, cumin, and garlic powder and cook for 30 seconds until fragrant.","tip":"Adjust the chilli powder up or down here depending on how spicy you like it."},
{"step":4,"description":"Pour in the passata, season with salt and pepper, and simmer for 8–10 minutes until thickened into a rich, spicy sauce."},
{"step":5,"description":"Slice the potatoes open lengthways and fluff up the insides with a fork."},
{"step":6,"description":"Spoon the spicy chicken over each potato and top generously with grated cheddar. Serve hot. 🌶️"}
]'::jsonb),

('Chicken Katsu Curry Jacket Potatoes', '🍛', 'Crispy breaded chicken and a fragrant curry sauce piled onto a fluffy jacket potato.', 20, 60, 4, 'medium',
ARRAY['british','japanese','chicken','comfort-food','jacket-potato'],
'[
{"name":"baking potatoes","quantity":4,"unit":"large","emoji":"🥔"},
{"name":"chicken breast","quantity":4,"unit":"small","emoji":"🍗"},
{"name":"breadcrumbs","quantity":100,"unit":"g","emoji":"🍞"},
{"name":"egg (beaten)","quantity":1,"unit":"large","emoji":"🥚"},
{"name":"flour","quantity":3,"unit":"tbsp","emoji":"🌾"},
{"name":"mild curry powder","quantity":2,"unit":"tbsp","emoji":"🍛"},
{"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
{"name":"ground ginger","quantity":1,"unit":"tsp","emoji":"🫚"},
{"name":"carrots (diced small)","quantity":2,"unit":"","emoji":"🥕"},
{"name":"vegetable stock","quantity":400,"unit":"ml","emoji":"🫙"},
{"name":"honey","quantity":1,"unit":"tsp","emoji":"🍯"},
{"name":"soy sauce","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"vegetable oil","quantity":3,"unit":"tbsp","emoji":"🫙"}
]'::jsonb,
'[
{"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Prick the potatoes a few times with a fork and place directly on the oven shelf. Bake for 60 minutes until the skins are crisp and the centres are soft.","tip":"No time to wait? Microwave the potatoes for 5 minutes first, then finish in the oven for 25–30 minutes for crispy skins."},
{"step":2,"description":"Meanwhile, make the curry sauce: heat 1 tbsp oil in a saucepan over medium heat and cook the diced carrot for 4–5 minutes until starting to soften."},
{"step":3,"description":"Stir in the curry powder, garlic powder, ginger, and 1 tbsp of the flour, and cook for 1 minute until fragrant."},
{"step":4,"description":"Gradually whisk in the vegetable stock, then add the honey and soy sauce. Simmer for 12–15 minutes, stirring occasionally, until thickened and the carrots are tender.","tip":"For an extra-smooth sauce, blitz it with a stick blender once the carrots are soft."},
{"step":5,"description":"While the sauce simmers, set up three shallow bowls: the remaining flour in one, the beaten egg in another, and the breadcrumbs in the third. Coat each chicken breast in flour, then egg, then breadcrumbs, pressing gently so the crumbs stick.","tip":"Pressing the crumbs on firmly gives you an extra-crunchy coating that won't fall off."},
{"step":6,"description":"Heat the remaining oil in a large frying pan over medium heat. Fry the chicken for 6–7 minutes per side until golden, crisp, and cooked through."},
{"step":7,"description":"Slice the potatoes open lengthways and fluff up the insides with a fork. Slice the crispy chicken and pile onto the potatoes, then spoon over the curry sauce. Serve hot. 🍛"}
]'::jsonb),

('Creamy Chicken & Broccoli Pasta', '🥦', 'A comforting, creamy pasta packed with tender chicken and broccoli.', 10, 20, 4, 'easy',
ARRAY['pasta','chicken','comfort-food','quick'],
'[
{"name":"pasta (penne or fusilli)","quantity":350,"unit":"g","emoji":"🍝"},
{"name":"chicken breast (diced)","quantity":400,"unit":"g","emoji":"🍗"},
{"name":"broccoli (cut into small florets)","quantity":300,"unit":"g","emoji":"🥦"},
{"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
{"name":"plant-based butter","quantity":1,"unit":"tbsp","emoji":"🧈"},
{"name":"cream cheese","quantity":150,"unit":"g","emoji":"🧀"},
{"name":"milk","quantity":150,"unit":"ml","emoji":"🥛"},
{"name":"cheddar","quantity":50,"unit":"g, grated","emoji":"🧀"},
{"name":"olive oil","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"}
]'::jsonb,
'[
{"step":1,"description":"Bring a large pan of salted water to the boil and cook the pasta according to pack instructions, adding the broccoli florets for the final 3–4 minutes. Drain together, reserving a mug of the cooking water."},
{"step":2,"description":"Meanwhile, heat the olive oil in a large frying pan over medium-high heat. Add the diced chicken and cook for 6–7 minutes until golden and cooked through."},
{"step":3,"description":"Reduce the heat to medium, melt the plant-based butter in with the chicken, and stir in the garlic powder for 30 seconds until fragrant."},
{"step":4,"description":"Add the cream cheese and milk, stirring until melted into a smooth sauce. Season with salt and pepper.","tip":"If the sauce looks thick, splash in some of the reserved pasta water until glossy."},
{"step":5,"description":"Toss the drained pasta and broccoli through the sauce until well coated. Serve topped with grated cheddar. 🥦"}
]'::jsonb),

('Chicken, Tomato & Basil Pasta', '🍅', 'Juicy chicken in a fresh tomato and basil sauce — simple, vibrant, and full of flavour.', 10, 20, 4, 'easy',
ARRAY['pasta','italian','chicken','quick'],
'[
{"name":"pasta (penne or fusilli)","quantity":350,"unit":"g","emoji":"🍝"},
{"name":"chicken breast (diced)","quantity":400,"unit":"g","emoji":"🍗"},
{"name":"passata","quantity":400,"unit":"ml","emoji":"🫙"},
{"name":"cherry tomatoes (halved)","quantity":150,"unit":"g","emoji":"🍅"},
{"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
{"name":"dried basil","quantity":1.5,"unit":"tsp","emoji":"🌿"},
{"name":"olive oil","quantity":1,"unit":"tbsp","emoji":"🫙"},
{"name":"mozzarella","quantity":100,"unit":"g, torn","emoji":"🧀"},
{"name":"salt & pepper","quantity":null,"unit":"to taste","emoji":"🧂"}
]'::jsonb,
'[
{"step":1,"description":"Cook the pasta in a large pan of well-salted boiling water according to pack instructions. Drain."},
{"step":2,"description":"Meanwhile, heat the olive oil in a large frying pan over medium-high heat. Add the diced chicken and cook for 6–7 minutes until golden and cooked through."},
{"step":3,"description":"Stir in the garlic powder and dried basil and cook for 30 seconds until fragrant."},
{"step":4,"description":"Add the passata and cherry tomatoes, season with salt and pepper, and simmer for 8–10 minutes until the tomatoes soften and the sauce thickens.","tip":"Squash a few of the cherry tomatoes with the back of a spoon for an extra juicy sauce."},
{"step":5,"description":"Toss the drained pasta through the sauce until well coated. Serve topped with torn mozzarella. 🍅"}
]'::jsonb),

('Mexican Chicken Pasta Bake', '🌽', 'A zesty, cheesy pasta bake with smoky Mexican-spiced chicken, peppers and sweetcorn.', 10, 25, 4, 'medium',
ARRAY['pasta','mexican','chicken','bake'],
'[
{"name":"pasta (penne)","quantity":350,"unit":"g","emoji":"🍝"},
{"name":"chicken breast (diced)","quantity":400,"unit":"g","emoji":"🍗"},
{"name":"bell peppers (sliced)","quantity":1,"unit":"","emoji":"🫑"},
{"name":"sweetcorn","quantity":150,"unit":"g","emoji":"🌽"},
{"name":"passata","quantity":400,"unit":"ml","emoji":"🫙"},
{"name":"smoked paprika","quantity":1,"unit":"tsp","emoji":"🌶️"},
{"name":"cumin","quantity":1,"unit":"tsp","emoji":"🌿"},
{"name":"garlic powder","quantity":1,"unit":"tsp","emoji":"🧄"},
{"name":"cheddar","quantity":150,"unit":"g, grated","emoji":"🧀"},
{"name":"olive oil","quantity":1,"unit":"tbsp","emoji":"🫙"}
]'::jsonb,
'[
{"step":1,"description":"Preheat the oven to 200°C (fan 180°C). Cook the pasta in well-salted boiling water for 2 minutes less than the pack instructions, then drain.","tip":"Slightly undercooking the pasta now means it won''t go mushy after baking."},
{"step":2,"description":"Meanwhile, heat the olive oil in a large oven-proof pan or skillet over medium-high heat. Add the diced chicken and cook for 6–7 minutes until golden and cooked through."},
{"step":3,"description":"Add the sliced peppers and cook for 3–4 minutes until starting to soften."},
{"step":4,"description":"Stir in the smoked paprika, cumin, and garlic powder and cook for 30 seconds until fragrant."},
{"step":5,"description":"Add the passata and sweetcorn and simmer for 5 minutes until slightly thickened."},
{"step":6,"description":"Add the drained pasta to the sauce and toss to coat. Top with the grated cheddar.","tip":"No oven-proof pan? Just transfer everything to a baking dish before this step."},
{"step":7,"description":"Bake for 12–15 minutes until the cheese is golden and bubbling. Serve hot. 🌽"}
]'::jsonb);
