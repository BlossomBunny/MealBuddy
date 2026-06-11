"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

const AVATAR_OPTIONS = ["🧑‍🍳", "👩‍🍳", "👨‍🍳", "🧒", "👧", "🧑", "👦", "🧓", "👩", "👨"];
const FAMILY_ICON_OPTIONS = ["👨‍👩‍👧‍👦", "👨‍👩‍👧", "👨‍👩‍👦", "👩‍👩‍👧‍👦", "👨‍👨‍👧‍👦", "🏡", "🦊", "🐻", "🐶", "🐱", "🌟", "🌈"];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfileClient({
  profile,
  user,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  user: { id: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const family = profile?.families;

  const [avatarEmoji, setAvatarEmoji] = useState<string>(profile?.avatar_emoji ?? "🧑‍🍳");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [familyIconEmoji, setFamilyIconEmoji] = useState<string>(family?.icon_emoji ?? "👨‍👩‍👧‍👦");
  const [familyIconUrl, setFamilyIconUrl] = useState<string | null>(family?.icon_url ?? null);
  const [uploading, setUploading] = useState<"avatar" | "family" | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const familyInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) throw error;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // bust cache so the new image shows immediately
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("That image is too big — try one under 5MB.");
      return;
    }
    setUploading("avatar");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `profiles/${user.id}/avatar.${ext}`;
      const url = await uploadImage(file, path);
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (error) throw error;
      setAvatarUrl(url);
      toast.success("Avatar updated! 📸");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function pickAvatarEmoji(emoji: string) {
    setAvatarEmoji(emoji);
    setAvatarUrl(null);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_emoji: emoji, avatar_url: null })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Avatar updated! 🎉");
    router.refresh();
  }

  async function handleFamilyIconFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !family) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("That image is too big — try one under 5MB.");
      return;
    }
    setUploading("family");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `families/${family.id}/icon.${ext}`;
      const url = await uploadImage(file, path);
      const { error } = await supabase.from("families").update({ icon_url: url }).eq("id", family.id);
      if (error) throw error;
      setFamilyIconUrl(url);
      toast.success("Family icon updated! 🖼️");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      if (familyInputRef.current) familyInputRef.current.value = "";
    }
  }

  async function pickFamilyIconEmoji(emoji: string) {
    if (!family) return;
    setFamilyIconEmoji(emoji);
    setFamilyIconUrl(null);
    const { error } = await supabase
      .from("families")
      .update({ icon_emoji: emoji, icon_url: null })
      .eq("id", family.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Family icon updated! 🎉");
    router.refresh();
  }

  return (
    <div className="p-5 space-y-5 pb-10">
      <div className="pt-4">
        <h1 className="text-2xl font-display font-black">⚙️ Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {profile?.display_name ?? "Chef"}
          {family ? ` · ${family.name}` : ""}
        </p>
      </div>

      {/* Avatar section */}
      <div className="card p-4">
        <p className="font-display font-black mb-3">Your avatar</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Your avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">{avatarEmoji}</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading === "avatar"}
              className="btn-secondary w-full text-sm"
            >
              {uploading === "avatar" ? "Uploading…" : "📷 Upload photo"}
            </button>
            {avatarUrl && (
              <button
                onClick={() => pickAvatarEmoji(avatarEmoji)}
                className="w-full text-xs text-gray-400 underline"
              >
                Remove photo, use emoji instead
              </button>
            )}
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-500 mb-2">Or pick an emoji avatar</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => pickAvatarEmoji(a)}
              className={`text-2xl p-2 rounded-xl transition-all ${
                !avatarUrl && avatarEmoji === a
                  ? "bg-purple-600 scale-110 shadow-md"
                  : "bg-purple-50 hover:bg-purple-100"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Family icon section */}
      {family ? (
        <div className="card p-4">
          <p className="font-display font-black mb-3">Family icon</p>
          <p className="text-xs text-gray-500 mb-3">
            Shown for &ldquo;{family.name}&rdquo; — visible to everyone in your family.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center overflow-hidden shrink-0">
              {familyIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={familyIconUrl} alt="Family icon" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{familyIconEmoji}</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={familyInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFamilyIconFile}
              />
              <button
                onClick={() => familyInputRef.current?.click()}
                disabled={uploading === "family"}
                className="btn-secondary w-full text-sm"
              >
                {uploading === "family" ? "Uploading…" : "🖼️ Upload photo"}
              </button>
              {familyIconUrl && (
                <button
                  onClick={() => pickFamilyIconEmoji(familyIconEmoji)}
                  className="w-full text-xs text-gray-400 underline"
                >
                  Remove photo, use emoji instead
                </button>
              )}
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-500 mb-2">Or pick an emoji icon</p>
          <div className="flex flex-wrap gap-2">
            {FAMILY_ICON_OPTIONS.map((a) => (
              <button
                key={a}
                onClick={() => pickFamilyIconEmoji(a)}
                className={`text-2xl p-2 rounded-xl transition-all ${
                  !familyIconUrl && familyIconEmoji === a
                    ? "bg-teal-500 scale-110 shadow-md"
                    : "bg-teal-50 hover:bg-teal-100"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-4 text-center text-sm text-gray-500">
          Join or create a family on the{" "}
          <Link href="/family" className="text-purple-600 font-bold underline">
            Family page
          </Link>{" "}
          to set a family icon.
        </div>
      )}
    </div>
  );
}
