import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, revokeSession, verifySessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, false);

  if (session) {
    await revokeSession(session.uid);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
