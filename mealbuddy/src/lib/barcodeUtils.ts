import type { IngredientCategory } from "./types";
import { EMOJI_SUGGESTIONS } from "./types";

// ─────────────────────────────────────────
// Barcode lookup + "basic name" matching
//
// Scanned products from Open Food Facts come back with verbose,
// brand-heavy names (e.g. "Heinz Tomato Ketchup 460g"). Recipes use
// short "basic" ingredient names (e.g. "ketchup"). This module tries
// to match a scanned product to one of those basic names so it lines
// up with recipe ingredient lists, falling back to a cleaned-up
// version of the product name when nothing matches.
// ─────────────────────────────────────────

// Common basic ingredient names used across the recipe library.
// Longer/more specific entries are preferred when multiple match.
export const BASIC_INGREDIENT_NAMES = [
  "basmati rice", "brown rice", "white rice", "rice",
  "self-raising flour", "plain flour", "flour",
  "spaghetti", "penne", "macaroni", "lasagne", "pasta",
  "caster sugar", "brown sugar", "granulated sugar", "icing sugar", "sugar",
  "salt", "black pepper", "pepper",
  "olive oil", "vegetable oil", "sunflower oil", "oil",
  "butter", "milk", "double cream", "single cream", "cream",
  "cheddar cheese", "mozzarella", "parmesan", "cream cheese", "cheese",
  "natural yogurt", "greek yogurt", "yogurt", "yoghurt",
  "eggs", "egg",
  "white bread", "wholemeal bread", "bread", "tortilla wraps", "pitta bread", "bagels",
  "ketchup", "mayonnaise", "mustard", "soy sauce", "worcestershire sauce",
  "balsamic vinegar", "vinegar",
  "chicken stock", "beef stock", "vegetable stock", "stock cubes", "stock",
  "tomato puree", "passata", "chopped tomatoes", "tomatoes", "tomato",
  "baked beans", "kidney beans", "butter beans", "chickpeas", "lentils", "beans",
  "tuna", "salmon", "prawns", "cod",
  "chicken breast", "chicken thighs", "chicken",
  "beef mince", "minced beef", "steak", "beef",
  "pork chops", "pork", "bacon", "sausages", "ham",
  "spring onion", "red onion", "onion", "garlic", "ginger",
  "sweet potato", "potatoes", "potato", "carrots", "carrot", "broccoli",
  "bell pepper", "peppers",
  "mushrooms", "mushroom", "spinach", "lettuce", "cucumber", "courgette", "aubergine",
  "lemon", "lime", "avocado", "bananas", "apples",
  "frozen peas", "frozen sweetcorn", "frozen chips", "peas", "sweetcorn",
  "baking powder", "baking soda", "vanilla extract",
  "cinnamon", "paprika", "cumin", "oregano", "basil", "chilli flakes", "curry powder",
  "honey", "peanut butter", "jam", "nutella",
  "cereal", "porridge oats", "oats", "granola",
  "coffee", "tea bags", "orange juice",
  "coconut milk", "breadcrumbs", "noodles",
  "pizza base", "garlic bread", "ice cream",
];

// Quick keyword -> emoji lookups for common items (checked before the
// generic category fallback)
const ITEM_EMOJI: Record<string, string> = {
  rice: "🍚",
  pasta: "🍝", spaghetti: "🍝", penne: "🍝", macaroni: "🍝", noodles: "🍜",
  flour: "🌾", sugar: "🧂", salt: "🧂", "black pepper": "🧂", pepper: "🫑",
  milk: "🥛", cheese: "🧀", butter: "🧈", cream: "🥛",
  yogurt: "🥄", yoghurt: "🥄",
  egg: "🥚",
  bread: "🍞", bagel: "🥯", wrap: "🌯", pitta: "🫓",
  ketchup: "🍅", tomato: "🍅", passata: "🍅",
  mayonnaise: "🥚", mustard: "🌭", "soy sauce": "🍶", vinegar: "🍶",
  stock: "🍲",
  beans: "🫘", chickpeas: "🫘", lentils: "🫘",
  tuna: "🐟", salmon: "🐟", cod: "🐟", prawns: "🍤",
  chicken: "🍗", bacon: "🥓", sausages: "🌭", ham: "🍖",
  beef: "🥩", mince: "🥩", steak: "🥩", pork: "🥩",
  onion: "🧅", garlic: "🧄", ginger: "🫚",
  potato: "🥔", carrot: "🥕", broccoli: "🥦",
  mushroom: "🍄", spinach: "🥬", lettuce: "🥬", cucumber: "🥒",
  courgette: "🥒", aubergine: "🍆",
  lemon: "🍋", lime: "🍋", avocado: "🥑", banana: "🍌", apple: "🍎",
  peas: "🟢", sweetcorn: "🌽",
  honey: "🍯", "peanut butter": "🥜", jam: "🍓", nutella: "🍫",
  cereal: "🥣", oats: "🥣", granola: "🥣",
  coffee: "☕", tea: "🍵", "orange juice": "🧃",
  "coconut milk": "🥥", breadcrumbs: "🍞",
  pizza: "🍕", "ice cream": "🍦",
};

// Keyword groups used to guess an ingredient category from the
// product name / Open Food Facts category tags
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  dairy: ["milk", "cheese", "yogurt", "yoghurt", "butter", "cream", "dairy"],
  meat: [
    "chicken", "beef", "pork", "lamb", "bacon", "sausage", "mince", "fish",
    "salmon", "tuna", "prawn", "turkey", "ham", "meat", "cod",
  ],
  produce: [
    "fresh-produce", "fruit", "vegetable", "salad", "tomato", "onion", "potato",
    "carrot", "fruits", "vegetables", "lettuce", "cucumber", "pepper",
  ],
  frozen: ["frozen"],
  bakery: ["bread", "bakery", "cake", "pastry", "baguette", "roll", "bagel"],
  pantry: [
    "pasta", "rice", "sauce", "tin", "can", "cereal", "snack", "biscuit",
    "condiment", "spice", "oil", "flour", "sugar", "stock", "noodle",
  ],
  other: [],
};

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizeUnit(u: string): string {
  const lower = u.toLowerCase();
  if (lower === "l") return "L";
  if (lower === "kg") return "kg";
  if (lower === "ml") return "ml";
  if (lower === "g") return "g";
  return lower;
}

/**
 * Try to match a scanned product name against the curated list of
 * "basic" recipe ingredient names. Returns the longest matching
 * basic name, or null if nothing matches.
 */
export function matchBasicName(productName: string): string | null {
  const lower = productName.toLowerCase();
  let best: string | null = null;
  for (const candidate of BASIC_INGREDIENT_NAMES) {
    if (lower.includes(candidate)) {
      if (!best || candidate.length > best.length) best = candidate;
    }
  }
  return best;
}

/**
 * Fallback for products that don't match a known basic ingredient:
 * strip the leading brand name and any trailing pack-size info
 * (e.g. "Heinz Tomato Ketchup 460g" -> "Tomato Ketchup").
 */
export function cleanProductName(productName: string, brands?: string): string {
  let name = productName.trim();

  if (brands) {
    const firstBrand = brands.split(",")[0]?.trim();
    if (firstBrand && name.toLowerCase().startsWith(firstBrand.toLowerCase())) {
      name = name.slice(firstBrand.length).trim();
    }
  }

  // Strip trailing size/weight info, e.g. "460g", "1L", "6 x 330ml", "(400g)"
  name = name
    .replace(/[\(\[]?\d+(?:[.,]\d+)?\s*(x\s*\d+(?:[.,]\d+)?\s*)?(kg|g|ml|l|cl)\)?\]?\s*$/i, "")
    .trim();

  // Strip trailing dashes/commas left over from stripping
  name = name.replace(/[-,]\s*$/, "").trim();

  return name || productName.trim();
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface QuantityInput {
  quantity?: string;
  product_quantity?: string;
  product_quantity_unit?: string;
}

/**
 * Parse Open Food Facts quantity info into a number + unit matching
 * this app's unit options (g, kg, ml, L). Handles multipacks like
 * "6 x 330ml" by returning the total volume/weight.
 */
export function parseQuantity(off: QuantityInput): { quantity: number | null; unit: string | null } {
  const qStr = off.quantity?.trim();

  if (qStr) {
    // Multipack, e.g. "6 x 330ml" or "6x330ml"
    const multi = qStr.match(/(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl)/i);
    if (multi) {
      const count = parseFloat(multi[1]);
      const size = parseFloat(multi[2].replace(",", "."));
      const unitRaw = multi[3].toLowerCase();
      const total = unitRaw === "cl" ? count * size * 10 : count * size;
      return { quantity: round(total), unit: unitRaw === "cl" ? "ml" : normalizeUnit(unitRaw) };
    }

    // Single value, e.g. "500 g", "1L", "1kg"
    const single = qStr.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl)/i);
    if (single) {
      const val = parseFloat(single[1].replace(",", "."));
      const unitRaw = single[2].toLowerCase();
      if (unitRaw === "cl") return { quantity: round(val * 10), unit: "ml" };
      return { quantity: round(val), unit: normalizeUnit(unitRaw) };
    }
  }

  // Fallback: numeric product_quantity (usually grams or ml)
  if (off.product_quantity) {
    const val = parseFloat(off.product_quantity);
    if (!isNaN(val)) {
      const unit = off.product_quantity_unit ? normalizeUnit(off.product_quantity_unit) : "g";
      return { quantity: round(val), unit };
    }
  }

  return { quantity: null, unit: null };
}

/**
 * Guess an ingredient category from the product name and Open Food
 * Facts category tags.
 */
export function guessCategory(productName: string, categoriesTags: string[] = []): IngredientCategory {
  const haystack = (productName + " " + categoriesTags.join(" ")).toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [IngredientCategory, string[]][]) {
    if (keywords.some((k) => haystack.includes(k))) return cat;
  }
  return "pantry";
}

/**
 * Guess an emoji for an ingredient, preferring a specific item match
 * and falling back to the category's default emoji.
 */
export function guessEmoji(name: string, category: IngredientCategory): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(ITEM_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return EMOJI_SUGGESTIONS[category]?.[0] ?? "🛒";
}

export interface ScannedProduct {
  /** Suggested name — either a matched "basic" name or a cleaned-up product name */
  name: string;
  emoji: string;
  category: IngredientCategory;
  quantity: number | null;
  unit: string | null;
  /** True if `name` was matched against the basic ingredient dictionary */
  matched: boolean;
  /** The raw product name as returned by Open Food Facts */
  rawName: string;
}

/**
 * Look up a barcode via the (free, keyless) Open Food Facts API and
 * turn the result into a pre-fill suggestion for the Add Ingredient
 * form. Returns null if the product isn't found or the request fails.
 */
export async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,quantity,categories_tags,product_quantity,product_quantity_unit`
  );
  if (!res.ok) return null;

  const data = await res.json();
  if (data?.status !== 1 || !data.product?.product_name) return null;

  const product = data.product;
  const rawName: string = product.product_name;

  const basicMatch = matchBasicName(rawName);
  const name = basicMatch ? toTitleCase(basicMatch) : cleanProductName(rawName, product.brands);
  const category = guessCategory(rawName, product.categories_tags ?? []);
  const emoji = guessEmoji(basicMatch ?? name, category);
  const { quantity, unit } = parseQuantity({
    quantity: product.quantity,
    product_quantity: product.product_quantity,
    product_quantity_unit: product.product_quantity_unit,
  });

  return { name, emoji, category, quantity, unit, matched: !!basicMatch, rawName };
}
