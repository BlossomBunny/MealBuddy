import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilySetupClient from "./FamilySetupClient";

export default async function FamilyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, families(*)")
    .eq("id", user.id)
    .single();

  return <FamilySetupClient profile={profile} user={user} />;
}
