"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { ShoppingItem } from "@/lib/types";

interface Props {
  initialItems: ShoppingItem[];
  familyId: string;
  userId: string;
}

const QUICK_ADD = [
  ["🥛", "Milk"], ["🍞", "Bread"], ["🥚", "Eggs"], ["🧈", "Butter"],
  ["🧀", "Cheese"], ["🥩", "Chicken"], ["🍅", "Tomatoes"], ["🥦", "Broccoli"],
];

export default function ShoppingClient({ initialItems, familyId, userId }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [newItem, setNewItem] = useState("");
  const [newEmoji, setNewEmoji] = useState("🛒");
  const [loading, setLoading] = useState<string | null>(null);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  async function addItem(name?: string, emoji?: string) {
    const itemName = (name ?? newItem).trim();
    if (!itemName) return;
    const itemEmoji = emoji ?? newEmoji;

    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        family_id: familyId,
        added_by: userId,
        name: itemName,
        emoji: itemEmoji,
      })
      .select()
      .single();

    if (error) { toast.error("Couldn't add item"); return; }
    setItems((prev) => [data, ...prev]);
    if (!name) { setNewItem(""); setNewEmoji("🛒"); }
  }

  async function toggleItem(id: string, checked: boolean) {
    setLoading(id);
    const { error } = await supabase
      .from("shopping_items")
      .update({ checked })
      .eq("id", id);
    if (!error) {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked } : i));
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

      {/* Add item input */}
      <div className="card p-3 flex gap-2">
        <input
          className="w-14 text-2xl text-center border-2 border-orange-100 rounded-xl focus:border-orange-400 focus:outline-none"
          value={newEmoji}
          onChange={(e) => setNewEmoji(e.target.value)}
          placeholder="🛒"
        />
        <input
          className="flex-1 border-2 border-orange-100 rounded-xl px-3 py-2 focus:border-orange-400 focus:outline-none font-medium"
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

      {/* Quick add suggestions */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
        {QUICK_ADD.map(([emoji, name]) => (
          <button
            key={name}
            onClick={() => addItem(name, emoji)}
            className="flex-shrink-0 bg-white border-2 border-orange-100 rounded-xl px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 hover:bg-orange-50 transition-colors"
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
                      className="w-6 h-6 rounded-full border-2 border-orange-300 flex-shrink-0 transition-all hover:border-orange-500"
                    />
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="flex-1 font-medium">{item.name}</span>
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
                  Got it ✓ ({checked.length})
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
                      className="w-6 h-6 rounded-full bg-orange-400 flex-shrink-0 flex items-center justify-center text-white text-xs"
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
