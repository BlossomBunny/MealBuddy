"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
import type { MealPlan, RecipeLite, SpecialMeal, RecipeIngredient } from "@/lib/types";
import { SPECIAL_MEALS, UNITS } from "@/lib/types";

interface PantryItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  secondary_quantity: number | null;
  secondary_unit: string | null;
}

interface Props {
  weekDates: string[];
  initialMealPlans: MealPlan[];
  recipes: RecipeLite[];
  ownedIngredients: PantryItem[];
  familyId: string;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SPECIAL_META: Record<SpecialMeal, { label: string; emoji: string }> = {
  takeaway: { label: "Takeaway", emoji: "🥡" },
  eating_out: { label: "Eating Out", emoji: "🍽️" },
  microwave: { label: "Microwave Meal", emoji: "🍱" },
  leftovers: { label: "Leftovers", emoji: "♻️" },
};

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function totalTime(r: RecipeLite) {
  return (r.prep_time_mins ?? 0) + (r.cook_time_mins ?? 0);
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

const MEAL_PLAN_SELECT =
  "*, recipe:recipes(id, title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags), leftover_recipe:recipes!meal_plan_leftover_recipe_id_fkey(id, title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags)";

export default function PlannerClient({ weekDates, initialMealPlans, recipes, ownedIngredients, familyId }: Props) {
  const supabase = createClient();
  const [plans, setPlans] = useState<MealPlan[]>(initialMealPlans);
  const [pantry, setPantry] = useState<PantryItem[]>(ownedIngredients);

  // Main recipe picker state
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Leftover editor state
  const [leftoverDate, setLeftoverDate] = useState<string | null>(null);
  const [leftoverRecipeId, setLeftoverRecipeId] = useState<string | null>(null);
  const [leftoverExtras, setLeftoverExtras] = useState<RecipeIngredient[]>([]);
  const [leftoverSearch, setLeftoverSearch] = useState("");
  const [savingLeftover, setSavingLeftover] = useState(false);

  const today = todayISO();

  // Live-sync the week's plan across devices/family members
  useEffect(() => {
    const channel = supabase
      .channel(`meal_plan_${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meal_plan", filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as MealPlan;
            if (!weekDates.includes(row.planned_for)) return;
            const recipe = row.recipe_id ? recipes.find((r) => r.id === row.recipe_id) ?? null : null;
            setPlans((prev) => (prev.some((p) => p.id === row.id) ? prev : [...prev, { ...row, recipe }]));
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as MealPlan;
            const recipe = row.recipe_id ? recipes.find((r) => r.id === row.recipe_id) ?? null : null;
            setPlans((prev) => prev.map((p) => (p.id === row.id ? { ...row, recipe } : p)));
          } else if (payload.eventType === "DELETE") {
            const removedId = (payload.old as { id: string }).id;
            setPlans((prev) => prev.filter((p) => p.id !== removedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  function planFor(date: string) {
    return plans.find((p) => p.planned_for === date && p.meal_type === "dinner");
  }

  async function setMeal(
    date: string,
    payload: {
      recipe_id: string | null;
      special: SpecialMeal | null;
      servings: number;
      leftover_recipe_id?: string | null;
      leftover_extra_ingredients?: RecipeIngredient[];
    }
  ): Promise<boolean> {
    const existing = planFor(date);

    if (existing) {
      const { data, error } = await supabase
        .from("meal_plan")
        .update(payload)
        .eq("id", existing.id)
        .select(MEAL_PLAN_SELECT)
        .single();
      if (error) { toast.error(error.message || "Couldn't update the plan"); return false; }
      setPlans((prev) => prev.map((p) => (p.id === existing.id ? (data as unknown as MealPlan) : p)));
    } else {
      const { data, error } = await supabase
        .from("meal_plan")
        .insert({ family_id: familyId, planned_for: date, meal_type: "dinner", ...payload })
        .select(MEAL_PLAN_SELECT)
        .single();
      if (error) { toast.error(error.message || "Couldn't add to the plan"); return false; }
      setPlans((prev) => [...prev, data as unknown as MealPlan]);
    }
    setPickerDate(null);
    setSearch("");
    setActiveTag(null);
    return true;
  }

  function selectRecipe(date: string, recipe: RecipeLite) {
    setMeal(date, { recipe_id: recipe.id, special: null, servings: 2 });
    toast.success(`${recipe.emoji} ${recipe.title} added to ${dayLabel(date)}!`);
  }

  function selectSpecial(date: string, special: SpecialMeal) {
    if (special === "leftovers") {
      // Close the picker and open the leftover editor instead
      setPickerDate(null);
      openLeftoverEditor(date);
      return;
    }
    setMeal(date, { recipe_id: null, special, servings: 2 });
    const meta = SPECIAL_META[special];
    toast.success(`${meta.emoji} ${meta.label} planned for ${dayLabel(date)}!`);
  }

  async function removeMeal(id: string) {
    const { error } = await supabase.from("meal_plan").delete().eq("id", id);
    if (error) { toast.error(error.message || "Couldn't remove that meal"); return; }
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast("Removed from the plan", { icon: "🗑️" });
  }

  function dayLabel(date: string) {
    const idx = weekDates.indexOf(date);
    return idx >= 0 ? DAY_NAMES[idx] : "that day";
  }

  // ── Leftover editor ───────────────────────────────────────

  function openLeftoverEditor(date: string) {
    const existing = planFor(date);
    if (existing?.special === "leftovers") {
      // Pre-fill from existing plan
      setLeftoverRecipeId(existing.leftover_recipe_id ?? null);
      setLeftoverExtras(existing.leftover_extra_ingredients ?? []);
    } else {
      setLeftoverRecipeId(null);
      setLeftoverExtras([]);
    }
    setLeftoverSearch("");
    setLeftoverDate(date);
  }

  function closeLeftoverEditor() {
    setLeftoverDate(null);
    setLeftoverRecipeId(null);
    setLeftoverExtras([]);
    setLeftoverSearch("");
  }

  function updateExtra(i: number, patch: Partial<RecipeIngredient>) {
    setLeftoverExtras((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)));
  }

  function removeExtra(i: number) {
    setLeftoverExtras((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addExtra() {
    setLeftoverExtras((prev) => [...prev, { name: "", quantity: null, unit: "", emoji: "🛒" }]);
  }

  async function deductExtras(extras: RecipeIngredient[]) {
    const updates: { id: string; quantity?: number; secondary_quantity?: number }[] = [];

    extras.forEach((ing) => {
      if (!ing.quantity || ing.quantity <= 0) return;
      const match = findPantryMatch(ing.name, pantry);
      if (!match) return;
      const unit = ing.unit || "";
      if (unitsMatch(match.unit, unit)) {
        updates.push({ id: match.id, quantity: Math.max(0, (match.quantity ?? 0) - ing.quantity) });
      } else if (unitsMatch(match.secondary_unit, unit)) {
        updates.push({ id: match.id, secondary_quantity: Math.max(0, (match.secondary_quantity ?? 0) - ing.quantity) });
      }
    });

    if (updates.length === 0) return;

    for (const u of updates) {
      const patch: Record<string, number> = {};
      if (u.quantity !== undefined) patch.quantity = u.quantity;
      if (u.secondary_quantity !== undefined) patch.secondary_quantity = u.secondary_quantity;
      await supabase.from("ingredients").update(patch).eq("id", u.id);
    }

    setPantry((prev) =>
      prev.map((p) => {
        const u = updates.find((x) => x.id === p.id);
        if (!u) return p;
        return {
          ...p,
          quantity: u.quantity !== undefined ? u.quantity : p.quantity,
          secondary_quantity: u.secondary_quantity !== undefined ? u.secondary_quantity : p.secondary_quantity,
        };
      })
    );

    toast.success(`Pantry updated — ${updates.length} item${updates.length === 1 ? "" : "s"} deducted 📦`);
  }

  async function saveLeftoverMeal() {
    if (!leftoverDate) return;
    setSavingLeftover(true);
    try {
      const cleaned = leftoverExtras
        .map((ing) => ({ ...ing, name: ing.name.trim() }))
        .filter((ing) => ing.name.length > 0);

      const wasNew = !planFor(leftoverDate);

      const ok = await setMeal(leftoverDate, {
        recipe_id: null,
        special: "leftovers",
        servings: 2,
        leftover_recipe_id: leftoverRecipeId ?? null,
        leftover_extra_ingredients: cleaned,
      });
      if (!ok) return;

      // Only deduct extras from pantry on first save (not edits), to avoid double-counting
      if (wasNew && cleaned.length > 0) {
        await deductExtras(cleaned);
      }

      const recipeMeta = leftoverRecipeId ? recipes.find((r) => r.id === leftoverRecipeId) : null;
      toast.success(`♻️ Leftovers${recipeMeta ? ` (${recipeMeta.title})` : ""} logged for ${dayLabel(leftoverDate)}!`);
      closeLeftoverEditor();
    } finally {
      setSavingLeftover(false);
    }
  }

  // ── Week controls ─────────────────────────────────────────

  async function randomizeWeek() {
    const emptyDates = weekDates.filter((date) => !planFor(date));
    if (emptyDates.length === 0) {
      toast("Your week's already sorted! 🎉");
      return;
    }
    if (recipes.length === 0) {
      toast.error("No recipes to pick from yet");
      return;
    }
    setBusy(true);
    try {
      const shuffled = [...recipes].sort(() => Math.random() - 0.5);
      const rows = emptyDates.map((date, i) => {
        const recipe = shuffled[i % shuffled.length];
        return {
          family_id: familyId,
          planned_for: date,
          meal_type: "dinner" as const,
          recipe_id: recipe.id,
          special: null,
          servings: 2,
        };
      });
      const { data, error } = await supabase
        .from("meal_plan")
        .insert(rows)
        .select(MEAL_PLAN_SELECT);
      if (error) { toast.error(error.message || "Couldn't randomize the week"); return; }
      setPlans((prev) => [...prev, ...((data ?? []) as unknown as MealPlan[])]);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.4 } });
      toast.success("Your week is sorted! 🎲 Tap any day to swap it.");
    } finally {
      setBusy(false);
    }
  }

  async function clearWeek() {
    const ids = plans.filter((p) => weekDates.includes(p.planned_for)).map((p) => p.id);
    if (ids.length === 0) return;
    if (!window.confirm("Clear the whole week's plan?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("meal_plan").delete().in("id", ids);
      if (error) { toast.error(error.message || "Couldn't clear the week"); return; }
      setPlans((prev) => prev.filter((p) => !ids.includes(p.id)));
      toast("Week cleared 🧹", { icon: "🧹" });
    } finally {
      setBusy(false);
    }
  }

  const allTags = useMemo(() => {
    const present = new Set<string>();
    for (const r of recipes) for (const t of r.tags ?? []) present.add(t);
    return Array.from(present).sort();
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes
      .filter((r) => (activeTag ? (r.tags ?? []).includes(activeTag) : true))
      .filter((r) => (search ? r.title.toLowerCase().includes(search.toLowerCase()) : true));
  }, [recipes, activeTag, search]);

  const leftoverFilteredRecipes = useMemo(() => {
    return recipes.filter((r) =>
      leftoverSearch ? r.title.toLowerCase().includes(leftoverSearch.toLowerCase()) : true
    );
  }, [recipes, leftoverSearch]);

  const pickerPlan = pickerDate ? planFor(pickerDate) : undefined;

  return (
    <div className="p-5 space-y-4 pb-24">
      <div className="pt-4">
        <h1 className="text-2xl font-display font-black">📅 This week's plan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Anyone in the family can plan, swap, or change a day</p>
      </div>

      {/* Randomize / clear */}
      <div className="flex gap-2">
        <button
          onClick={randomizeWeek}
          disabled={busy}
          className="flex-1 py-3 rounded-2xl font-display font-black text-white shadow-lg active:scale-98 transition-transform disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #9333ea, #14b8a6)" }}
        >
          🎲 Randomize my week
        </button>
        <button onClick={clearWeek} disabled={busy} className="btn-secondary disabled:opacity-60">
          🧹 Clear
        </button>
      </div>

      {/* 7-day grid */}
      <div className="space-y-2">
        {weekDates.map((date, idx) => {
          const plan = planFor(date);
          const isToday = date === today;
          const recipe = plan?.recipe ?? null;
          const special = plan?.special ?? null;
          const specialMeta = special ? SPECIAL_META[special] : null;
          const isLeftovers = special === "leftovers";
          const leftoverRecipe = isLeftovers ? (plan as MealPlan & { leftover_recipe?: RecipeLite }).leftover_recipe ?? null : null;

          return (
            <motion.div
              key={date}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (isLeftovers) {
                  openLeftoverEditor(date);
                } else {
                  setPickerDate(date);
                }
              }}
              className={`card p-3 flex items-center gap-3 cursor-pointer ${
                isToday ? "border-2 border-purple-400 bg-purple-50" : !plan ? "border-2 border-dashed border-gray-200" : ""
              }`}
            >
              <div className="text-center w-14 shrink-0">
                <div className={`text-[10px] font-bold uppercase tracking-wide ${isToday ? "text-purple-600" : "text-gray-400"}`}>
                  {DAY_NAMES[idx].slice(0, 3)}
                  {isToday && " · Today"}
                </div>
                <div className="text-lg font-display font-black leading-tight">{formatDate(date)}</div>
              </div>

              {plan ? (
                <div className="flex-1 min-w-0 flex items-center gap-2.5">
                  <span className="text-3xl shrink-0">
                    {recipe?.emoji ?? (isLeftovers ? "♻️" : specialMeta?.emoji)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">
                      {recipe?.title ?? (isLeftovers
                        ? leftoverRecipe ? `Leftovers: ${leftoverRecipe.title}` : "Leftovers"
                        : specialMeta?.label)}
                    </div>
                    {recipe ? (
                      <div className="text-xs text-gray-400">
                        ⏱ {totalTime(recipe)} min · 👥 {plan.servings}
                      </div>
                    ) : isLeftovers ? (
                      <div className="text-xs text-teal-500 font-medium">
                        ♻️ No shopping needed{(plan.leftover_extra_ingredients?.length ?? 0) > 0 ? ` · ${plan.leftover_extra_ingredients!.length} extra used` : ""}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Not cooking tonight</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeMeal(plan.id); }}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1 text-xl shrink-0"
                    aria-label="Remove meal"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between text-gray-400 font-semibold">
                  <span>Tap to plan this day</span>
                  <span className="text-purple-300 text-xl">+</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Recipe picker bottom sheet */}
      <AnimatePresence>
        {pickerDate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setPickerDate(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto overscroll-contain"
            >
              <div className="sticky top-0 bg-white pt-4 px-5 pb-3 z-10">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                <h2 className="text-xl font-display font-black">{dayLabel(pickerDate)}'s plan</h2>
                <p className="text-sm text-gray-500 mt-0.5">{formatDate(pickerDate)} · what's the move?</p>
              </div>

              <div className="px-5 pb-8 space-y-4">
                {/* Not cooking / other options — 2×2 grid */}
                <div className="grid grid-cols-2 gap-2">
                  {SPECIAL_MEALS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => selectSpecial(pickerDate, opt.value)}
                      className="card p-3 text-center active:scale-95 transition-transform"
                    >
                      <div className="text-2xl">{opt.emoji}</div>
                      <div className="text-xs font-bold mt-1">{opt.label}</div>
                      {opt.value === "leftovers" && (
                        <div className="text-[10px] text-teal-500 font-medium mt-0.5">No shopping needed</div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">or pick a recipe</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Search */}
                <input
                  className="input"
                  placeholder="🔍 Search recipes…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {/* Tag filter */}
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

                {/* Recipe list */}
                <div className="space-y-2">
                  {filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => selectRecipe(pickerDate, recipe)}
                      className="card p-3 flex items-center gap-3 w-full text-left active:scale-98 transition-transform"
                    >
                      <span className="text-2xl shrink-0">{recipe.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{recipe.title}</div>
                        <div className="text-xs text-gray-400">⏱ {totalTime(recipe)} min · 👥 {recipe.servings}</div>
                      </div>
                    </button>
                  ))}
                  {filteredRecipes.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <div className="text-3xl mb-2">🤷</div>
                      <p className="text-sm font-semibold">No recipes match</p>
                    </div>
                  )}
                </div>

                {pickerPlan && (
                  <button
                    onClick={() => { removeMeal(pickerPlan.id); setPickerDate(null); }}
                    className="w-full py-2 text-sm text-red-400 font-semibold"
                  >
                    🗑️ Remove this meal
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Leftover editor sheet */}
      <AnimatePresence>
        {leftoverDate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeLeftoverEditor}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto overscroll-contain"
            >
              <div className="sticky top-0 bg-white pt-4 px-5 pb-3 z-10 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                <h2 className="text-xl font-display font-black">♻️ Log leftovers</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {dayLabel(leftoverDate)} · which recipe and any extras?
                </p>
              </div>

              <div className="p-5 space-y-5">

                {/* Which recipe was it? */}
                <div>
                  <h3 className="font-bold text-sm text-gray-600 mb-2">Which recipe's leftovers?</h3>
                  <input
                    className="input mb-2"
                    placeholder="🔍 Search recipes…"
                    value={leftoverSearch}
                    onChange={(e) => setLeftoverSearch(e.target.value)}
                  />
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {leftoverFilteredRecipes.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setLeftoverRecipeId((prev) => (prev === r.id ? null : r.id))}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                          leftoverRecipeId === r.id
                            ? "bg-teal-50 border-2 border-teal-400"
                            : "bg-gray-50 border-2 border-transparent"
                        }`}
                      >
                        <span className="text-xl shrink-0">{r.emoji}</span>
                        <span className="font-medium text-sm truncate">{r.title}</span>
                        {leftoverRecipeId === r.id && <span className="text-teal-500 ml-auto shrink-0">✓</span>}
                      </button>
                    ))}
                  </div>
                  {leftoverRecipeId && (
                    <button
                      onClick={() => setLeftoverRecipeId(null)}
                      className="text-xs text-gray-400 underline mt-1"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                <div className="h-px bg-gray-100" />

                {/* Extra ingredients used */}
                <div>
                  <h3 className="font-bold text-sm text-gray-600 mb-1">Extra ingredients used</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Anything you added on the side — will be deducted from your pantry.
                  </p>

                  {leftoverExtras.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {leftoverExtras.map((ing, i) => (
                        <div key={i} className="card p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              value={ing.emoji}
                              onChange={(e) => updateExtra(i, { emoji: e.target.value })}
                              className="input w-12 text-center px-1"
                              aria-label="Emoji"
                            />
                            <input
                              value={ing.name}
                              onChange={(e) => updateExtra(i, { name: e.target.value })}
                              className="input flex-1"
                              placeholder="Ingredient name"
                            />
                            <button
                              onClick={() => removeExtra(i)}
                              className="text-gray-300 hover:text-red-400 text-2xl leading-none px-1"
                              aria-label="Remove"
                            >
                              ×
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={ing.quantity ?? ""}
                              onChange={(e) =>
                                updateExtra(i, { quantity: e.target.value === "" ? null : parseFloat(e.target.value) })
                              }
                              placeholder="Qty"
                              className="input flex-1"
                            />
                            <select
                              value={ing.unit ?? ""}
                              onChange={(e) => updateExtra(i, { unit: e.target.value })}
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
                    </div>
                  )}

                  <button
                    onClick={addExtra}
                    className="w-full py-2.5 rounded-2xl font-bold text-purple-600 bg-purple-50"
                  >
                    + Add extra ingredient
                  </button>
                </div>

                {/* Save / cancel */}
                <button
                  onClick={saveLeftoverMeal}
                  disabled={savingLeftover}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {savingLeftover ? "Saving…" : "✅ Log leftovers"}
                </button>
                <button onClick={closeLeftoverEditor} className="w-full py-2 text-sm text-gray-400 underline">
                  Cancel
                </button>

                {planFor(leftoverDate)?.special === "leftovers" && (
                  <button
                    onClick={() => { removeMeal(planFor(leftoverDate)!.id); closeLeftoverEditor(); }}
                    className="w-full py-2 text-sm text-red-400 font-semibold"
                  >
                    🗑️ Remove this meal
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
