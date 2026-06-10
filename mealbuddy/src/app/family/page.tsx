import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilySetupClient from "./FamilySetupClient";

export default async function FamilyPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, families(*)")
    .eq("id", user.id)
    .single();

  return <FamilySetupClient profile={profile} user={user} />;
}
