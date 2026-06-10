import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RecipesClient from "./RecipesClient";

export default async function RecipesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) redirect("/family");

  const [{ data: recipes }, { data: ingredients }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*")
      .or(`family_id.is.null,family_id.eq.${profile.family_id}`)
      .order("title"),
    supabase
      .from("ingredients")
      .select("name")
      .eq("family_id", profile.family_id),
  ]);

  return (
    <RecipesClient
      initialRecipes={recipes ?? []}
      ownedIngredientNames={(ingredients ?? []).map((i) => i.name.toLowerCase())}
      familyId={profile.family_id}
      userId={user.id}
    />
  );
}
