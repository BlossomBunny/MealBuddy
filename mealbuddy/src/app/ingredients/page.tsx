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

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("category")
    .order("name");

  return (
    <IngredientsClient
      initialIngredients={ingredients ?? []}
      familyId={profile.family_id}
      userId={user.id}
    />
  );
}
