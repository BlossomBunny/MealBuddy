import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { name, passcode } = await request.json();

  if (!name?.trim() || !passcode?.trim()) {
    return NextResponse.json({ error: "Name and passcode are required" }, { status: 400 });
  }

  const supabase = createClient();

  // Check name isn't already taken
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", name.trim())
    .single();

  if (existing) {
    return NextResponse.json({ error: "That name is already taken" }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({ display_name: name.trim(), passcode: passcode.trim() })
    .select("id")
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("mb_user", profile.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
