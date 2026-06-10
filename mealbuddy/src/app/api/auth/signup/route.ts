import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email, password, displayName } = await request.json();

  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            response.cookies.set(name, value, options as any);
          });
        },
      },
    }
  );

  // Create account
  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  // Sign in immediately (email confirmation is off)
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return NextResponse.json({ error: "Account created — please sign in.", needsSignIn: true }, { status: 200 });
  }

  // Save profile
  if (data.user) {
    await supabase.from("profiles").upsert(
      { id: data.user.id, display_name: displayName?.trim() || email.split("@")[0] },
      { onConflict: "id" }
    );
  }

  return response;
}
