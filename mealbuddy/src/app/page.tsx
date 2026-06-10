import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, families(*)")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) redirect("/family");

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id")
    .eq("family_id", profile.family_id);

  const { data: cookLog } = await supabase
    .from("cook_log")
    .select("id")
    .eq("family_id", profile.family_id);

  const ingredientCount = ingredients?.length ?? 0;
  const mealsCooked = cookLog?.length ?? 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="pt-6 pb-2">
        <p className="text-purple-600 font-semibold">{greeting} 👋</p>
        <h1 className="text-3xl font-display font-black mt-0.5">
          {profile.display_name ?? "Chef"}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {profile.families?.name} · {ingredientCount} ingredients tracked
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">🥘</div>
          <div className="text-2xl font-display font-black text-purple-600">
            {mealsCooked}
          </div>
          <div className="text-xs text-gray-500 font-medium">meals cooked</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">🥦</div>
          <div className="text-2xl font-display font-black text-purple-600">
            {ingredientCount}
          </div>
          <div className="text-xs text-gray-500 font-medium">in the fridge</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-display font-black">What would you like to do?</h2>
        <Link href="/ingredients" className="card p-4 flex items-center gap-4 active:scale-98 transition-transform">
          <div className="text-4xl">🧅</div>
          <div>
            <div className="font-bold">Update ingredients</div>
            <div className="text-sm text-gray-500">Track what&apos;s in your fridge & pantry</div>
          </div>
          <div className="ml-auto text-purple-700 text-xl">›</div>
        </Link>
        <Link href="/recipes" className="card p-4 flex items-center gap-4 active:scale-98 transition-transform">
          <div className="text-4xl">🍳</div>
          <div>
            <div className="font-bold">Find a meal</div>
            <div className="text-sm text-gray-500">Browse recipes or get an AI surprise</div>
          </div>
          <div className="ml-auto text-purple-700 text-xl">›</div>
        </Link>
        <Link href="/shopping" className="card p-4 flex items-center gap-4 active:scale-98 transition-transform">
          <div className="text-4xl">🛒</div>
          <div>
            <div className="font-bold">Shopping list</div>
            <div className="text-sm text-gray-500">Plan your next supermarket run</div>
          </div>
          <div className="ml-auto text-purple-700 text-xl">›</div>
        </Link>
      </div>

      {/* Invite hint */}
      <div className="bg-purple-100 rounded-2xl p-4 flex items-start gap-3">
        <div className="text-2xl">👨‍👩‍👧‍👦</div>
        <div>
          <div className="font-bold text-sm">Invite your family</div>
          <div className="text-xs text-gray-600 mt-0.5">
            Share the invite code from{" "}
            <Link href="/family" className="text-purple-600 font-bold underline">
              Family settings
            </Link>{" "}
            so everyone can pitch in!
          </div>
        </div>
      </div>
    </div>
  );
}
