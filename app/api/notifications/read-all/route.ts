import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { markAllNotificationsReadForSession } from "@/lib/notifications/inbox";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const result = await markAllNotificationsReadForSession(session);

  return NextResponse.json({ ok: true, updatedCount: result.updatedCount });
}
