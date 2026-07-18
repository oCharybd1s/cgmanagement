import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";

const PUBLIC_PAGE_PATHS = new Set(["/auth"]);

function withClearedSessionCookie(response: NextResponse, cookieValue: string | undefined) {
  if (cookieValue) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }
  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (PUBLIC_PAGE_PATHS.has(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return withClearedSessionCookie(NextResponse.next(), cookieValue);
  }

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return withClearedSessionCookie(
      NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
      cookieValue,
    );
  }

  const loginUrl = new URL("/auth", request.url);
  loginUrl.searchParams.set("next", pathname);
  return withClearedSessionCookie(NextResponse.redirect(loginUrl), cookieValue);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|api/auth/|api/health|api/firebase-check).*)",
  ],
};