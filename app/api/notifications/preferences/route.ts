import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import {
  getNotificationPreferencesForSession,
  updateNotificationPreferencesForSession,
} from "@/lib/notifications/preferences";

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const preferences = await getNotificationPreferencesForSession(session);
  return NextResponse.json({ ok: true, preferences });
}

export async function PATCH(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Data yang dikirim tidak valid" }, { status: 400 });
  }

  const patch: { birthday?: boolean; event?: boolean; vip?: boolean; laporan?: boolean } = {};
  if (typeof (body as Record<string, unknown>).birthday === "boolean") {
    patch.birthday = (body as Record<string, unknown>).birthday as boolean;
  }
  if (typeof (body as Record<string, unknown>).event === "boolean") {
    patch.event = (body as Record<string, unknown>).event as boolean;
  }
  if (typeof (body as Record<string, unknown>).vip === "boolean") {
    patch.vip = (body as Record<string, unknown>).vip as boolean;
  }
  if (typeof (body as Record<string, unknown>).laporan === "boolean") {
    patch.laporan = (body as Record<string, unknown>).laporan as boolean;
  }

  const result = await updateNotificationPreferencesForSession(session, patch);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, preferences: result.preferences });
}
