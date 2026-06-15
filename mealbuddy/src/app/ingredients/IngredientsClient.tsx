"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Ingredient, IngredientCategory } from "@/lib/types";
import { CATEGORIES, EMOJI_SUGGESTIONS, UNITS } from "@/lib/types";
import BarcodeScanner from "@/components/BarcodeScanner";
import { lookupBarcode } from "@/lib/barcodeUtils";

interface Props {
  initialIngredients: Ingredient[];
  familyId: string;
  userId: string;
}

export default function IngredientsClient({ initialIngredients, familyId, userId }: Props) {
  const supabase = createClient();
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const emptyForm = {
    name: "",
    emoji: "🥦",
    category: "produce" as IngredientCategory,
    quantity: "",
    unit: "",
    secondary_quantity: "",
    secondary_unit: "",
    expires_at: "",
  };

  // Add/edit ingredient form state
  const [form, setForm] = useState(emptyForm);

  // Set when editing an existing ingredient (null = adding a new one)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Set when the form was pre-filled from a barcode scan, so we can
  // show a hint in the Add sheet
  const [scanHint, setScanHint] = useState<{ matched: boolean; rawName: string } | null>(null);

  async function handleBarcodeDetected(barcode: string) {
    setShowScanner(false);
    const loadingId = toast.loading("Looking up product…");
    try {
      const result = await lookupBarcode(barcode);
      toast.dismiss(loadingId);

      if (!result) {
        toast.error("Couldn't find that product — add it manually");
        setScanHint(null);
        setEditingId(null);
        setForm(emptyForm);
        setShowAdd(true);
        return;
      }

      setEditingId(null);
      setForm({
        ...emptyForm,
        name: result.name,
        emoji: result.emoji,
        category: result.category,
        quantity: result.quantity != null ? String(result.quantity) : "",
        unit: result.unit ?? "",
      });
      setScanHint({ matched: result.matched, rawName: result.rawName });
      setShowAdd(true);
      toast.success(
        result.matched
          ? `${result.emoji} Matched: ${result.name}`
          : `${result.emoji} Found: ${result.name} — check it looks right!`
      );
    } catch {
      toast.dismiss(loadingId);
      toast.error("Lookup failed — add it manually");
      setScanHint(null);
      setShowAdd(true);
    }
  }

  async function addIngredient() {
    if (!form.name.trim()) return;
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        family_id: familyId,
        added_by: userId,
        name: form.name.trim(),
        emoji: form.emoji,
        category: form.category,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        unit: form.unit || null,
        secondary_quantity: form.secondary_quantity ? parseFloat(form.secondary_quantity) : null,
        secondary_unit: form.secondary_unit || null,
        expires_at: form.expires_at || null,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message || "Couldn't add ingredient");
      return;
    }
    setIngredients((prev) => [...prev, data]);
    setForm(emptyForm);
    setScanHint(null);
    setShowAdd(false);
    toast.success(`${form.emoji} ${form.name} added!`);
  }

  async function updateIngredient() {
    if (!editingId || !form.name.trim()) return;
    const { data, error } = await supabase
      .from("ingredients")
      .update({
        name: form.name.trim(),
        emoji: form.emoji,
        category: form.category,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        unit: form.unit || null,
        secondary_quantity: form.secondary_quantity ? parseFloat(form.secondary_quantity) : null,
        secondary_unit: form.secondary_unit || null,
        expires_at: form.expires_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId)
      .select()
      .single();

    if (error) {
      toast.error(error.message || "Couldn't update ingredient");
      return;
    }
    setIngredients((prev) => prev.map((i) => (i.id === editingId ? data : i)));
    setForm(emptyForm);
    setScanHint(null);
    setEditingId(null);
    setShowAdd(false);
    toast.success(`${form.emoji} ${form.name} updated!`);
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setScanHint(null);
    setShowAdd(true);
  }

  function openEdit(ing: Ingredient) {
    setEditingId(ing.id);
    setForm({
      name: ing.name,
      emoji: ing.emoji,
      category: ing.category,
      quantity: ing.quantity != null ? String(ing.quantity) : "",
      unit: ing.unit ?? "",
      secondary_quantity: ing.secondary_quantity != null ? String(ing.secondary_quantity) : "",
      secondary_unit: ing.secondary_unit ?? "",
      expires_at: ing.expires_at ?? "",
    });
    setScanHint(null);
    setShowAdd(true);
  }

  // Live-sync ingredients across devices/family members
  useEffect(() => {
    const channel = supabase
      .channel(`ingredients_${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingredients", filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Ingredient;
            setIngredients((prev) => (prev.some((i) => i.id === newItem.id) ? prev : [...prev, newItem]));
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Ingredient;
            setIngredients((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          } else if (payload.eventType === "DELETE") {
            const removedId = (payload.old as { id: string }).id;
            setIngredients((prev) => prev.filter((i) => i.id !== removedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  async function deleteIngredient(id: string, name: string, emoji: string) {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    if (error) { toast.error("Couldn't remove ingredient"); return; }
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    toast.success(`${emoji} ${name} removed`);
  }

  const filtered = useMemo(() => {
    return ingredients.filter((i) => {
      const matchesCategory = activeCategory === "all" || i.category === activeCategory;
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [ingredients, activeCategory, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Ingredient[]> = {};
    for (const ing of filtered) {
      if (!groups[ing.category]) groups[ing.category] = [];
      groups[ing.category].push(ing);
    }
    return groups;
  }, [filtered]);

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff < 3 * 24 * 60 * 60 * 1000; // 3 days
  };

  return (
    <div className="p-5 space-y-4">
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black">🥦 Ingredients</h1>
          <p className="text-sm text-gray-500">{ingredients.length} items tracked</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScanner(true)} className="btn-secondary" title="Scan a barcode">
            📷 Scan
          </button>
          <button onClick={openAdd} className="btn-primary">
            + Add
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        className="input"
        placeholder="🔍 Search ingredients…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
        <button
          onClick={() => setActiveCategory("all")}
          className={`flex-shrink-0 badge transition-all ${
            activeCategory === "all" ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`flex-shrink-0 badge transition-all ${
              activeCategory === c.value ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Ingredient list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-5xl mb-3">🫙</div>
          <p className="font-semibold">Nothing here yet!</p>
          <p className="text-sm mt-1">Add some ingredients to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => {
            const catMeta = CATEGORIES.find((c) => c.value === cat);
            return (
              <div key={cat}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  {catMeta?.emoji} {catMeta?.label ?? cat}
                </p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((ing) => (
                      <motion.div
                        key={ing.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => openEdit(ing)}
                        className="card px-4 py-3 flex items-center gap-3 active:scale-98 transition-transform cursor-pointer"
                      >
                        <span className="text-2xl">{ing.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{ing.name}</div>
                          {(ing.quantity || ing.unit || ing.secondary_quantity || ing.secondary_unit) && (
                            <div className="text-xs text-gray-400">
                              {ing.quantity} {ing.unit}
                              {(ing.secondary_quantity || ing.secondary_unit) && (
                                <span> · {ing.secondary_quantity} {ing.secondary_unit}</span>
                              )}
                            </div>
                          )}
                          {ing.expires_at && (
                            <div className={`text-xs font-medium mt-0.5 ${isExpiringSoon(ing.expires_at) ? "text-red-500" : "text-gray-400"}`}>
                              {isExpiringSoon(ing.expires_at) ? "⚠️ " : "📅 "}
                              Expires {new Date(ing.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteIngredient(ing.id, ing.name, ing.emoji);
                          }}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1 text-xl"
                        >
                          ×
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add ingredient sheet */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => {
                setShowAdd(false);
                setScanHint(null);
                setEditingId(null);
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 p-5 pb-10 space-y-4 max-h-[85vh] overflow-y-auto overscroll-contain"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <h2 className="text-xl font-display font-black">{editingId ? "Edit ingredient" : "Add ingredient"}</h2>

              {/* Barcode scan hint */}
              {scanHint && (
                <div
                  className={`rounded-xl px-3 py-2 text-sm ${
                    scanHint.matched ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {scanHint.matched
                    ? "📷 Matched from scan — double check before saving."
                    : `📷 Scanned "${scanHint.rawName}" — name simplified, edit if needed.`}
                </div>
              )}

              {/* Emoji & name row */}
              <div className="flex gap-3">
                <input
                  className="input !w-20 flex-shrink-0 text-2xl text-center"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                />
                <input
                  className="input flex-1"
                  placeholder="e.g. Broccoli"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Emoji suggestions */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(EMOJI_SUGGESTIONS[form.category] ?? []).map((e) => (
                  <button
                    key={e}
                    onClick={() => setForm({ ...form, emoji: e })}
                    className={`text-xl flex-shrink-0 p-1.5 rounded-lg transition-all ${
                      form.emoji === e ? "bg-purple-100 scale-110" : "hover:bg-gray-100"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setForm({ ...form, category: c.value, emoji: EMOJI_SUGGESTIONS[c.value]?.[0] ?? form.emoji })}
                      className={`badge transition-all text-sm ${
                        form.category === c.value ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & unit */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5">Quantity</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 500"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5">Unit</label>
                  <select
                    className="input"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  >
                    <option value="">—</option>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Also equals (optional secondary unit) */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5">
                    Also equals <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 6"
                    value={form.secondary_quantity}
                    onChange={(e) => setForm({ ...form, secondary_quantity: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5">&nbsp;</label>
                  <select
                    className="input"
                    value={form.secondary_unit}
                    onChange={(e) => setForm({ ...form, secondary_unit: e.target.value })}
                  >
                    <option value="">—</option>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                e.g. 1 pack also equals 6 pieces, or 1 can also equals 500g. Skip this for things like curry roux where it doesn&apos;t apply.
              </p>

              {/* Expiry */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Expiry date <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  className="input"
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>

              <button
                onClick={editingId ? updateIngredient : addIngredient}
                disabled={!form.name.trim()}
                className="btn-primary w-full"
              >
                {editingId ? `Save ${form.emoji} ${form.name || "ingredient"}` : `Add ${form.emoji} ${form.name || "ingredient"}`}
              </button>

              {editingId && (
                <button
                  onClick={() => {
                    const target = ingredients.find((i) => i.id === editingId);
                    if (target) deleteIngredient(target.id, target.name, target.emoji);
                    setShowAdd(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="w-full text-center text-sm text-red-400 font-semibold py-1"
                >
                  Remove this ingredient
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Barcode scanner */}
      {showScanner && (
        <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
