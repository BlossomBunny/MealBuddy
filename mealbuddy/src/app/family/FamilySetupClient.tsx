"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

const AVATAR_OPTIONS = ["🧑‍🍳", "👩‍🍳", "👨‍🍳", "🧒", "👧", "🧑", "👦", "🧓", "👩", "👨"];

export default function FamilySetupClient({
  profile,
  user,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  user: { id: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [avatar, setAvatar] = useState(profile?.avatar_emoji ?? "🧑‍🍳");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"create" | "join">("create");

  const hasFamily = !!profile?.family_id;
  const family = profile?.families;

  async function createFamily() {
    if (!familyName.trim()) return;
    setLoading(true);
    try {
      // Create family
      const { data: fam, error: famErr } = await supabase
        .from("families")
        .insert({ name: familyName.trim() })
        .select()
        .single();
      if (famErr) throw famErr;

      // Update profile with family
      await supabase
        .from("profiles")
        .update({ family_id: fam.id, avatar_emoji: avatar })
        .eq("id", user.id);

      toast.success(`Family "${fam.name}" created! 🎉`);
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create family");
    } finally {
      setLoading(false);
    }
  }

  async function joinFamily() {
    if (!inviteCode.trim()) return;
    setLoading(true);
    try {
      const { data: fam, error } = await supabase
        .from("families")
        .select()
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .single();
      if (error || !fam) throw new Error("Invalid invite code. Check with your family!");

      await supabase
        .from("profiles")
        .update({ family_id: fam.id, avatar_emoji: avatar })
        .eq("id", user.id);

      toast.success(`Joined "${fam.name}"! 🥳`);
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't join family");
    } finally {
      setLoading(false);
    }
  }

  if (hasFamily && family) {
    return (
      <div className="p-5">
        <div className="card p-5 text-center">
          <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-purple-50 flex items-center justify-center overflow-hidden">
            {family.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={family.icon_url} alt={family.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">{family.icon_emoji ?? "👨‍👩‍👧‍👦"}</span>
            )}
          </div>
          <h1 className="text-2xl font-display font-black">{family.name}</h1>
          <p className="text-gray-500 mt-1 text-sm">Your family group</p>
          <div className="mt-5 bg-purple-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-500 mb-1">
              Invite code — share with family!
            </p>
            <p className="text-3xl font-display font-black tracking-widest text-purple-600">
              {family.invite_code}
            </p>
          </div>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(family.invite_code);
              toast.success("Invite code copied! 📋");
            }}
            className="btn-secondary mt-3 w-full"
          >
            Copy invite code
          </button>
          <Link href="/profile" className="btn-secondary mt-3 w-full block">
            ⚙️ Edit avatar & family icon
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">👨‍👩‍👧‍👦</div>
        <h1 className="text-2xl font-display font-black">Set up your family</h1>
        <p className="text-gray-500 text-sm mt-1">
          Create a family group or join one with an invite code
        </p>
      </div>

      {/* Avatar picker */}
      <div className="card p-4 mb-4">
        <p className="text-sm font-semibold mb-3">Pick your avatar</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`text-2xl p-2 rounded-xl transition-all ${
                avatar === a
                  ? "bg-purple-600 scale-110 shadow-md"
                  : "bg-purple-50 hover:bg-purple-100"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("create")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === "create"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-gray-500 border-2 border-gray-100"
          }`}
        >
          Create family
        </button>
        <button
          onClick={() => setTab("join")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === "join"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-gray-500 border-2 border-gray-100"
          }`}
        >
          Join family
        </button>
      </div>

      <div className="card p-4">
        {tab === "create" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Family name
              </label>
              <input
                className="input"
                placeholder="e.g. The Smiths, Casa Garcia…"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
              />
            </div>
            <button
              onClick={createFamily}
              disabled={loading || !familyName.trim()}
              className="btn-primary w-full"
            >
              {loading ? "Creating…" : "Create our family 🚀"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Invite code
              </label>
              <input
                className="input uppercase tracking-widest font-bold text-center text-xl"
                placeholder="ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                maxLength={6}
              />
              <p className="text-xs text-gray-400 mt-1">
                Ask a family member for their 6-letter code
              </p>
            </div>
            <button
              onClick={joinFamily}
              disabled={loading || inviteCode.length < 6}
              className="btn-primary w-full"
            >
              {loading ? "Joining…" : "Join family 🏡"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
