"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
import type { MealPlan, RecipeLite, SpecialMeal, RecipeIngredient } from "@/lib/types";
import { SPECIAL_MEALS, UNITS } from "@/lib/types";

type MealSlot = "breakfast" | "lunch" | "dinner";

const MEAL_SLOTS: { type: MealSlot; emoji: string; label: string; tag: string }[] = [
  { type: "breakfast", emoji: "🌅", label: "Breakfast", tag: "breakfast" },
  { type: "lunch",     emoji: "☀️",  label: "Lunch",     tag: "lunch"     },
  { type: "dinner",   emoji: "🌙", label: "Dinner",    tag: "dinner"    },
];

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
  initialActiveSlots: string[];
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SPECIAL_META: Record<SpecialMeal, { label: string; emoji: string }> = {
  takeaway:   { label: "Takeaway",       emoji: "🥡" },
  eating_out: { label: "Eating Out",     emoji: "🍽️" },
  microwave:  { label: "Microwave Meal", emoji: "🍱" },
  leftovers:  { label: "Leftovers",      emoji: "♻️" },
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

/** Filter recipes by meal slot — breakfast/lunch only pick tagged recipes;
 *  dinner picks anything NOT tagged breakfast-only or lunch-only. */
function recipesForSlot(recipes: RecipeLite[], slot: MealSlot): RecipeLite[] {
  if (slot === "breakfast") {
    return recipes.filter((r) => (r.tags ?? []).includes("breakfast"));
  }
  if (slot === "lunch") {
    return recipes.filter((r) => (r.tags ?? []).includes("lunch"));
  }
  // dinner: exclude desserts, breakfast-only, and lunch-only recipes
  return recipes.filter((r) => {
    const tags = r.tags ?? [];
    if (tags.includes("dessert")) return false;
    if (tags.includes("breakfast") && !tags.includes("dinner")) return false;
    if (tags.includes("lunch") && !tags.includes("dinner")) return false;
    return true;
  });
}

const MEAL_PLAN_SELECT =
  "*, recipe:recipes!meal_plan_recipe_id_fkey(id, title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags), leftover_recipe:recipes!meal_plan_leftover_recipe_id_fkey(id, title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags)";

export default function PlannerClient({ weekDates, initialMealPlans, recipes, ownedIngredients, familyId, initialActiveSlots }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [plans, setPlans] = useState<MealPlan[]>(initialMealPlans);
  const [pantry, setPantry] = useState<PantryItem[]>(ownedIngredients);
  const [showRandomizeOptions, setShowRandomizeOptions] = useState(false);

  // Which meal slots are active — stored on the family row so all devices stay in sync
  const [activeSlots, setActiveSlots] = useState<Set<MealSlot>>(
    () => new Set<MealSlot>((initialActiveSlots as MealSlot[]).filter(Boolean))
  );

  async function toggleSlot(slot: MealSlot) {
    setActiveSlots((prev) => {
      if (prev.has(slot) && prev.size === 1) return prev; // keep at least one active
      const next = new Set(prev);
      next.has(slot) ? next.delete(slot) : next.add(slot);
      // Persist to Supabase so all family devices see the change
      supabase
        .from("families")
        .update({ active_meal_slots: [...next] })
        .eq("id", familyId)
        .then(({ error }) => { if (error) toast.error("Couldn't save slot preference"); });
      return next;
    });
  }

  // Picker state
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [pickerMealType, setPickerMealType] = useState<MealSlot>("dinner");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Leftover editor state
  const [leftoverDate, setLeftoverDate] = useState<string | null>(null);
  const [leftoverMealType, setLeftoverMealType] = useState<MealSlot>("dinner");
  const [leftoverRecipeId, setLeftoverRecipeId] = useState<string | null>(null);
  const [leftoverExtras, setLeftoverExtras] = useState<RecipeIngredient[]>([]);
  const [leftoverSearch, setLeftoverSearch] = useState("");
  const [savingLeftover, setSavingLeftover] = useState(false);

  const today = todayISO();

  // Live-sync the week's plan across devices / family members
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
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  // Sync slot preference changes from other family members' devices
  useEffect(() => {
    const channel = supabase
      .channel(`family_slots_${familyId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "families", filter: `id=eq.${familyId}` },
        (payload) => {
          const slots = (payload.new as { active_meal_slots?: string[] }).active_meal_slots;
          if (slots) setActiveSlots(new Set<MealSlot>(slots as MealSlot[]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  function planFor(date: string, mealType: MealSlot) {
    return plans.find((p) => p.planned_for === date && p.meal_type === mealType);
  }

  async function setMeal(
    date: string,
    mealType: MealSlot,
    payload: {
      recipe_id: string | null;
      special: SpecialMeal | null;
      servings: number;
      leftover_recipe_id?: string | null;
      leftover_extra_ingredients?: RecipeIngredient[];
    }
  ): Promise<boolean> {
    const existing = planFor(date, mealType);

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
        .insert({ family_id: familyId, planned_for: date, meal_type: mealType, ...payload })
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

  function openPicker(date: string, mealType: MealSlot) {
    setPickerDate(date);
    setPickerMealType(mealType);
    setSearch("");
    // Auto-filter tags to match the slot so relevant recipes surface first
    setActiveTag(mealType === "dinner" ? null : mealType);
  }

  async function selectRecipe(date: string, mealType: MealSlot, recipe: RecipeLite) {
    const slotLabel = MEAL_SLOTS.find((s) => s.type === mealType)?.label ?? mealType;
    const ok = await setMeal(date, mealType, { recipe_id: recipe.id, special: null, servings: 2 });
    if (ok) toast.success(`${recipe.emoji} ${recipe.title} added to ${dayLabel(date)} ${slotLabel}!`);
  }

  async function selectSpecial(date: string, mealType: MealSlot, special: SpecialMeal) {
    if (special === "leftovers") {
      setPickerDate(null);
      openLeftoverEditor(date, mealType);
      return;
    }
    const ok = await setMeal(date, mealType, { recipe_id: null, special, servings: 2 });
    if (ok) {
      const meta = SPECIAL_META[special];
      toast.success(`${meta.emoji} ${meta.label} planned for ${dayLabel(date)}!`);
    }
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

  function openLeftoverEditor(date: string, mealType: MealSlot = "dinner") {
    const existing = planFor(date, mealType);
    if (existing?.special === "leftovers") {
      setLeftoverRecipeId(existing.leftover_recipe_id ?? null);
      setLeftoverExtras(existing.leftover_extra_ingredients ?? []);
    } else {
      setLeftoverRecipeId(null);
      setLeftoverExtras([]);
    }
    setLeftoverSearch("");
    setLeftoverMealType(mealType);
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

      const wasNew = !planFor(leftoverDate, leftoverMealType);
      const ok = await setMeal(leftoverDate, leftoverMealType, {
        recipe_id: null,
        special: "leftovers",
        servings: 2,
        leftover_recipe_id: leftoverRecipeId ?? null,
        leftover_extra_ingredients: cleaned,
      });
      if (!ok) return;

      if (wasNew && cleaned.length > 0) await deductExtras(cleaned);

      const recipeMeta = leftoverRecipeId ? recipes.find((r) => r.id === leftoverRecipeId) : null;
      toast.success(`♻️ Leftovers${recipeMeta ? ` (${recipeMeta.title})` : ""} logged for ${dayLabel(leftoverDate)}!`);
      closeLeftoverEditor();
    } finally {
      setSavingLeftover(false);
    }
  }

  // ── Week controls ─────────────────────────────────────────

  async function randomizeWeek(mode: "any" | "have") {
    setShowRandomizeOptions(false);

    const emptySlots = weekDates.flatMap((date) =>
      MEAL_SLOTS.filter((s) => activeSlots.has(s.type) && !planFor(date, s.type)).map((s) => ({ date, slot: s }))
    );
    if (emptySlots.length === 0) { toast("Your whole week is already sorted! 🎉"); return; }

    setBusy(true);
    try {
      // For "use what I have" mode — fetch ingredient lists and find cookable recipes
      let cookableIds: Set<string> | null = null;
      if (mode === "have") {
        const allIds = recipes.map((r) => r.id);
        const { data: recipeIngs } = await supabase
          .from("recipe_ingredients")
          .select("recipe_id, name")
          .in("recipe_id", allIds);

        if (recipeIngs) {
          const ownedNames = pantry.map((p) => p.name.toLowerCase());
          cookableIds = new Set(
            recipes
              .filter((recipe) => {
                const needed = recipeIngs
                  .filter((i) => i.recipe_id === recipe.id)
                  .map((i) => (i.name as string).toLowerCase());
                return needed.every(
                  (n) =>
                    n === "water" ||
                    ownedNames.some((o) => o.includes(n) || n.includes(o))
                );
              })
              .map((r) => r.id)
          );
        }
      }

      const rows = emptySlots
        .map(({ date, slot }) => {
          let pool = recipesForSlot(recipes, slot.type);
          if (cookableIds) pool = pool.filter((r) => cookableIds!.has(r.id));
          if (pool.length === 0) return null;
          const recipe = pool[Math.floor(Math.random() * pool.length)];
          return {
            family_id: familyId,
            planned_for: date,
            meal_type: slot.type as "breakfast" | "lunch" | "dinner",
            recipe_id: recipe.id,
            special: null as null,
            servings: 2,
          };
        })
        .filter(Boolean) as {
          family_id: string;
          planned_for: string;
          meal_type: "breakfast" | "lunch" | "dinner";
          recipe_id: string;
          special: null;
          servings: number;
        }[];

      if (rows.length === 0) {
        toast.error(
          mode === "have"
            ? "Not enough ingredients for any meals — add more to your pantry first!"
            : "No recipes found for some slots"
        );
        return;
      }

      const { data, error } = await supabase.from("meal_plan").insert(rows).select(MEAL_PLAN_SELECT);
      if (error) { toast.error(error.message || "Couldn't randomize the week"); return; }
      setPlans((prev) => [...prev, ...((data ?? []) as unknown as MealPlan[])]);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.4 } });

      if (mode === "any") {
        const skipped = emptySlots.length - rows.length;
        toast.success(`Week sorted! Building your shopping list 🛒${skipped > 0 ? ` (${skipped} slot${skipped !== 1 ? "s" : ""} skipped)` : ""}`);
        setTimeout(() => router.push("/shopping?autoGenerate=true"), 1500);
      } else {
        const skipped = emptySlots.length - rows.length;
        toast.success(`Week sorted with what you have! 🥬${skipped > 0 ? ` (${skipped} slot${skipped !== 1 ? "s" : ""} skipped — not enough ingredients)` : ""}`);
      }
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

  // ── Derived ───────────────────────────────────────────────

  const allTags = useMemo(() => {
    const present = new Set<string>();
    for (const r of recipes) for (const t of r.tags ?? []) present.add(t);
    return Array.from(present).sort();
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    // Use slot-appropriate pool as base; tag chips refine on top of that
    const pool = activeTag
      ? recipes.filter((r) => (r.tags ?? []).includes(activeTag))
      : recipesForSlot(recipes, pickerMealType);
    return search ? pool.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())) : pool;
  }, [recipes, activeTag, search, pickerMealType]);

  const leftoverFilteredRecipes = useMemo(() => {
    return recipes.filter((r) =>
      leftoverSearch ? r.title.toLowerCase().includes(leftoverSearch.toLowerCase()) : true
    );
  }, [recipes, leftoverSearch]);

  const pickerPlan = pickerDate ? planFor(pickerDate, pickerMealType) : undefined;
  const pickerSlot = MEAL_SLOTS.find((s) => s.type === pickerMealType)!;

  // ── JSX ───────────────────────────────────────────────────

  return (
    <div className="p-5 space-y-4 pb-24">
      <div className="pt-4">
        <h1 className="text-2xl font-display font-black">📅 This week's plan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Anyone in the family can plan, swap, or change a day</p>
      </div>

      {/* Slot toggles */}
      <div className="flex gap-2">
        {MEAL_SLOTS.map((slot) => (
          <button
            key={slot.type}
            onClick={() => toggleSlot(slot.type)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSlots.has(slot.type)
                ? "bg-purple-100 text-purple-700 border-2 border-purple-200"
                : "bg-gray-100 text-gray-400 border-2 border-transparent"
            }`}
          >
            {slot.emoji} {slot.label}
          </button>
        ))}
      </div>

      {/* Randomize / clear */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowRandomizeOptions(true)}
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

      {/* 7-day grid — 3 meal slots per day */}
      <div className="space-y-3">
        {weekDates.map((date, idx) => {
          const isToday = date === today;
          const hasAnyPlan = MEAL_SLOTS.some((s) => !!planFor(date, s.type));

          return (
            <div
              key={date}
              className={`card p-0 overflow-hidden ${
                isToday
                  ? "border-2 border-purple-400"
                  : !hasAnyPlan
                  ? "border-2 border-dashed border-gray-200"
                  : ""
              }`}
            >
              {/* Day header */}
              <div className={`px-4 py-2 flex items-center gap-2 border-b border-gray-100 ${isToday ? "bg-purple-50" : "bg-gray-50/60"}`}>
                <span className={`text-[11px] font-black uppercase tracking-wider ${isToday ? "text-purple-600" : "text-gray-500"}`}>
                  {DAY_NAMES[idx]}
                </span>
                <span className="text-xs text-gray-400">{formatDate(date)}</span>
                {isToday && (
                  <span className="ml-auto text-[10px] font-bold text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>

              {/* Meal slot rows */}
              <div className="divide-y divide-gray-50">
                {MEAL_SLOTS.filter((s) => activeSlots.has(s.type)).map((slot) => {
                  const plan = planFor(date, slot.type);
                  const recipe = plan?.recipe ?? null;
                  const special = plan?.special ?? null;
                  const specialMeta = special ? SPECIAL_META[special] : null;
                  const isLeftovers = special === "leftovers";
                  const leftoverRecipePlan = isLeftovers
                    ? (plan as MealPlan & { leftover_recipe?: RecipeLite }).leftover_recipe ?? null
                    : null;

                  return (
                    <div
                      key={slot.type}
                      onClick={() => {
                        if (isLeftovers) {
                          openLeftoverEditor(date, slot.type);
                        } else {
                          openPicker(date, slot.type);
                        }
                      }}
                      className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer active:bg-gray-50 transition-colors"
                    >
                      {/* Slot icon */}
                      <span className="text-sm w-5 shrink-0 text-center">{slot.emoji}</span>

                      {plan ? (
                        <>
                          <span className="text-lg shrink-0">
                            {recipe?.emoji ?? (isLeftovers ? "♻️" : specialMeta?.emoji)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate leading-tight">
                              {recipe?.title ??
                                (isLeftovers
                                  ? leftoverRecipePlan
                                    ? `Leftovers: ${leftoverRecipePlan.title}`
                                    : "Leftovers"
                                  : specialMeta?.label)}
                            </div>
                            {recipe ? (
                              <div className="text-[10px] text-gray-400 mt-0.5">⏱ {totalTime(recipe)} min · 👥 {plan.servings}</div>
                            ) : isLeftovers ? (
                              <div className="text-[10px] text-teal-500 mt-0.5">
                                ♻️ No shopping needed
                                {(plan.leftover_extra_ingredients?.length ?? 0) > 0
                                  ? ` · ${plan.leftover_extra_ingredients!.length} extra used`
                                  : ""}
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-400 mt-0.5">Not cooking</div>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeMeal(plan.id); }}
                            className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none shrink-0 px-1"
                            aria-label="Remove meal"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 flex-1">+ Add {slot.label.toLowerCase()}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Randomize options sheet */}
      <AnimatePresence>
        {showRandomizeOptions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowRandomizeOptions(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 pb-safe"
            >
              <div className="pt-4 px-5 pb-6">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                <h2 className="text-xl font-display font-black mb-1">🎲 Randomize my week</h2>
                <p className="text-sm text-gray-500 mb-5">How do you want to fill the empty slots?</p>

                <div className="space-y-3">
                  <button
                    onClick={() => randomizeWeek("any")}
                    className="w-full card p-4 text-left active:scale-98 transition-transform border-2 border-transparent hover:border-purple-200"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎲</span>
                      <div>
                        <div className="font-black text-sm">Any recipes</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Fill the week at random, then head to your shopping list so you can grab what's missing.
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => randomizeWeek("have")}
                    className="w-full card p-4 text-left active:scale-98 transition-transform border-2 border-transparent hover:border-teal-200"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🥬</span>
                      <div>
                        <div className="font-black text-sm">Only what I have</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Only plan meals where your pantry already has the ingredients — no shopping needed.
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setShowRandomizeOptions(false)}
                  className="w-full mt-4 py-2 text-sm text-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                <h2 className="text-xl font-display font-black">
                  {pickerSlot.emoji} {dayLabel(pickerDate)}'s {pickerSlot.label}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{formatDate(pickerDate)} · what's the plan?</p>
              </div>

              <div className="px-5 pb-8 space-y-4">
                {/* Not cooking / other options */}
                <div className="grid grid-cols-2 gap-2">
                  {SPECIAL_MEALS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => selectSpecial(pickerDate, pickerMealType, opt.value)}
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

                {/* Tag filter chips */}
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
                      onClick={() => selectRecipe(pickerDate, pickerMealType, recipe)}
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
                  {dayLabel(leftoverDate)} {MEAL_SLOTS.find((s) => s.type === leftoverMealType)?.label} · which recipe and any extras?
                </p>
              </div>

              <div className="p-5 space-y-5">
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
                    <button onClick={() => setLeftoverRecipeId(null)} className="text-xs text-gray-400 underline mt-1">
                      Clear selection
                    </button>
                  )}
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <h3 className="font-bold text-sm text-gray-600 mb-1">Extra ingredients used</h3>
                  <p className="text-xs text-gray-400 mb-3">Anything you added on the side — will be deducted from your pantry.</p>

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
                            >×</button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number" step="any" min="0"
                              value={ing.quantity ?? ""}
                              onChange={(e) => updateExtra(i, { quantity: e.target.value === "" ? null : parseFloat(e.target.value) })}
                              placeholder="Qty"
                              className="input flex-1"
                            />
                            <select
                              value={ing.unit ?? ""}
                              onChange={(e) => updateExtra(i, { unit: e.target.value })}
                              className="input flex-1"
                            >
                              <option value="">No unit</option>
                              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={addExtra} className="w-full py-2.5 rounded-2xl font-bold text-purple-600 bg-purple-50">
                    + Add extra ingredient
                  </button>
                </div>

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
                {planFor(leftoverDate, leftoverMealType)?.special === "leftovers" && (
                  <button
                    onClick={() => { removeMeal(planFor(leftoverDate, leftoverMealType)!.id); closeLeftoverEditor(); }}
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
