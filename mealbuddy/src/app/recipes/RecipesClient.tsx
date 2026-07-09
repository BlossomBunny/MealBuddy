"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Recipe, RecipeIngredient, IngredientCategory } from "@/lib/types";
import { UNITS, isStaple, cleanIngredientName } from "@/lib/types";
import confetti from "canvas-confetti";

// Slim shape of a pantry ingredient, used to deduct stock after cooking
interface PantryItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  secondary_quantity: number | null;
  secondary_unit: string | null;
}

interface RecipePref {
  recipe_id: string;
  favourited: boolean;
  hidden: boolean;
  excluded_ingredients: string[];
}

interface Props {
  initialRecipes: Recipe[];
  ownedIngredientNames: string[];
  ownedIngredients: PantryItem[];
  familyId: string;
  userId: string;
  familySize: number;
  initialPrefs: RecipePref[];
}

function isOwned(name: string, owned: string[]): boolean {
  const lower = name.toLowerCase();
  if (lower.includes("water")) return true;
  return owned.some((o) => lower.includes(o) || o.includes(lower));
}

function unitsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const norm = (u: string) => u.trim().toLowerCase().replace(/s$/, "");
  return norm(a) === norm(b);
}

function findPantryMatch(name: string, pantry: PantryItem[]): PantryItem | null {
  const lower = name.toLowerCase();
  return (
    pantry.find((p) => {
      const pLower = p.name.toLowerCase();
      return lower.includes(pLower) || pLower.includes(lower);
    }) ?? null
  );
}

interface MatchInfo {
  total: number;
  have: number;
  pct: number;
  canMake: boolean;
}

function getMatch(recipe: Recipe, owned: string[], excludedIngredients: string[] = []): MatchInfo {
  const active = recipe.ingredients.filter(
    (i) => !excludedIngredients.some((ex) => i.name.toLowerCase().includes(ex.toLowerCase()))
  );
  const total = active.length;
  const have = active.filter((i) => isOwned(i.name, owned)).length;
  const pct = total ? Math.round((have / total) * 100) : 100;
  return { total, have, pct, canMake: total > 0 && have === total };
}

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
  "🍇": "produce",
};

function categorize(emoji: string): IngredientCategory {
  return EMOJI_TO_CATEGORY[emoji] ?? "other";
}

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

const MAIN_CATEGORIES = [
  "italian", "mexican", "japanese", "asian", "british",
  "rice", "pasta", "noodles", "salad", "breakfast", "vegetarian",
  // Note: "dessert" is intentionally excluded here — handled by viewMode tab
];

export default function RecipesClient({
  initialRecipes,
  ownedIngredientNames,
  ownedIngredients,
  familyId,
  userId,
  familySize,
  initialPrefs,
}: Props) {
  const supabase = createClient();
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [pantry, setPantry] = useState<PantryItem[]>(ownedIngredients);

  // Per-family preferences: favourite, hidden, excluded ingredients
  const [prefs, setPrefs] = useState<Record<string, { favourited: boolean; hidden: boolean; excluded_ingredients: string[] }>>(
    () => Object.fromEntries(initialPrefs.map((p) => [p.recipe_id, { favourited: p.favourited, hidden: p.hidden, excluded_ingredients: p.excluded_ingredients }]))
  );

  const [viewMode, setViewMode] = useState<"meals" | "desserts">("meals");
  const [filter, setFilter] = useState<"all" | "can-make" | "by-ingredients">("all");
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookingStep, setCookingStep] = useState<number | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [showPantryUpdate, setShowPantryUpdate] = useState(false);
  const [usedAmounts, setUsedAmounts] = useState<Record<number, string>>({});
  const [updatingPantry, setUpdatingPantry] = useState(false);
  const [editingIngredients, setEditingIngredients] = useState<RecipeIngredient[] | null>(null);
  const [savingIngredients, setSavingIngredients] = useState(false);
  const [surpriseRecipe, setSurpriseRecipe] = useState<Recipe | null>(null);
  const [targetServings, setTargetServings] = useState(familySize);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState(false);
  const [togglingPref, setTogglingPref] = useState<string | null>(null);

  function openRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setCookingStep(null);
    setTargetServings(familySize);
  }

  // ── Pref helpers ─────────────────────────────────────────────
  function getPref(recipeId: string) {
    return prefs[recipeId] ?? { favourited: false, hidden: false, excluded_ingredients: [] };
  }

  async function upsertPref(recipeId: string, patch: Partial<{ favourited: boolean; hidden: boolean; excluded_ingredients: string[] }>) {
    const current = getPref(recipeId);
    const next = { ...current, ...patch };
    setPrefs((prev) => ({ ...prev, [recipeId]: next }));
    const { error } = await supabase
      .from("family_recipe_prefs")
      .upsert(
        { family_id: familyId, recipe_id: recipeId, ...next },
        { onConflict: "family_id,recipe_id" }
      );
    if (error) {
      // Revert on failure
      setPrefs((prev) => ({ ...prev, [recipeId]: current }));
      toast.error("Couldn't save preference");
    }
  }

  async function toggleFavourite(e: React.MouseEvent, recipeId: string) {
    e.stopPropagation();
    const current = getPref(recipeId);
    setTogglingPref(recipeId + "-fav");
    await upsertPref(recipeId, { favourited: !current.favourited });
    setTogglingPref(null);
  }

  async function toggleHidden(e: React.MouseEvent, recipeId: string) {
    e.stopPropagation();
    const current = getPref(recipeId);
    const isHiding = !current.hidden;
    setTogglingPref(recipeId + "-hide");
    await upsertPref(recipeId, { hidden: isHiding });
    setTogglingPref(null);
    if (isHiding) toast("Recipe hidden 🙈", { icon: "🙈" });
    else toast("Recipe restored ✅");
  }

  async function toggleExcludeIngredient(recipeId: string, ingredientName: string) {
    const current = getPref(recipeId);
    const lower = ingredientName.toLowerCase();
    const alreadyExcluded = current.excluded_ingredients.includes(lower);
    const next = alreadyExcluded
      ? current.excluded_ingredients.filter((x) => x !== lower)
      : [...current.excluded_ingredients, lower];
    await upsertPref(recipeId, { excluded_ingredients: next });
    if (alreadyExcluded) toast.success(`${ingredientName} restored`);
    else toast(`${ingredientName} removed for your family 🚫`);
  }

  // ── Filtering & sorting ──────────────────────────────────────
  const allTags = useMemo(() => {
    const present = new Set<string>();
    for (const r of recipes) for (const t of r.tags ?? []) present.add(t);
    return MAIN_CATEGORIES.filter((tag) => present.has(tag));
  }, [recipes]);

  const isDessert = (r: Recipe) => (r.tags ?? []).includes("dessert");

  const sorted = useMemo(() => {
    return [...recipes].sort((a, b) => {
      // Favourites first
      const aFav = getPref(a.id).favourited ? 1 : 0;
      const bFav = getPref(b.id).favourited ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;
      // Then by ingredient match %
      const ma = getMatch(a, ownedIngredientNames, getPref(a.id).excluded_ingredients);
      const mb = getMatch(b, ownedIngredientNames, getPref(b.id).excluded_ingredients);
      return mb.pct - ma.pct;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, prefs, ownedIngredientNames]);

  const filtered = sorted
    .filter((r) => !getPref(r.id).hidden)
    .filter((r) => viewMode === "desserts" ? isDessert(r) : !isDessert(r))
    .filter((r) => filter === "can-make" ? getMatch(r, ownedIngredientNames, getPref(r.id).excluded_ingredients).canMake : true)
    .filter((r) => {
      if (filter !== "by-ingredients" || selectedIngredients.size === 0) return true;
      const ingNames = r.ingredients.map((i) => i.name.toLowerCase());
      // Show recipe if it uses at least one of the selected ingredients
      return Array.from(selectedIngredients).some((sel) =>
        ingNames.some((n) => n.includes(sel) || sel.includes(n))
      );
    })
    .filter((r) => activeTag ? (r.tags ?? []).includes(activeTag) : true);

  // Surprise Me: only non-hidden, non-dessert meals (meals pool)
  const surprisePool = sorted.filter((r) => !getPref(r.id).hidden && !isDessert(r));

  // ── Missing ingredients (respects family exclusions) ─────────
  const excludedForSelected = selectedRecipe ? getPref(selectedRecipe.id).excluded_ingredients : [];
  const missingIngredients = useMemo(() => {
    if (!selectedRecipe) return [];
    return selectedRecipe.ingredients.filter(
      (ing) =>
        !isOwned(ing.name, ownedIngredientNames) &&
        !excludedForSelected.some((ex) => ing.name.toLowerCase().includes(ex))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipe, ownedIngredientNames, excludedForSelected]);

  async function addMissingToShoppingList() {
    if (!selectedRecipe || missingIngredients.length === 0) return;
    setAddingToList(true);
    try {
      const scale = targetServings / (selectedRecipe.servings || 1);
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
      if (toAdd.length === 0) { toast.success("Already on your shopping list! 🛒"); return; }
      const rows = toAdd.map((ing) => ({
        family_id: familyId,
        added_by: userId,
        name: cleanIngredientName(ing.name),
        emoji: ing.emoji || "🛒",
        category: categorize(ing.emoji),
        // Staples (salt, oil, spices…) — no quantity, just flag as needed
        quantity: isStaple(ing.name) ? null : (ing.quantity != null ? Math.round(ing.quantity * scale * 100) / 100 : null),
        unit: isStaple(ing.name) ? null : (ing.unit || null),
        recipe_id: selectedRecipe.id,
      }));
      const { error } = await supabase.from("shopping_items").insert(rows);
      if (error) { toast.error(error.message || "Couldn't update shopping list"); return; }
      toast.success(`Added ${toAdd.length} item${toAdd.length > 1 ? "s" : ""} to your shopping list! 🛒`);
    } finally {
      setAddingToList(false);
    }
  }

  async function logCook(recipeId: string, recipeTitle: string, rating: number) {
    await supabase.from("cook_log").insert({ family_id: familyId, user_id: userId, recipe_id: recipeId, recipe_title: recipeTitle, rating });
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    toast.success("Amazing! Meal logged! 🎉");
    setShowRating(false);
    setCookingStep(null);
    setSelectedRecipe(null);
  }

  const pantryUpdateIngredients = useMemo(() => {
    if (!selectedRecipe) return [];
    return selectedRecipe.ingredients.filter((ing) => !ing.name.toLowerCase().includes("water"));
  }, [selectedRecipe]);

  function openPantryUpdate() {
    const scale = targetServings / (selectedRecipe?.servings || 1);
    const initial: Record<number, string> = {};
    pantryUpdateIngredients.forEach((ing, i) => {
      initial[i] = ing.quantity != null ? String(Math.round(ing.quantity * scale * 100) / 100) : "";
    });
    setUsedAmounts(initial);
    setShowPantryUpdate(true);
  }

  async function applyPantryDeductions() {
    setUpdatingPantry(true);
    try {
      const updates: { id: string; quantity?: number; secondary_quantity?: number }[] = [];
      pantryUpdateIngredients.forEach((ing, i) => {
        const amt = parseFloat(usedAmounts[i]);
        if (!amt || amt <= 0) return;
        const match = findPantryMatch(cleanIngredientName(ing.name), pantry);
        if (!match) return;
        const unit = ing.unit || "";
        if (unitsMatch(match.unit, unit)) {
          updates.push({ id: match.id, quantity: Math.max(0, (match.quantity ?? 0) - amt) });
        } else if (unitsMatch(match.secondary_unit, unit)) {
          updates.push({ id: match.id, secondary_quantity: Math.max(0, (match.secondary_quantity ?? 0) - amt) });
        }
      });
      for (const u of updates) {
        const patch: Record<string, number> = {};
        if (u.quantity !== undefined) patch.quantity = u.quantity;
        if (u.secondary_quantity !== undefined) patch.secondary_quantity = u.secondary_quantity;
        await supabase.from("ingredients").update(patch).eq("id", u.id);
      }
      if (updates.length > 0) {
        setPantry((prev) => prev.map((p) => {
          const u = updates.find((x) => x.id === p.id);
          if (!u) return p;
          return { ...p, quantity: u.quantity !== undefined ? u.quantity : p.quantity, secondary_quantity: u.secondary_quantity !== undefined ? u.secondary_quantity : p.secondary_quantity };
        }));
        toast.success("Pantry updated! 📦");
      }
    } finally {
      setUpdatingPantry(false);
      setShowPantryUpdate(false);
      setShowRating(true);
    }
  }

  function skipPantryUpdate() {
    setShowPantryUpdate(false);
    setShowRating(true);
  }

  // ── Recipe ingredient editing (global) ───────────────────────
  function openIngredientEditor() {
    if (!selectedRecipe) return;
    setEditingIngredients(selectedRecipe.ingredients.map((ing) => ({ ...ing })));
  }

  function updateEditingIngredient(i: number, patch: Partial<RecipeIngredient>) {
    setEditingIngredients((prev) => (prev ? prev.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)) : prev));
  }

  function removeEditingIngredient(i: number) {
    setEditingIngredients((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));
  }

  function addEditingIngredient() {
    setEditingIngredients((prev) => (prev ? [...prev, { name: "", quantity: null, unit: "", emoji: "🛒" }] : prev));
  }

  async function saveIngredientEdits() {
    if (!selectedRecipe || !editingIngredients) return;
    setSavingIngredients(true);
    try {
      const cleaned = editingIngredients
        .map((ing) => ({ ...ing, name: ing.name.trim() }))
        .filter((ing) => ing.name.length > 0);
      const { error } = await supabase.from("recipes").update({ ingredients: cleaned }).eq("id", selectedRecipe.id);
      if (error) { toast.error(error.message || "Couldn't save changes"); return; }
      setRecipes((prev) => prev.map((r) => (r.id === selectedRecipe.id ? { ...r, ingredients: cleaned } : r)));
      setSelectedRecipe((prev) => (prev ? { ...prev, ingredients: cleaned } : prev));
      setEditingIngredients(null);
      toast.success("Recipe updated! ✏️");
    } finally {
      setSavingIngredients(false);
    }
  }

  const steps = selectedRecipe?.steps ?? [];

  function pickSurprise() {
    const pool = surprisePool.length ? surprisePool : recipes.filter((r) => !isDessert(r));
    if (!pool.length) return;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && surpriseRecipe && pick.id === surpriseRecipe.id) {
      const others = pool.filter((r) => r.id !== surpriseRecipe.id);
      pick = others[Math.floor(Math.random() * others.length)];
    }
    setSurpriseRecipe(pick);
  }

  const hiddenCount = Object.values(prefs).filter((p) => p.hidden).length;

  return (
    <div className="p-5 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-display font-black">🍳 Recipes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {recipes.length} recipes{hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ""}
        </p>
      </div>

      {/* Meals / Desserts tab */}
      <div className="flex gap-2">
        {([["meals", "🍽️ Meals"], ["desserts", "🍰 Desserts"]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => { setViewMode(v); setActiveTag(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              viewMode === v
                ? "text-white shadow-sm"
                : "bg-white text-gray-500 border-2 border-gray-100"
            }`}
            style={viewMode === v ? { background: v === "desserts" ? "linear-gradient(135deg,#f43f5e,#f97316)" : "linear-gradient(135deg,#9333ea,#14b8a6)" } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Surprise me — only shown in meals view */}
      {viewMode === "meals" && (
        <button
          onClick={pickSurprise}
          className="w-full py-3.5 rounded-2xl font-display font-black text-lg text-white shadow-lg active:scale-98 transition-transform"
          style={{ background: "linear-gradient(135deg, #9333ea, #14b8a6)" }}
        >
          🎲 Surprise me!
        </button>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([["all", "🍽️ All"], ["can-make", "✅ I can make"], ["by-ingredients", "🥕 By ingredient"]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => {
              setFilter(v);
              if (v !== "by-ingredients") setSelectedIngredients(new Set());
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
              filter === v ? "bg-purple-600 text-white" : "bg-white text-gray-500 border-2 border-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ingredient picker — shown when "By ingredient" filter is active */}
      {filter === "by-ingredients" && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Tap ingredients you have — see recipes that use them:</p>
          <div className="flex flex-wrap gap-2">
            {ownedIngredients.map((ing) => {
              const sel = selectedIngredients.has(ing.name.toLowerCase());
              return (
                <button
                  key={ing.id}
                  onClick={() => setSelectedIngredients((prev) => {
                    const next = new Set(prev);
                    sel ? next.delete(ing.name.toLowerCase()) : next.add(ing.name.toLowerCase());
                    return next;
                  })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    sel
                      ? "bg-purple-600 text-white"
                      : "bg-white border-2 border-gray-200 text-gray-600"
                  }`}
                >
                  {ing.name}
                  {sel && <span className="text-purple-200">✓</span>}
                </button>
              );
            })}
            {selectedIngredients.size > 0 && (
              <button
                onClick={() => setSelectedIngredients(new Set())}
                className="px-3 py-1.5 rounded-full text-xs text-gray-400 border-2 border-dashed border-gray-200"
              >
                Clear
              </button>
            )}
          </div>
          {selectedIngredients.size > 0 && (
            <p className="text-xs text-purple-600 font-semibold mt-2">
              {filtered.length} recipe{filtered.length !== 1 ? "s" : ""} use {selectedIngredients.size > 1 ? "these ingredients" : "this ingredient"}
            </p>
          )}
        </div>
      )}

      {/* Category / tag filter — only in meals view */}
      {viewMode === "meals" && allTags.length > 0 && (
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
          const pref = getPref(recipe.id);
          const match = getMatch(recipe, ownedIngredientNames, pref.excluded_ingredients);
          const missingCount = match.total - match.have;
          let statusLabel: string;
          let statusColor: string;
          if (match.canMake) {
            statusLabel = "✅ Got it all!";
            statusColor = "text-green-500";
          } else if (missingCount === 1) {
            statusLabel = "🛒 Missing 1 item";
            statusColor = "text-orange-500";
          } else {
            statusLabel = `🛒 Missing ${missingCount} items`;
            statusColor = "text-orange-500";
          }
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
                  <div className="flex items-center gap-2">
                    <div className="font-display font-black truncate flex-1">{recipe.title}</div>
                    {pref.favourited && <span className="text-base">⭐</span>}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{recipe.description}</div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">⏱ {(recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)} min</span>
                    <span className="text-xs text-gray-400">👥 {recipe.servings}</span>
                    <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                  </div>
                </div>
                {/* Favourite / Hide action buttons */}
                <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => toggleFavourite(e, recipe.id)}
                    disabled={togglingPref === recipe.id + "-fav"}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                      pref.favourited ? "bg-yellow-100 text-yellow-500" : "bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-400"
                    }`}
                    aria-label={pref.favourited ? "Unfavourite" : "Favourite"}
                    title={pref.favourited ? "Remove from favourites" : "Add to favourites"}
                  >
                    {pref.favourited ? "⭐" : "☆"}
                  </button>
                  <button
                    onClick={(e) => toggleHidden(e, recipe.id)}
                    disabled={togglingPref === recipe.id + "-hide"}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 transition-all"
                    aria-label="Hide recipe"
                    title="Hide from pool"
                  >
                    🙈
                  </button>
                </div>
              </div>
              {/* Ingredient match bar */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${match.pct}%`,
                    background: match.canMake ? "#22c55e" : match.pct >= 50 ? "#f97316" : "#d1d5db",
                  }}
                />
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <div className="text-5xl mb-3">{viewMode === "desserts" ? "🍰" : "🤷"}</div>
            <p className="font-semibold">
              {viewMode === "desserts" ? "No dessert recipes yet" : "No matching recipes"}
            </p>
            <p className="text-sm mt-1">
              {viewMode === "desserts" ? "Dessert recipes tagged 'dessert' will appear here" : "Try adding more ingredients or hit Surprise me!"}
            </p>
          </div>
        )}

        {/* Show hidden recipes nudge */}
        {hiddenCount > 0 && (
          <button
            onClick={() => {
              // Un-hide all (restore all hidden recipes)
              const hiddenIds = Object.entries(prefs)
                .filter(([, p]) => p.hidden)
                .map(([id]) => id);
              hiddenIds.forEach((id) => toggleHidden({ stopPropagation: () => {} } as React.MouseEvent, id));
            }}
            className="w-full py-2 text-xs text-gray-400 underline text-center"
          >
            👁 Restore {hiddenCount} hidden recipe{hiddenCount > 1 ? "s" : ""}
          </button>
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
                  onClick={() => { openRecipe(surpriseRecipe); setSurpriseRecipe(null); }}
                  className="btn-primary w-full text-lg py-3.5"
                >
                  👨‍🍳 Let's cook this!
                </button>
                <button onClick={pickSurprise} className="w-full py-3 rounded-2xl font-bold text-purple-600 bg-purple-50">
                  🎲 Try another
                </button>
                <button onClick={() => setSurpriseRecipe(null)} className="w-full py-2 text-sm text-gray-400 underline">
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
              <div className="sticky top-0 z-10 bg-white pt-4 px-5 pb-3 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                <div className="flex items-start gap-3">
                  <div className="text-5xl">{selectedRecipe.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-display font-black">{selectedRecipe.title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedRecipe.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>⏱ {(selectedRecipe.prep_time_mins ?? 0) + (selectedRecipe.cook_time_mins ?? 0)} min</span>
                      <span>🔥 {selectedRecipe.difficulty}</span>
                    </div>
                  </div>
                  {/* Favourite & Hide in header */}
                  <div className="flex gap-1 -mt-1 -mr-1 shrink-0">
                    <button
                      onClick={(e) => toggleFavourite(e, selectedRecipe.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${
                        getPref(selectedRecipe.id).favourited ? "bg-yellow-100 text-yellow-500" : "bg-gray-100 text-gray-400"
                      }`}
                      title={getPref(selectedRecipe.id).favourited ? "Unfavourite" : "Favourite"}
                    >
                      {getPref(selectedRecipe.id).favourited ? "⭐" : "☆"}
                    </button>
                    <button
                      onClick={(e) => { toggleHidden(e, selectedRecipe.id); setSelectedRecipe(null); }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-base bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 transition-all"
                      title="Hide this recipe"
                    >
                      🙈
                    </button>
                    <button
                      onClick={() => setSelectedRecipe(null)}
                      className="text-gray-300 text-3xl leading-none px-1"
                      aria-label="Close"
                    >
                      ×
                    </button>
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
                    >
                      −
                    </button>
                    <span className="font-display font-black text-lg w-6 text-center">{targetServings}</span>
                    <button
                      onClick={() => setTargetServings((s) => Math.min(12, s + 1))}
                      className="w-9 h-9 rounded-full bg-white shadow-sm font-display font-black text-purple-600 text-lg active:scale-90 transition-transform"
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

                {/* Status banner */}
                {missingIngredients.length > 0 ? (
                  <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-3">
                    <p className="font-bold text-sm text-orange-600">
                      🛒 Missing {missingIngredients.length} ingredient{missingIngredients.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-orange-500 mt-0.5">
                      {missingIngredients.map((i) => i.name).join(", ")}
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-3">
                    <p className="font-bold text-sm text-green-600">✅ You've got everything you need!</p>
                  </div>
                )}

                {/* Ingredients */}
                {(() => {
                  const scale = targetServings / (selectedRecipe.servings || 1);
                  const excluded = getPref(selectedRecipe.id).excluded_ingredients;
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display font-black text-lg">🛒 Ingredients</h3>
                        <button
                          onClick={openIngredientEditor}
                          className="text-xs font-bold text-purple-500 bg-purple-50 px-3 py-1.5 rounded-full"
                        >
                          ✏️ Edit recipe
                        </button>
                      </div>
                      <div className="space-y-2">
                        {selectedRecipe.ingredients.map((ing, i) => {
                          const isExcluded = excluded.some((ex) => ing.name.toLowerCase().includes(ex));
                          const have = isOwned(ing.name, ownedIngredientNames);
                          const scaledQty = ing.quantity != null ? formatQty(ing.quantity * scale) : null;
                          if (isExcluded) {
                            return (
                              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 opacity-50">
                                <span className="text-xl">{ing.emoji}</span>
                                <span className="flex-1 font-medium line-through text-gray-400 text-sm">{ing.name}</span>
                                <button
                                  onClick={() => toggleExcludeIngredient(selectedRecipe.id, ing.name)}
                                  className="text-xs text-blue-400 font-bold hover:text-blue-600"
                                >
                                  Restore
                                </button>
                              </div>
                            );
                          }
                          return (
                            <div key={i} className={`flex items-center gap-3 p-2 rounded-xl ${have ? "bg-green-50" : "bg-gray-50"}`}>
                              <span className="text-xl">{ing.emoji}</span>
                              <span className="flex-1 font-medium">{ing.name}</span>
                              <span className="text-sm text-gray-500">{scaledQty} {ing.unit}</span>
                              {have && <span className="text-green-500 text-sm">✓</span>}
                              <button
                                onClick={() => toggleExcludeIngredient(selectedRecipe.id, ing.name)}
                                className="text-gray-300 hover:text-red-400 text-base leading-none transition-colors ml-1"
                                title="Remove this ingredient for my family"
                              >
                                🚫
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {excluded.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          Crossed-out ingredients are excluded for your family — tap Restore to bring them back.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Add missing to shopping list */}
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

                {/* Start cooking */}
                <button onClick={() => setCookingStep(0)} className="btn-primary w-full text-lg py-4">
                  👨‍🍳 Start cooking!
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Step-by-step cooking mode */}
      <AnimatePresence>
        {selectedRecipe && cookingStep !== null && !showRating && !showPantryUpdate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-purple-600 z-50 flex flex-col p-6"
          >
            <div className="h-1.5 bg-teal-500 rounded-full mb-6">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${((cookingStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCookingStep(null)} className="text-purple-200 font-bold">
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
                  onClick={openPantryUpdate}
                  className="bg-white text-purple-600 font-display font-black text-xl w-full py-4 rounded-2xl shadow-lg"
                >
                  🎉 I cooked it!
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update pantry after cooking */}
      <AnimatePresence>
        {showPantryUpdate && selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md mx-auto sm:mx-4 max-h-[85vh] overflow-y-auto"
            >
              <h2 className="text-xl font-display font-black">📦 Update your pantry</h2>
              <p className="text-sm text-gray-500 mt-0.5 mb-4">
                How much did you actually use? We'll take it off your ingredients list.
              </p>
              <div className="space-y-2">
                {pantryUpdateIngredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                    <span className="text-xl shrink-0">{ing.emoji}</span>
                    <span className="flex-1 font-medium truncate">{ing.name}</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={usedAmounts[i] ?? ""}
                      onChange={(e) => setUsedAmounts((prev) => ({ ...prev, [i]: e.target.value }))}
                      className="w-16 text-right input py-1.5 px-2 text-sm"
                    />
                    <span className="text-xs text-gray-400 w-10 shrink-0">{ing.unit || ""}</span>
                  </div>
                ))}
                {pantryUpdateIngredients.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">Nothing to track for this recipe.</p>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Tip: used less than the recipe says? Just change the number — even halves like 0.5 are fine.
              </p>
              <div className="mt-4 space-y-2">
                <button onClick={applyPantryDeductions} disabled={updatingPantry} className="btn-primary w-full disabled:opacity-60">
                  {updatingPantry ? "Updating…" : "✅ Update pantry"}
                </button>
                <button onClick={skipPantryUpdate} className="w-full py-2 text-sm text-gray-400 underline">
                  Skip — don't change my pantry
                </button>
              </div>
            </motion.div>
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

      {/* Edit recipe ingredients (global) */}
      <AnimatePresence>
        {editingIngredients && selectedRecipe && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setEditingIngredients(null)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-[70] max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white pt-4 px-5 pb-3 z-10 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                <h2 className="text-xl font-display font-black">✏️ Edit recipe ingredients</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Changes apply to everyone. To hide an ingredient just for your family, use the 🚫 button instead.
                </p>
              </div>
              <div className="p-5 space-y-3">
                {editingIngredients.map((ing, i) => (
                  <div key={i} className="card p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={ing.emoji}
                        onChange={(e) => updateEditingIngredient(i, { emoji: e.target.value })}
                        className="input w-12 text-center px-1"
                        aria-label="Emoji"
                      />
                      <input
                        value={ing.name}
                        onChange={(e) => updateEditingIngredient(i, { name: e.target.value })}
                        className="input flex-1"
                        placeholder="Ingredient name"
                      />
                      <button
                        onClick={() => removeEditingIngredient(i)}
                        className="text-gray-300 hover:text-red-400 text-2xl leading-none px-1"
                        aria-label="Remove ingredient"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        value={ing.quantity ?? ""}
                        onChange={(e) =>
                          updateEditingIngredient(i, { quantity: e.target.value === "" ? null : parseFloat(e.target.value) })
                        }
                        placeholder="Qty"
                        className="input flex-1"
                      />
                      <select
                        value={ing.unit ?? ""}
                        onChange={(e) => updateEditingIngredient(i, { unit: e.target.value })}
                        className="input flex-1"
                      >
                        <option value="">No unit</option>
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <button onClick={addEditingIngredient} className="w-full py-2.5 rounded-2xl font-bold text-purple-600 bg-purple-50">
                  + Add ingredient
                </button>
                <button onClick={saveIngredientEdits} disabled={savingIngredients} className="btn-primary w-full disabled:opacity-60">
                  {savingIngredients ? "Saving…" : "💾 Save changes"}
                </button>
                <button onClick={() => setEditingIngredients(null)} className="w-full py-2 text-sm text-gray-400 underline">
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
