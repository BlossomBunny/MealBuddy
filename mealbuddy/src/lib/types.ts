// ─────────────────────────────────────────
// Database types matching the Supabase schema
// ─────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type SpecialMeal = "takeaway" | "eating_out" | "microwave";
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
  created_at: string;
  recipe?: RecipeLite | null;
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
];

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
