"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { ShoppingItem, PlannedMealForShopping, IngredientCategory } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface PantryIngredient {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
}

interface Props {
  initialItems: ShoppingItem[];
  mealPlans: PlannedMealForShopping[];
  pantryIngredients: PantryIngredient[];
  familyId: string;
  userId: string;
}

// Common emoji suggestions per category (matches Ingredients page)
const EMOJI_SUGGESTIONS: Record<string, string[]> = {
  produce: ["🥦", "🥕", "🍅", "🧅", "🧄", "🥔", "🍋", "🍎", "🫑", "🥒", "🌽", "🥬"],
  meat: ["🥩", "🍗", "🥓", "🐟", "🍤", "🦐", "🥚"],
  dairy: ["🥛", "🧀", "🧈", "🫙"],
  pantry: ["🫙", "🌾", "🍚", "🍝", "🥫", "🫒", "🧂", "🌶️", "🧄"],
  frozen: ["🧊", "🍦", "🥶"],
  bakery: ["🍞", "🥖", "🥐", "🫓"],
  other: ["🛒", "🥤", "🧃", "☕"],
};

const UNITS = ["g", "kg", "ml", "L", "tbsp", "tsp", "cups", "pcs", "bunch", "tin", "bag", "box"];

const QUICK_ADD: [string, string, IngredientCategory][] = [
  ["🥛", "Milk", "dairy"], ["🍞", "Bread", "bakery"], ["🥚", "Eggs", "dairy"], ["🧈", "Butter", "dairy"],
  ["🧀", "Cheese", "dairy"], ["🥩", "Chicken", "meat"], ["🍅", "Tomatoes", "produce"], ["🥦", "Broccoli", "produce"],
];

function normalize(s: string) {
  return s.toLowerCase().trim();
}

// Roughly checks whether we already have enough of an ingredient at home
function inPantry(name: string, qty: number | null, unit: string | null, pantry: PantryIngredient[]) {
  const n = normalize(name);
  const match = pantry.find((p) => {
    const pn = normalize(p.name);
    return pn === n || pn.includes(n) || n.includes(pn);
  });
  if (!match) return false;
  if (qty == null) return true; // we have some, and the recipe doesn't say how much
  if (match.quantity == null) return true; // we have it, assume it's enough
  if (match.unit && unit && normalize(match.unit) !== normalize(unit)) return true; // can't compare units, assume fine
  return match.quantity >= qty;
}

export default function ShoppingClient({ initialItems, mealPlans, pantryIngredients, familyId, userId }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [newItem, setNewItem] = useState("");
  const [newEmoji, setNewEmoji] = useState("🛒");
  const [newCategory, setNewCategory] = useState<IngredientCategory>("other");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const plannedMeals = useMemo(() => mealPlans.filter((p) => p.recipe || p.special === "leftovers"), [mealPlans]);

  // Live-sync the shopping list across devices/family members
  useEffect(() => {
    const channel = supabase
      .channel(`shopping_items_${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as ShoppingItem;
            setItems((prev) => (prev.some((i) => i.id === newItem.id) ? prev : [newItem, ...prev]));
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as ShoppingItem;
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          } else if (payload.eventType === "DELETE") {
            const removedId = (payload.old as { id: string }).id;
            setItems((prev) => prev.filter((i) => i.id !== removedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  async function addItem(name?: string, emoji?: string, category?: IngredientCategory) {
    const itemName = (name ?? newItem).trim();
    if (!itemName) return;
    const itemEmoji = emoji ?? newEmoji;
    const itemCategory = category ?? newCategory;

    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        family_id: familyId,
        added_by: userId,
        name: itemName,
        emoji: itemEmoji,
        category: itemCategory,
        quantity: !name && newQuantity ? parseFloat(newQuantity) : null,
        unit: !name && newUnit ? newUnit : null,
        expires_at: !name && newExpiry ? newExpiry : null,
      })
      .select()
      .single();

    if (error) { toast.error(error.message || "Couldn't add item"); return; }
    setItems((prev) => [data, ...prev]);
    if (!name) {
      setNewItem("");
      setNewEmoji("🛒");
      setNewCategory("other");
      setNewQuantity("");
      setNewUnit("");
      setNewExpiry("");
      setShowDetails(false);
    }
  }

  // When an item is checked off, fold it into the ingredients list too
  async function addToIngredients(item: ShoppingItem) {
    const { data: existing } = await supabase
      .from("ingredients")
      .select("*")
      .eq("family_id", familyId)
      .ilike("name", item.name)
      .maybeSingle();

    if (existing) {
      const newQty =
        item.quantity != null && existing.quantity != null
          ? existing.quantity + item.quantity
          : existing.quantity ?? item.quantity ?? null;

      await supabase
        .from("ingredients")
        .update({
          quantity: newQty,
          unit: existing.unit ?? item.unit ?? null,
          // A freshly bought item's expiry takes priority over whatever was there before
          expires_at: item.expires_at ?? existing.expires_at ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("ingredients").insert({
        family_id: familyId,
        added_by: userId,
        name: item.name,
        emoji: item.emoji ?? "🥦",
        category: item.category ?? "other",
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        expires_at: item.expires_at ?? null,
      });
    }
  }

  async function toggleItem(id: string, isChecked: boolean) {
    setLoading(id);
    const { error } = await supabase
      .from("shopping_items")
      .update({ checked: isChecked })
      .eq("id", id);

    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: isChecked } : i)));
      if (isChecked) {
        const item = items.find((i) => i.id === id);
        if (item) {
          await addToIngredients(item);
          toast.success(`${item.emoji} ${item.name} added to your ingredients!`);
        }
      }
    }
    setLoading(null);
  }

  async function deleteChecked() {
    const ids = checked.map((i) => i.id);
    await supabase.from("shopping_items").delete().in("id", ids);
    setItems((prev) => prev.filter((i) => !i.checked));
    toast.success("Cleared completed items! 🧹");
  }

  async function shareList() {
    const text = unchecked.map((i) => `${i.emoji} ${i.name}`).join("\n");
    if (navigator.share) {
      await navigator.share({ title: "Shopping List", text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("List copied to clipboard! 📋");
    }
  }

  // One-tap: pull every ingredient needed for this week's planned meals,
  // skip anything already in the fridge/pantry or already on the list
  async function generateFromMealPlan() {
    if (plannedMeals.length === 0) {
      toast("No recipes planned this week yet — visit the Planner! 📅");
      return;
    }
    setBusy("plan");
    try {
      type Agg = { name: string; emoji: string; quantity: number | null; unit: string | null };
      const aggregated = new Map<string, Agg>();

      for (const plan of plannedMeals) {
        // Leftover meals: only add any extra ingredients they used, not the full recipe
        if (plan.special === "leftovers") {
          for (const ing of plan.leftover_extra_ingredients ?? []) {
            if (normalize(ing.name).includes("water")) continue;
            const key = `${normalize(ing.name)}|${normalize(ing.unit ?? "")}`;
            const existing = aggregated.get(key);
            if (existing) {
              if (ing.quantity != null) existing.quantity = (existing.quantity ?? 0) + ing.quantity;
            } else {
              aggregated.set(key, { name: ing.name, emoji: (ing as any).emoji || "🛒", quantity: ing.quantity, unit: ing.unit ?? null });
            }
          }
          continue;
        }

        const recipe = plan.recipe!;
        const ratio = recipe.servings ? plan.servings / recipe.servings : 1;
        for (const ing of recipe.ingredients ?? []) {
          // Water is always available — never add it to the shopping list
          if (normalize(ing.name).includes("water")) continue;
          const key = `${normalize(ing.name)}|${normalize(ing.unit ?? "")}`;
          const scaledQty = ing.quantity != null ? Math.round(ing.quantity * ratio * 100) / 100 : null;
          const existing = aggregated.get(key);
          if (existing) {
            if (scaledQty != null) existing.quantity = (existing.quantity ?? 0) + scaledQty;
          } else {
            aggregated.set(key, { name: ing.name, emoji: ing.emoji || "🛒", quantity: scaledQty, unit: ing.unit ?? null });
          }
        }
      }

      const toAdd = Array.from(aggregated.values()).filter((ing) => {
        if (inPantry(ing.name, ing.quantity, ing.unit, pantryIngredients)) return false;
        if (unchecked.some((i) => normalize(i.name) === normalize(ing.name))) return false;
        return true;
      });

      if (toAdd.length === 0) {
        toast.success("You've already got everything for this week's plan! 🎉");
        return;
      }

      const rows = toAdd.map((ing) => ({
        family_id: familyId,
        added_by: userId,
        name: ing.name,
        emoji: ing.emoji,
        category: "other" as IngredientCategory,
        quantity: ing.quantity,
        unit: ing.unit,
      }));

      const { data, error } = await supabase.from("shopping_items").insert(rows).select();
      if (error) { toast.error(error.message || "Couldn't generate the list"); return; }
      setItems((prev) => [...((data ?? []) as ShoppingItem[]), ...prev]);
      toast.success(`Added ${toAdd.length} item${toAdd.length === 1 ? "" : "s"} from this week's plan! 🧾`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-5 space-y-4">
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black">🛒 Shopping</h1>
          <p className="text-sm text-gray-500">{unchecked.length} items to get</p>
        </div>
        <button onClick={shareList} className="btn-secondary text-sm py-2">
          Share 📤
        </button>
      </div>

      {/* One-tap shopping helpers */}
      <button
        onClick={generateFromMealPlan}
        disabled={busy !== null}
        className="card p-3 text-left active:scale-98 transition-transform disabled:opacity-60 w-full flex items-center gap-3"
      >
        <div className="text-2xl">🧾</div>
        <div>
          <div className="font-bold text-sm leading-tight">From this week&apos;s plan</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {plannedMeals.filter((p) => p.recipe).length} recipe{plannedMeals.filter((p) => p.recipe).length === 1 ? "" : "s"} + {plannedMeals.filter((p) => p.special === "leftovers").length} leftover day{plannedMeals.filter((p) => p.special === "leftovers").length === 1 ? "" : "s"} planned
          </div>
        </div>
      </button>

      {/* Add item input */}
      <div className="card p-3 space-y-3">
        <div className="flex gap-2">
          <input
            className="w-14 text-2xl text-center border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:outline-none"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            placeholder="🛒"
          />
          <input
            className="flex-1 border-2 border-purple-100 rounded-xl px-3 py-2 focus:border-purple-400 focus:outline-none font-medium"
            placeholder="Add an item…"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <button
            onClick={() => addItem()}
            disabled={!newItem.trim()}
            className="btn-primary py-2 px-4"
          >
            +
          </button>
        </div>

        {/* Emoji suggestions for the chosen category */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(EMOJI_SUGGESTIONS[newCategory] ?? []).map((e) => (
            <button
              key={e}
              onClick={() => setNewEmoji(e)}
              className={`text-xl flex-shrink-0 p-1.5 rounded-lg transition-all ${
                newEmoji === e ? "bg-purple-100 scale-110" : "hover:bg-gray-100"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Category picker */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setNewCategory(c.value);
                setNewEmoji(EMOJI_SUGGESTIONS[c.value]?.[0] ?? newEmoji);
              }}
              className={`badge transition-all text-sm ${
                newCategory === c.value ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Optional details: quantity, unit, expiry */}
        <button
          onClick={() => setShowDetails((s) => !s)}
          className="text-sm font-semibold text-purple-500"
        >
          {showDetails ? "− Hide details" : "+ Add quantity / expiry (optional)"}
        </button>
        {showDetails && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5">Quantity</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 500"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5">Unit</label>
                <select
                  className="input"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                >
                  <option value="">—</option>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Expiry date <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                className="input"
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick add suggestions */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
        {QUICK_ADD.map(([emoji, name, category]) => (
          <button
            key={name}
            onClick={() => addItem(name, emoji, category)}
            className="flex-shrink-0 bg-white border-2 border-purple-100 rounded-xl px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 hover:bg-purple-50 transition-colors"
          >
            {emoji} {name}
          </button>
        ))}
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🛒</div>
          <p className="font-semibold">Your list is empty!</p>
          <p className="text-sm mt-1">Add items above or cook a recipe to auto-populate</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Unchecked items */}
          {unchecked.length > 0 && (
            <div className="space-y-2">
              <AnimatePresence>
                {unchecked.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    className="card px-4 py-3 flex items-center gap-3"
                  >
                    <button
                      onClick={() => toggleItem(item.id, true)}
                      disabled={loading === item.id}
                      className="w-6 h-6 rounded-full border-2 border-purple-300 flex-shrink-0 transition-all hover:border-purple-600"
                    />
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      {item.expires_at && (
                        <div className="text-xs text-gray-400">
                          📅 Use by {new Date(item.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {item.quantity && (
                      <span className="text-sm text-gray-400">{item.quantity} {item.unit}</span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Checked items */}
          {checked.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Got it ✓ ({checked.length}) · added to ingredients 🧊
                </p>
                <button onClick={deleteChecked} className="text-xs text-red-400 font-semibold">
                  Clear
                </button>
              </div>
              <div className="space-y-2 opacity-60">
                {checked.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card px-4 py-3 flex items-center gap-3"
                  >
                    <button
                      onClick={() => toggleItem(item.id, false)}
                      className="w-6 h-6 rounded-full bg-teal-500 flex-shrink-0 flex items-center justify-center text-white text-xs"
                    >
                      ✓
                    </button>
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="flex-1 font-medium line-through text-gray-400">{item.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
