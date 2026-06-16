import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import RecipesClient from "./RecipesClient";

export default async function RecipesPage() {
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

  const [{ data: recipes }, { data: ingredients }, { count: memberCount }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*")
      .or(`family_id.is.null,family_id.eq.${profile.family_id}`)
      .order("title"),
    supabase
      .from("ingredients")
      .select("id, name, quantity, unit, secondary_quantity, secondary_unit")
      .eq("family_id", profile.family_id),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("family_id", profile.family_id),
  ]);

  const familySize = Math.max(1, memberCount ?? 2);

  return (
    <RecipesClient
      initialRecipes={recipes ?? []}
      ownedIngredientNames={(ingredients ?? []).map((i) => i.name.toLowerCase())}
      ownedIngredients={ingredients ?? []}
      familyId={profile.family_id}
      userId={user.id}
      familySize={familySize}
    />
  );
}
