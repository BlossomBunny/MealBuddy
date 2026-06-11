import { NextResponse } from "next/server";

// No longer used — auth is handled via simple name/passcode + cookie.
// Kept as a harmless redirect in case any old links still point here.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
