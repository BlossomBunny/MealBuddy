import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Recipe } from "@/lib/types";

// How many days out counts as "expiring soon" (includes already-expired items)
const EXPIRY_WINDOW_DAYS = 3;
// Max number of expiring items to surface on the home screen
const MAX_EXPIRING_ITEMS = 5;
// Max recipe suggestions shown per expiring ingredient
const MAX_RECIPE_MATCHES = 2;

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function expiryLabel(diffDays: number): string {
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`;
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}

function findRecipeMatches(ingredientName: string, recipes: Recipe[], limit: number) {
  const lower = ingredientName.toLowerCase().trim();
  const matches: { id: string; title: string; emoji: string }[] = [];
  for (const r of recipes) {
    const hit = (r.ingredients ?? []).some((ri) => {
      const riLower = ri.name.toLowerCase();
      return riLower.includes(lower) || lower.includes(riLower);
    });
    if (hit) {
      matches.push({ id: r.id, title: r.title, emoji: r.emoji });
      if (matches.length >= limit) break;
    }
  }
  return matches;
}

export default async function HomePage() {
  const supabase = createClient();
  const userId = cookies().get("mb_user")?.value;
  const user = userId ? { id: userId } : null;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, families(*)")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) redirect("/family");

  const [{ data: ingredients }, { data: cookLog }, { data: recipes }] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, name, emoji, expires_at")
      .eq("family_id", profile.family_id),
    supabase
      .from("cook_log")
      .select("id")
      .eq("family_id", profile.family_id),
    supabase
      .from("recipes")
      .select("id, title, emoji, ingredients")
      .or(`family_id.is.null,family_id.eq.${profile.family_id}`),
  ]);

  const ingredientCount = ingredients?.length ?? 0;
  const mealsCooked = cookLog?.length ?? 0;

  // Build the "Use it up!" list: anything expiring within the window, soonest first
  const expiringSoon = (ingredients ?? [])
    .filter((i) => i.expires_at)
    .map((i) => ({ ...i, diffDays: daysUntil(i.expires_at as string) }))
    .filter((i) => i.diffDays <= EXPIRY_WINDOW_DAYS)
    .sort((a, b) => a.diffDays - b.diffDays)
    .slice(0, MAX_EXPIRING_ITEMS)
    .map((i) => ({
      ...i,
      recipeMatches: findRecipeMatches(i.name, recipes ?? [], MAX_RECIPE_MATCHES),
    }));

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="pt-6 pb-2 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-purple-600 font-semibold">{greeting} 👋</p>
          <h1 className="text-3xl font-display font-black mt-0.5">
            {profile.display_name ?? "Chef"}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {profile.families?.name} · {ingredientCount} ingredients tracked
          </p>
        </div>
        <Link
          href="/profile"
          className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center overflow-hidden shrink-0 active:scale-95 transition-transform"
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="Your avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">{profile.avatar_emoji ?? "🧑‍🍳"}</span>
          )}
        </Link>
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

      {/* Use it up! — expiry nudges */}
      {expiringSoon.length > 0 && (
        <div className="card p-4 space-y-3 border-2 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⏰</span>
            <div>
              <div className="font-display font-black text-lg leading-tight">Use it up!</div>
              <div className="text-xs text-gray-500">Expiring soon — here&apos;s what you could make</div>
            </div>
          </div>
          <div className="space-y-2">
            {expiringSoon.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-3 flex items-start gap-3">
                <span className="text-2xl shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className={`text-xs font-bold mt-0.5 ${item.diffDays < 0 ? "text-red-500" : "text-amber-600"}`}>
                    {item.diffDays < 0 ? "⚠️ Expired " : "📅 Expires "}
                    {expiryLabel(item.diffDays)}
                  </div>
                  {item.recipeMatches.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {item.recipeMatches.map((r) => (
                        <Link
                          key={r.id}
                          href="/recipes"
                          className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full active:scale-95 transition-transform"
                        >
                          {r.emoji} {r.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-display font-black">What would you like to do?</h2>
        <Link href="/ingredients" className="card p-4 flex items-center gap-4 active:scale-98 transition-transform">
          <div className="text-4xl">🧅</div>
          <div>
            <div className="font-bold">Update ingredients</div>
            <div className="text-sm text-gray-500">Track what&apos;s in your fridge & pantry</div>
          </div>
          <div className="ml-auto text-purple-300 text-xl">›</div>
        </Link>
        <Link href="/recipes" className="card p-4 flex items-center gap-4 active:scale-98 transition-transform">
          <div className="text-4xl">🍳</div>
          <div>
            <div className="font-bold">Find a meal</div>
            <div className="text-sm text-gray-500">Browse recipes or hit Surprise me!</div>
          </div>
          <div className="ml-auto text-purple-300 text-xl">›</div>
        </Link>
        <Link href="/shopping" className="card p-4 flex items-center gap-4 active:scale-98 transition-transform">
          <div className="text-4xl">🛒</div>
          <div>
            <div className="font-bold">Shopping list</div>
            <div className="text-sm text-gray-500">Plan your next supermarket run</div>
          </div>
          <div className="ml-auto text-purple-300 text-xl">›</div>
        </Link>
      </div>

      {/* Invite hint */}
      <div className="bg-purple-100 rounded-2xl p-4 flex items-start gap-3">
        <div className="text-2xl">👨‍👩‍👧‍👦</div>
        <div>
          <div className="font-bold text-sm">Invite your family</div>
          <div className="text-xs text-gray-600 mt-0.5">
            Share the invite code from{" "}
            <Link href="/family" className="text-purple-700 font-bold underline">
              Family settings
            </Link>{" "}
            so everyone can pitch in!
          </div>
        </div>
      </div>
    </div>
  );
}
