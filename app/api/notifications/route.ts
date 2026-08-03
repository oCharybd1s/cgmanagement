import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { getNotificationsForSession } from "@/lib/notifications/inbox";

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session || !session.orgId) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  let result;
  try {
    result = await getNotificationsForSession(session, { cursor, limit });
  } catch {
    return NextResponse.json({ ok: false, error: "Gagal memuat notifikasi" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    notifications: result.notifications,
    nextCursor: result.nextCursor,
    unreadCount: result.unreadCount,
  });
}
