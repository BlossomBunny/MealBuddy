import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import IngredientsClient from "./IngredientsClient";

export default async function IngredientsPage() {
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

  const [{ data: ingredients }, { data: substitutes }] = await Promise.all([
    supabase
      .from("ingredients")
      .select("*")
      .eq("family_id", profile.family_id)
      .order("category")
      .order("name"),
    supabase
      .from("family_substitutes")
      .select("id, ingredient, substitute")
      .eq("family_id", profile.family_id)
      .order("ingredient"),
  ]);

  return (
    <IngredientsClient
      initialIngredients={ingredients ?? []}
      initialSubstitutes={substitutes ?? []}
      familyId={profile.family_id}
      userId={user.id}
    />
  );
}
