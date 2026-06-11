import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { name, passcode } = await request.json();

  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", name.trim())
    .eq("passcode", passcode.trim())
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Name or passcode incorrect" }, { status: 401 });
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
