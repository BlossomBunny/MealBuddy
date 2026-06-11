import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import FamilySetupClient from "./FamilySetupClient";

export default async function FamilyPage() {
  const supabase = createClient();
  const userId = cookies().get("mb_user")?.value;
  const user = userId ? { id: userId } : null;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, families(*)")
    .eq("id", user.id)
    .single();

  let members: { id: string; display_name: string | null; avatar_emoji: string | null; avatar_url: string | null }[] = [];
  if (profile?.family_id) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_emoji, avatar_url")
      .eq("family_id", profile.family_id)
      .order("created_at");
    members = data ?? [];
  }

  return <FamilySetupClient profile={profile} user={user} members={members} />;
}
