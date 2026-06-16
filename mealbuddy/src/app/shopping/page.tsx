import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ShoppingClient from "./ShoppingClient";

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

export default async function ShoppingPage() {
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

  const [{ data: items }, { data: mealPlans }, { data: ingredients }] = await Promise.all([
    supabase
      .from("shopping_items")
      .select("*")
      .eq("family_id", profile.family_id)
      .order("checked")
      .order("created_at", { ascending: false }),
    supabase
      .from("meal_plan")
      .select("id, planned_for, servings, special, leftover_extra_ingredients, recipe:recipes(id, title, emoji, servings, ingredients)")
      .eq("family_id", profile.family_id)
      .gte("planned_for", weekDates[0])
      .lte("planned_for", weekDates[6])
      .or("recipe_id.not.is.null,special.eq.leftovers"),
    supabase
      .from("ingredients")
      .select("id, name, quantity, unit")
      .eq("family_id", profile.family_id),
  ]);

  return (
    <ShoppingClient
      initialItems={items ?? []}
      mealPlans={(mealPlans as any) ?? []}
      pantryIngredients={ingredients ?? []}
      familyId={profile.family_id}
      userId={user.id}
    />
  );
}
