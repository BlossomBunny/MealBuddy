import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import PlannerClient from "./PlannerClient";

const RECIPE_FIELDS =
  "id, title, emoji, description, prep_time_mins, cook_time_mins, servings, difficulty, tags";

const MEAL_PLAN_SELECT = `*, recipe:recipes(${RECIPE_FIELDS}), leftover_recipe:recipes!meal_plan_leftover_recipe_id_fkey(${RECIPE_FIELDS})`;

// Returns the ISO (YYYY-MM-DD) dates for this Monday through Sunday
function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun ... 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default async function PlannerPage() {
  const supabase = createClient();
  const userId = cookies().get("mb_user")?.value;
  const user = userId ? { id: userId } : null;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) redirect("/family");

  const weekDates = getWeekDates();

  const [{ data: mealPlans }, { data: recipes }, { data: ingredients }, { data: family }] = await Promise.all([
    supabase
      .from("meal_plan")
      .select(MEAL_PLAN_SELECT)
      .eq("family_id", profile.family_id)
      .gte("planned_for", weekDates[0])
      .lte("planned_for", weekDates[6]),
    supabase
      .from("recipes")
      .select(RECIPE_FIELDS)
      .or(`family_id.is.null,family_id.eq.${profile.family_id}`)
      .order("title"),
    supabase
      .from("ingredients")
      .select("id, name, quantity, unit, secondary_quantity, secondary_unit")
      .eq("family_id", profile.family_id),
    supabase
      .from("families")
      .select("active_meal_slots")
      .eq("id", profile.family_id)
      .single(),
  ]);

  const activeSlots: string[] =
    (family as any)?.active_meal_slots ?? ["breakfast", "lunch", "dinner"];

  return (
    <PlannerClient
      weekDates={weekDates}
      initialMealPlans={(mealPlans as any) ?? []}
      recipes={recipes ?? []}
      ownedIngredients={ingredients ?? []}
      familyId={profile.family_id}
      initialActiveSlots={activeSlots}
    />
  );
}
