import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const publicRoutes = ["/login", "/api/auth"];
  const isPublic = publicRoutes.some((r) =>
    request.nextUrl.pathname.startsWith(r)
  );

  if (!isPublic) {
    const userId = request.cookies.get("mb_user")?.value;
    if (!userId) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
