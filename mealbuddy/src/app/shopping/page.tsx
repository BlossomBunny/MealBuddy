import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ShoppingClient from "./ShoppingClient";

export default async function ShoppingPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) redirect("/family");

  const { data: items } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("checked")
    .order("created_at", { ascending: false });

  return (
    <ShoppingClient
      initialItems={items ?? []}
      familyId={profile.family_id}
      userId={user.id}
    />
  );
}
