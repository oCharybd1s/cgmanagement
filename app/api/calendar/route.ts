import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { getCalendarDataForSession } from "@/lib/calendar/data";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  if (!DATE_PATTERN.test(start) || !DATE_PATTERN.test(end) || start > end) {
    return NextResponse.json({ ok: false, error: "Rentang tanggal tidak valid" }, { status: 400 });
  }

  const data = await getCalendarDataForSession(session, { start, end });

  return NextResponse.json({ ok: true, events: data.events, birthdays: data.birthdays });
}
