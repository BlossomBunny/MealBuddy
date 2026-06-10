"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Recipe, RecipeStep } from "@/lib/types";
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

export default function RecipesClient({ initialRecipes, ownedIngredientNames, familyId, userId }: Props) {
  const supabase = createClient();
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [filter, setFilter] = useState<"all" | "can-make">("all");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookingStep, setCookingStep] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const sorted = [...recipes].sort((a, b) => {
    const sa = matchScore(a, ownedIngredientNames);
    const sb = matchScore(b, ownedIngredientNames);
    return sb - sa;
  });

  const filtered = filter === "can-make"
    ? sorted.filter((r) => matchScore(r, ownedIngredientNames) >= 0.5)
    : sorted;

  async function surpriseMe() {
    if (ownedIngredientNames.length === 0) {
      toast.error("Add some ingredients first! 🥦");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ownedIngredientNames }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const recipe = data.recipe as Recipe;
      // Save to DB for the family
      const { data: saved, error } = await supabase
        .from("recipes")
        .insert({ ...recipe, family_id: familyId })
        .select()
        .single();

      if (error) throw error;
      setRecipes((prev) => [saved, ...prev]);
      setSelectedRecipe(saved);
      toast.success("✨ AI recipe created!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate recipe");
    } finally {
      setAiLoading(false);
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

  return (
    <div className="p-5 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-display font-black">🍳 Recipes</h1>
        <p className="text-sm text-gray-500 mt-0.5">{recipes.length} recipes available</p>
      </div>

      {/* Surprise Me button */}
      <motion.button
        onClick={surpriseMe}
        disabled={aiLoading}
        whileTap={{ scale: 0.97 }}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-display font-black text-lg py-4 rounded-2xl shadow-md flex items-center justify-center gap-2"
      >
        {aiLoading ? (
          <>
            <span className="animate-spin">🌀</span> Cooking up something amazing…
          </>
        ) : (
          <>✨ Surprise me with AI!</>
        )}
      </motion.button>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([["all", "🍽️ All recipes"], ["can-make", "✅ I can make"]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
              filter === v ? "bg-orange-500 text-white" : "bg-white text-gray-500 border-2 border-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Recipe cards */}
      <div className="space-y-3">
        {filtered.map((recipe) => {
          const score = matchScore(recipe, ownedIngredientNames);
          const pct = Math.round(score * 100);
          return (
            <motion.div
              key={recipe.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelectedRecipe(recipe); setCookingStep(null); }}
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
                    <span className={`text-xs font-bold ${pct >= 80 ? "text-green-500" : pct >= 50 ? "text-orange-400" : "text-gray-400"}`}>
                      {pct}% ingredients ✓
                    </span>
                    {recipe.is_ai_generated && (
                      <span className="badge bg-purple-100 text-purple-600 text-xs">✨ AI</span>
                    )}
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
            <p className="text-sm mt-1">Try adding more ingredients or hit Surprise Me!</p>
          </div>
        )}
      </div>

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
                      <span>👥 {selectedRecipe.servings} servings</span>
                      <span>🔥 {selectedRecipe.difficulty}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Ingredients */}
                <div>
                  <h3 className="font-display font-black text-lg mb-3">Ingredients</h3>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ing, i) => {
                      const have = ownedIngredientNames.some(
                        (o) => ing.name.toLowerCase().includes(o) || o.includes(ing.name.toLowerCase())
                      );
                      return (
                        <div key={i} className={`flex items-center gap-3 p-2 rounded-xl ${have ? "bg-green-50" : "bg-gray-50"}`}>
                          <span className="text-xl">{ing.emoji}</span>
                          <span className="flex-1 font-medium">{ing.name}</span>
                          <span className="text-sm text-gray-500">{ing.quantity} {ing.unit}</span>
                          {have && <span className="text-green-500 text-sm">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

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
            className="fixed inset-0 bg-orange-500 z-50 flex flex-col p-6"
          >
            {/* Progress bar */}
            <div className="h-1.5 bg-orange-400 rounded-full mb-6">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${((cookingStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => { setCookingStep(null); }}
                className="text-orange-200 font-bold"
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
                    <p className="text-orange-100 text-sm">
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
                  className="bg-white text-orange-500 font-display font-black text-xl w-full py-4 rounded-2xl shadow-lg"
                >
                  Next step →
                </button>
              ) : (
                <button
                  onClick={() => setShowRating(true)}
                  className="bg-white text-orange-500 font-display font-black text-xl w-full py-4 rounded-2xl shadow-lg"
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
