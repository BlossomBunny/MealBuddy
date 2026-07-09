// ─────────────────────────────────────────
// Database types matching the Supabase schema
// ─────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type SpecialMeal = "takeaway" | "eating_out" | "microwave" | "leftovers";
export type Difficulty = "easy" | "medium" | "hard";
export type IngredientCategory =
  | "produce"
  | "meat"
  | "dairy"
  | "pantry"
  | "frozen"
  | "bakery"
  | "other";

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  icon_emoji?: string | null;
  icon_url?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  family_id: string | null;
  display_name: string | null;
  avatar_emoji: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface Ingredient {
  id: string;
  family_id: string;
  name: string;
  emoji: string;
  category: IngredientCategory;
  quantity: number | null;
  unit: string | null;
  // Optional second way of describing the same amount of stock,
  // e.g. quantity=1/unit="pack" + secondary_quantity=6/secondary_unit="pieces"
  secondary_quantity?: number | null;
  secondary_unit?: string | null;
  expires_at: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  emoji: string;
}

export interface RecipeStep {
  step: number;
  description: string;
  tip?: string;
}

export interface Recipe {
  id: string;
  family_id: string | null;
  title: string;
  emoji: string;
  description: string | null;
  prep_time_mins: number | null;
  cook_time_mins: number | null;
  servings: number;
  difficulty: Difficulty;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  is_ai_generated: boolean;
  created_at: string;
}

// Slim recipe shape used for the meal planner (picker list + plan card display)
export type RecipeLite = Pick<
  Recipe,
  "id" | "title" | "emoji" | "description" | "prep_time_mins" | "cook_time_mins" | "servings" | "difficulty" | "tags"
>;

export interface MealPlan {
  id: string;
  family_id: string;
  recipe_id: string | null;
  planned_for: string;
  meal_type: MealType;
  servings: number;
  cooked: boolean;
  cooked_at: string | null;
  special: SpecialMeal | null;
  leftover_recipe_id: string | null;
  leftover_extra_ingredients: RecipeIngredient[] | null;
  created_at: string;
  recipe?: RecipeLite | null;
  leftover_recipe?: RecipeLite | null;
}

export interface ShoppingItem {
  id: string;
  family_id: string;
  name: string;
  emoji: string;
  category: IngredientCategory;
  quantity: number | null;
  unit: string | null;
  expires_at: string | null;
  checked: boolean;
  added_by: string | null;
  recipe_id: string | null;
  created_at: string;
}

// A monthly "staples" item — things you buy regularly, added to the
// shopping list with one tap (e.g. milk, bread, eggs)
export interface StapleItem {
  id: string;
  family_id: string;
  name: string;
  emoji: string;
  category: IngredientCategory;
  quantity: number | null;
  unit: string | null;
  created_at: string;
}

// Slim shape for a planned dinner used to auto-generate the shopping list
export interface PlannedMealForShopping {
  id: string;
  planned_for: string;
  servings: number;
  special: SpecialMeal | null;
  leftover_extra_ingredients?: RecipeIngredient[] | null;
  recipe: Pick<Recipe, "id" | "title" | "emoji" | "servings" | "ingredients"> | null;
}

export interface CookLog {
  id: string;
  family_id: string;
  user_id: string;
  recipe_id: string | null;
  recipe_title: string | null;
  cooked_at: string;
  rating: number | null;
  note: string | null;
}

// ─────────────────────────────────────────
// Ingredient category metadata
// ─────────────────────────────────────────
// ─────────────────────────────────────────
// "Not cooking tonight" options for the meal planner
// ─────────────────────────────────────────
export const SPECIAL_MEALS: {
  value: SpecialMeal;
  label: string;
  emoji: string;
}[] = [
  { value: "takeaway", label: "Takeaway", emoji: "🥡" },
  { value: "eating_out", label: "Eating Out", emoji: "🍽️" },
  { value: "microwave", label: "Microwave Meal", emoji: "🍱" },
  { value: "leftovers", label: "Leftovers", emoji: "♻️" },
];

// Units offered when adding/editing an ingredient's quantity
export const UNITS = [
  "g",
  "kg",
  "ml",
  "L",
  "tbsp",
  "tsp",
  "cups",
  "pieces",
  "pcs",
  "bunch",
  "tin",
  "can",
  "pack",
  "bag",
  "box",
];

// ─────────────────────────────────────────
// Staple ingredients — spices, seasonings, oils, etc.
// These are binary: you either have them or you don't.
// Quantities are meaningless for pantry staples.
// ─────────────────────────────────────────
export const STAPLE_KEYWORDS = [
  "salt", "pepper", "oil", "butter", "vinegar",
  "soy sauce", "fish sauce", "worcestershire", "oyster sauce", "hot sauce", "sriracha",
  "flour", "sugar", "brown sugar", "icing sugar", "baking powder", "baking soda",
  "cornstarch", "cornflour", "cocoa",
  "thyme", "oregano", "basil", "rosemary", "sage", "parsley", "cilantro", "coriander",
  "cumin", "paprika", "chilli", "chili", "cayenne", "turmeric", "ginger powder",
  "garlic powder", "onion powder", "cinnamon", "nutmeg", "cloves", "bay leaves",
  "bay leaf", "sesame seeds", "mixed herbs", "dried herbs", "stock cube",
  "mustard", "honey", "maple syrup", "tahini", "miso", "sesame oil", "olive oil",
  "vegetable oil", "sunflower oil", "coconut oil", "cooking spray",
  "stock", "broth",
];

export function isStaple(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return STAPLE_KEYWORDS.some((k) => lower.includes(k));
}

// Strip preparation instructions from ingredient names so they're clean for
// shopping lists and pantry storage.
// "carrots (peeled and diced small)"  →  "carrots"
// "chicken breast, sliced"            →  "chicken breast"
// "plant-based chicken pieces (shredded)" → "plant-based chicken pieces"
const PREP_SUFFIX_RE =
  /,\s*(peeled|diced|sliced|chopped|minced|grated|shredded|crushed|trimmed|halved|quartered|cubed|coarsely|finely|thinly|roughly|softened|melted|dried|rinsed|drained|cooked|blended|beaten|whisked|sifted).*/i;

export function cleanIngredientName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)/g, "")   // remove (anything in parentheses)
    .replace(PREP_SUFFIX_RE, "")     // remove ", chopped" style suffixes
    .trim()
    .replace(/\s+/g, " ");
}

export const CATEGORIES: {
  value: IngredientCategory;
  label: string;
  emoji: string;
}[] = [
  { value: "produce", label: "Produce", emoji: "🥦" },
  { value: "meat", label: "Meat & Fish", emoji: "🥩" },
  { value: "dairy", label: "Dairy & Eggs", emoji: "🥛" },
  { value: "pantry", label: "Pantry", emoji: "🫙" },
  { value: "frozen", label: "Frozen", emoji: "🧊" },
  { value: "bakery", label: "Bakery", emoji: "🍞" },
  { value: "other", label: "Other", emoji: "🛒" },
];

// ─────────────────────────────────────────
// Ingredient substitutes
// ─────────────────────────────────────────

export interface Substitute {
  ingredient: string;   // what the recipe calls for
  substitute: string;   // what you have instead
}

/** Default substitute pairs that get auto-seeded for every family. */
export const DEFAULT_SUBSTITUTES: Substitute[] = [
  // Plant-based protein swaps
  { ingredient: "chicken breast",  substitute: "plant-based chicken" },
  { ingredient: "chicken thigh",   substitute: "plant-based chicken" },
  { ingredient: "chicken",         substitute: "plant-based chicken" },
  { ingredient: "beef mince",      substitute: "plant-based mince" },
  { ingredient: "pork mince",      substitute: "plant-based mince" },
  { ingredient: "minced beef",     substitute: "plant-based mince" },
  { ingredient: "ground beef",     substitute: "plant-based mince" },
  // Sweetener swaps
  { ingredient: "honey",           substitute: "golden syrup" },
  { ingredient: "honey",           substitute: "maple syrup" },
  { ingredient: "maple syrup",     substitute: "golden syrup" },
  // Dairy swaps
  { ingredient: "butter",          substitute: "coconut oil" },
  { ingredient: "butter",          substitute: "olive oil" },
  { ingredient: "milk",            substitute: "oat milk" },
  { ingredient: "milk",            substitute: "almond milk" },
  { ingredient: "milk",            substitute: "soy milk" },
  { ingredient: "cream",           substitute: "coconut cream" },
  { ingredient: "heavy cream",     substitute: "coconut cream" },
  // Flour / starch
  { ingredient: "plain flour",     substitute: "gluten-free flour" },
  { ingredient: "flour",           substitute: "gluten-free flour" },
  { ingredient: "cornstarch",      substitute: "cornflour" },
  { ingredient: "cornflour",       substitute: "cornstarch" },
  // Sauce swaps
  { ingredient: "soy sauce",       substitute: "tamari" },
  { ingredient: "fish sauce",      substitute: "soy sauce" },
  { ingredient: "oyster sauce",    substitute: "hoisin sauce" },
  // Other
  { ingredient: "lemon juice",     substitute: "lime juice" },
  { ingredient: "lime juice",      substitute: "lemon juice" },
  { ingredient: "spring onion",    substitute: "chives" },
  { ingredient: "scallion",        substitute: "spring onion" },
  { ingredient: "coriander",       substitute: "parsley" },
  { ingredient: "cilantro",        substitute: "parsley" },
];

// Common emoji suggestions per category (used by Add Ingredient form
// and as a fallback when guessing an emoji for a scanned product)
export const EMOJI_SUGGESTIONS: Record<IngredientCategory, string[]> = {
  produce: ["🥦", "🥕", "🍅", "🧅", "🧄", "🥔", "🍋", "🍎", "🫑", "🥒", "🌽", "🥬"],
  meat: ["🥩", "🍗", "🥓", "🐟", "🍤", "🦐", "🥚"],
  dairy: ["🥛", "🧀", "🧈", "🫙"],
  pantry: ["🫙", "🌾", "🍚", "🍝", "🥫", "🫒", "🧂", "🌶️", "🧄"],
  frozen: ["🧊", "🍦", "🥶"],
  bakery: ["🍞", "🥖", "🥐", "🫓"],
  other: ["🛒", "🥤", "🧃", "☕"],
};
