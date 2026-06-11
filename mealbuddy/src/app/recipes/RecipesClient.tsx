"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Recipe, IngredientCategory } from "@/lib/types";
import confetti from "canvas-confetti";

interface Props {
  initialRecipes: Recipe[];
  ownedIngredientNames: string[];
  familyId: string;
  userId: string;
}

function matchScore(recipe: Recipe, owned: string[]): number {
  const needed = recipe.ingredients.map((i) => i.name.toLowerCase());
  const matches = needed.filter((n) => owned.some((o) => n.includes(o) || o.includes(n)));
  return needed.length ? matches.length / needed.length : 0;
}

// Rough emoji → shopping category mapping so auto-added items land in a sensible place
const EMOJI_TO_CATEGORY: Record<string, IngredientCategory> = {
  "🥦": "produce", "🥕": "produce", "🍅": "produce", "🧅": "produce", "🥔": "produce",
  "🍋": "produce", "🍎": "produce", "🫑": "produce", "🥒": "produce", "🌽": "produce",
  "🥬": "produce", "🍌": "produce", "🫐": "produce", "🫚": "produce",
  "🥩": "meat", "🍗": "meat", "🥓": "meat", "🐟": "meat", "🍤": "meat", "🦐": "meat", "🌱": "meat",
  "🥚": "dairy", "🥛": "dairy", "🧀": "dairy", "🧈": "dairy", "🥣": "dairy",
  "🍞": "bakery", "🥖": "bakery", "🥐": "bakery", "🫓": "bakery", "🥯": "bakery",
  "🧊": "frozen", "🍦": "frozen", "🥶": "frozen",
  "🌾": "pantry", "🍚": "pantry", "🍝": "pantry", "🥫": "pantry", "🫒": "pantry",
  "🧂": "pantry", "🌶️": "pantry", "🧄": "pantry", "🫙": "pantry", "🍜": "pantry",
  "🍯": "pantry", "🍁": "pantry", "🌿": "pantry", "🥢": "pantry",
};

function categorize(emoji: string): IngredientCategory {
  return EMOJI_TO_CATEGORY[emoji] ?? "other";
}

// Format a scaled quantity nicely — uses fraction symbols for common halves/quarters/thirds
function formatQty(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  const fracMap: [number, string][] = [
    [0.25, "¼"], [0.33, "⅓"], [0.5, "½"], [0.67, "⅔"], [0.75, "¾"],
  ];
  for (const [val, sym] of fracMap) {
    if (Math.abs(frac - val) < 0.05) {
      return whole > 0 ? `${whole}${sym}` : sym;
    }
  }
  if (frac < 0.05 || frac > 0.95) return `${Math.round(rounded)}`;
  return `${rounded}`;
}

export default function RecipesClient({ initialRecipes, ownedIngredientNames, familyId, userId }: Props) {
  const supabase = createClient();
  const [recipes] = useState<Recipe[]>(initialRecipes);
  const [filter, setFilter] = useState<"all" | "can-make">("all");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookingStep, setCookingStep] = useState<number | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [surpriseRecipe, setSurpriseRecipe] = useState<Recipe | null>(null);
  const [targetServings, setTargetServings] = useState(4);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState(false);

  function openRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setCookingStep(null);
    setTargetServings(recipe.servings || 4);
  }

  // Most common tags across the recipe library, used for the category filter row
  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of recipes) for (const t of r.tags ?? []) counts[t] = (counts[t] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [recipes]);

  const sorted = [...recipes].sort((a, b) => {
    const sa = matchScore(a, ownedIngredientNames);
    const sb = matchScore(b, ownedIngredientNames);
    return sb - sa;
  });

  const filtered = sorted
    .filter((r) => (filter === "can-make" ? matchScore(r, ownedIngredientNames) >= 0.5 : true))
    .filter((r) => (activeTag ? (r.tags ?? []).includes(activeTag) : true));

  // Ingredients from the selected recipe that aren't in the fridge/pantry yet
  const missingIngredients = useMemo(() => {
    if (!selectedRecipe) return [];
    return selectedRecipe.ingredients.filter((ing) => {
      const lower = ing.name.toLowerCase();
      return !ownedIngredientNames.some((o) => lower.includes(o) || o.includes(lower));
    });
  }, [selectedRecipe, ownedIngredientNames]);

  async function addMissingToShoppingList() {
    if (!selectedRecipe || missingIngredients.length === 0) return;
    setAddingToList(true);
    try {
      const scale = targetServings / (selectedRecipe.servings || 1);

      // Skip anything already sitting on the shopping list
      const { data: existingItems } = await supabase
        .from("shopping_items")
        .select("name")
        .eq("family_id", familyId)
        .eq("checked", false);
      const existingNames = (existingItems ?? []).map((i) => i.name.toLowerCase());

      const toAdd = missingIngredients.filter((ing) => {
        const lower = ing.name.toLowerCase();
        return !existingNames.some((n) => lower.includes(n) || n.includes(lower));
      });

      if (toAdd.length === 0) {
        toast.success("Already on your shopping list! 🛒");
        return;
      }

      const rows = toAdd.map((ing) => ({
        family_id: familyId,
        added_by: userId,
        name: ing.name,
        emoji: ing.emoji || "🛒",
        category: categorize(ing.emoji),
        quantity: ing.quantity != null ? Math.round(ing.quantity * scale * 100) / 100 : null,
        unit: ing.unit || null,
        recipe_id: selectedRecipe.id,
      }));

      const { error } = await supabase.from("shopping_items").insert(rows);
      if (error) {
        toast.error(error.message || "Couldn't update shopping list");
        return;
      }
      toast.success(`Added ${toAdd.length} item${toAdd.length > 1 ? "s" : ""} to your shopping list! 🛒`);
    } finally {
      setAddingToList(false);
    }
  }

  async function logCook(recipeId: string, recipeTitle: string, rating: number) {
    await supabase.from("cook_log").insert({
      family_id: familyId,
      user_id: userId,
      recipe_id: recipeId,
      recipe_title: recipeTitle,
      rating,
    });
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    toast.success("Amazing! Meal logged! 🎉");
    setShowRating(false);
    setCookingStep(null);
    setSelectedRecipe(null);
  }

  const steps = selectedRecipe?.steps ?? [];

  function pickSurprise() {
    const pool = filtered.length ? filtered : recipes;
    if (!pool.length) return;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    // Try to avoid showing the exact same recipe twice in a row, if there's a choice
    if (pool.length > 1 && surpriseRecipe && pick.id === surpriseRecipe.id) {
      const others = pool.filter((r) => r.id !== surpriseRecipe.id);
      pick = others[Math.floor(Math.random() * others.length)];
    }
    setSurpriseRecipe(pick);
  }

  return (
    <div className="p-5 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-display font-black">🍳 Recipes</h1>
        <p className="text-sm text-gray-500 mt-0.5">{recipes.length} recipes available</p>
      </div>

      {/* Surprise me button */}
      <button
        onClick={pickSurprise}
        className="w-full py-3.5 rounded-2xl font-display font-black text-lg text-white shadow-lg active:scale-98 transition-transform"
        style={{ background: "linear-gradient(135deg, #9333ea, #14b8a6)" }}
      >
        🎲 Surprise me!
      </button>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([["all", "🍽️ All recipes"], ["can-make", "✅ I can make"]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
              filter === v ? "bg-purple-600 text-white" : "bg-white text-gray-500 border-2 border-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category / tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          <button
            onClick={() => setActiveTag(null)}
            className={`flex-shrink-0 badge transition-all ${
              activeTag === null ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            🏷️ All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag((t) => (t === tag ? null : tag))}
              className={`flex-shrink-0 badge transition-all capitalize ${
                activeTag === tag ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Recipe cards */}
      <div className="space-y-3">
        {filtered.map((recipe) => {
          const score = matchScore(recipe, ownedIngredientNames);
          const pct = Math.round(score * 100);
          return (
            <motion.div
              key={recipe.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => openRecipe(recipe)}
              className="card p-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">{recipe.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black truncate">{recipe.title}</div>
                  <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{recipe.description}</div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">⏱ {(recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)} min</span>
                    <span className="text-xs text-gray-400">👥 {recipe.servings}</span>
                    <span className={`text-xs font-bold ${pct >= 80 ? "text-green-500" : pct >= 50 ? "text-teal-500" : "text-gray-400"}`}>
                      {pct}% ingredients ✓
                    </span>
                  </div>
                </div>
              </div>
              {/* Ingredient match bar */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f97316" : "#d1d5db",
                  }}
                />
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <div className="text-5xl mb-3">🤷</div>
            <p className="font-semibold">No matching recipes</p>
            <p className="text-sm mt-1">Try adding more ingredients or hit Surprise me!</p>
          </div>
        )}
      </div>

      {/* Surprise me reveal modal */}
      <AnimatePresence>
        {surpriseRecipe && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center"
            onClick={() => setSurpriseRecipe(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4 mb-6 sm:mb-0 shadow-2xl text-center"
            >
              <p className="text-sm font-bold text-purple-500 mb-1">🎲 Tonight's pick is...</p>
              <div className="text-6xl mb-2">{surpriseRecipe.emoji}</div>
              <h2 className="text-2xl font-display font-black">{surpriseRecipe.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{surpriseRecipe.description}</p>
              <div className="flex justify-center gap-3 mt-3 text-xs text-gray-400">
                <span>⏱ {(surpriseRecipe.prep_time_mins ?? 0) + (surpriseRecipe.cook_time_mins ?? 0)} min</span>
                <span>👥 {surpriseRecipe.servings} servings</span>
                <span>🔥 {surpriseRecipe.difficulty}</span>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  onClick={() => {
                    openRecipe(surpriseRecipe);
                    setSurpriseRecipe(null);
                  }}
                  className="btn-primary w-full text-lg py-3.5"
                >
                  👨‍🍳 Let's cook this!
                </button>
                <button
                  onClick={pickSurprise}
                  className="w-full py-3 rounded-2xl font-bold text-purple-600 bg-purple-50"
                >
                  🎲 Try another
                </button>
                <button
                  onClick={() => setSurpriseRecipe(null)}
                  className="w-full py-2 text-sm text-gray-400 underline"
                >
                  📖 Browse all recipes instead
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe detail sheet */}
      <AnimatePresence>
        {selectedRecipe && cookingStep === null && !showRating && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedRecipe(null)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white pt-4 px-5 pb-3 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                <div className="flex items-start gap-3">
                  <div className="text-5xl">{selectedRecipe.emoji}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-display font-black">{selectedRecipe.title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedRecipe.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>⏱ {(selectedRecipe.prep_time_mins ?? 0) + (selectedRecipe.cook_time_mins ?? 0)} min</span>
                      <span>🔥 {selectedRecipe.difficulty}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Servings adjuster */}
                <div className="flex items-center justify-between bg-purple-50 rounded-2xl p-3">
                  <span className="font-bold text-sm">👥 Servings</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTargetServings((s) => Math.max(1, s - 1))}
                      className="w-9 h-9 rounded-full bg-white shadow-sm font-display font-black text-purple-600 text-lg active:scale-90 transition-transform"
                      aria-label="Fewer servings"
                    >
                      −
                    </button>
                    <span className="font-display font-black text-lg w-6 text-center">{targetServings}</span>
                    <button
                      onClick={() => setTargetServings((s) => Math.min(12, s + 1))}
                      className="w-9 h-9 rounded-full bg-white shadow-sm font-display font-black text-purple-600 text-lg active:scale-90 transition-transform"
                      aria-label="More servings"
                    >
                      +
                    </button>
                  </div>
                </div>
                {targetServings !== selectedRecipe.servings && (
                  <p className="text-xs text-gray-400 -mt-3">
                    Quantities below are scaled from the original {selectedRecipe.servings} servings 🔢
                  </p>
                )}

                {/* Ingredients */}
                <div>
                  <h3 className="font-display font-black text-lg mb-3">Ingredients</h3>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ing, i) => {
                      const have = ownedIngredientNames.some(
                        (o) => ing.name.toLowerCase().includes(o) || o.includes(ing.name.toLowerCase())
                      );
                      const scale = targetServings / (selectedRecipe.servings || 1);
                      const scaledQty = ing.quantity != null ? formatQty(ing.quantity * scale) : null;
                      return (
                        <div key={i} className={`flex items-center gap-3 p-2 rounded-xl ${have ? "bg-green-50" : "bg-gray-50"}`}>
                          <span className="text-xl">{ing.emoji}</span>
                          <span className="flex-1 font-medium">{ing.name}</span>
                          <span className="text-sm text-gray-500">{scaledQty} {ing.unit}</span>
                          {have && <span className="text-green-500 text-sm">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add missing ingredients to shopping list */}
                {missingIngredients.length > 0 && (
                  <button
                    onClick={addMissingToShoppingList}
                    disabled={addingToList}
                    className="w-full py-3 rounded-2xl font-bold text-purple-600 bg-purple-50 disabled:opacity-60 transition-colors"
                  >
                    {addingToList
                      ? "Adding…"
                      : `🛒 Add ${missingIngredients.length} missing item${missingIngredients.length > 1 ? "s" : ""} to shopping list`}
                  </button>
                )}

                {/* Start cooking button */}
                <button
                  onClick={() => setCookingStep(0)}
                  className="btn-primary w-full text-lg py-4"
                >
                  👨‍🍳 Start cooking!
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Step-by-step cooking mode */}
      <AnimatePresence>
        {selectedRecipe && cookingStep !== null && !showRating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-purple-600 z-50 flex flex-col p-6"
          >
            {/* Progress bar */}
            <div className="h-1.5 bg-teal-500 rounded-full mb-6">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${((cookingStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => { setCookingStep(null); }}
                className="text-purple-200 font-bold"
              >
                ← Back
              </button>
              <span className="text-white font-bold opacity-80">
                Step {cookingStep + 1} of {steps.length}
              </span>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="text-6xl mb-4 text-center">{selectedRecipe.emoji}</div>
              <motion.div
                key={cookingStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1"
              >
                <div className="bg-white/20 rounded-2xl p-5 mb-4">
                  <p className="text-white text-xl font-bold leading-relaxed">
                    {steps[cookingStep]?.description}
                  </p>
                </div>
                {steps[cookingStep]?.tip && (
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-purple-100 text-sm">
                      💡 <strong>Tip:</strong> {steps[cookingStep].tip}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="mt-6">
              {cookingStep < steps.length - 1 ? (
                <button
                  onClick={() => setCookingStep((s) => (s ?? 0) + 1)}
                  className="bg-white text-purple-600 font-display font-black text-xl w-full py-4 rounded-2xl shadow-lg"
                >
                  Next step →
                </button>
              ) : (
                <button
                  onClick={() => setShowRating(true)}
                  className="bg-white text-purple-600 font-display font-black text-xl w-full py-4 rounded-2xl shadow-lg"
                >
                  🎉 I cooked it!
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating modal */}
      <AnimatePresence>
        {showRating && selectedRecipe && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
              <div className="text-6xl mb-3">🥘</div>
              <h2 className="text-2xl font-display font-black mb-1">You cooked it!</h2>
              <p className="text-gray-500 text-sm mb-5">How did it turn out?</p>
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => logCook(selectedRecipe.id, selectedRecipe.title, r)}
                    className="text-4xl transition-transform hover:scale-125 active:scale-110"
                  >
                    {r <= 2 ? "😕" : r === 3 ? "😐" : r === 4 ? "😋" : "🤩"}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowRating(false)} className="text-sm text-gray-400 underline">
                Skip rating
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
