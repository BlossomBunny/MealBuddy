"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
import type { MealPlan, RecipeLite, SpecialMeal } from "@/lib/types";
import { SPECIAL_MEALS } from "@/lib/types";

interface Props {
  weekDates: string[]; // 7 ISO dates, Monday → Sunday
  initialMealPlans: MealPlan[];
  recipes: RecipeLite[];
  familyId: string;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SPECIAL_META: Record<SpecialMeal, { label: string; emoji: string }> = {
  takeaway: { label: "Takeaway", emoji: "🥡" },
  eating_out: { label: "Eating Out", emoji: "🍽️" },
  microwave: { label: "Microwave Meal", emoji: "🍱" },
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

export default function PlannerClient({ weekDates, initialMealPlans, recipes, familyId }: Props) {
  const supabase = createClient();
  const [plans, setPlans] = useState<MealPlan[]>(initialMealPlans);
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

  async function setMeal(date: string, payload: { recipe_id: string | null; special: SpecialMeal | null; servings: number }) {
    const existing = planFor(date);
    const select = "*, recipe:recipes(id, title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags)";

    if (existing) {
      const { data, error } = await supabase
        .from("meal_plan")
        .update(payload)
        .eq("id", existing.id)
        .select(select)
        .single();
      if (error) { toast.error(error.message || "Couldn't update the plan"); return; }
      setPlans((prev) => prev.map((p) => (p.id === existing.id ? (data as MealPlan) : p)));
    } else {
      const { data, error } = await supabase
        .from("meal_plan")
        .insert({ family_id: familyId, planned_for: date, meal_type: "dinner", ...payload })
        .select(select)
        .single();
      if (error) { toast.error(error.message || "Couldn't add to the plan"); return; }
      setPlans((prev) => [...prev, data as MealPlan]);
    }
    setPickerDate(null);
    setSearch("");
    setActiveTag(null);
  }

  function selectRecipe(date: string, recipe: RecipeLite) {
    setMeal(date, { recipe_id: recipe.id, special: null, servings: recipe.servings ?? 4 });
    toast.success(`${recipe.emoji} ${recipe.title} added to ${dayLabel(date)}!`);
  }

  function selectSpecial(date: string, special: SpecialMeal) {
    setMeal(date, { recipe_id: null, special, servings: 4 });
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
          servings: recipe.servings ?? 4,
        };
      });
      const { data, error } = await supabase
        .from("meal_plan")
        .insert(rows)
        .select("*, recipe:recipes(id, title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags)");
      if (error) { toast.error(error.message || "Couldn't randomize the week"); return; }
      setPlans((prev) => [...prev, ...((data ?? []) as MealPlan[])]);
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

          return (
            <motion.div
              key={date}
              whileTap={{ scale: 0.99 }}
              onClick={() => setPickerDate(date)}
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
                  <span className="text-3xl shrink-0">{recipe?.emoji ?? specialMeta?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{recipe?.title ?? specialMeta?.label}</div>
                    {recipe ? (
                      <div className="text-xs text-gray-400">
                        ⏱ {totalTime(recipe)} min · 👥 {recipe.servings}
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

      {/* Picker bottom sheet */}
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
                {/* Not cooking options */}
                <div className="grid grid-cols-3 gap-2">
                  {SPECIAL_MEALS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => selectSpecial(pickerDate, opt.value)}
                      className="card p-3 text-center active:scale-95 transition-transform"
                    >
                      <div className="text-2xl">{opt.emoji}</div>
                      <div className="text-xs font-bold mt-1">{opt.label}</div>
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
    </div>
  );
}
