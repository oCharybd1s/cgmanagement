import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { saveFcmToken, deleteFcmToken } from "@/lib/notifications/token-store";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session || !session.orgId) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const token = body && typeof body.token === "string" ? body.token.trim() : "";
  const userAgent = body && typeof body.userAgent === "string" ? body.userAgent : null;

  if (token === "") {
    return NextResponse.json({ ok: false, error: "Token tidak valid" }, { status: 400 });
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  try {
    await saveFcmToken(adminServices.adminDb, session.orgId, session.uid, token, userAgent);
  } catch {
    return NextResponse.json({ ok: false, error: "Gagal menyimpan token perangkat" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session || !session.orgId) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const token = body && typeof body.token === "string" ? body.token.trim() : "";

  if (token === "") {
    return NextResponse.json({ ok: false, error: "Token tidak valid" }, { status: 400 });
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  try {
    await deleteFcmToken(adminServices.adminDb, session.orgId, session.uid, token);
  } catch {
    return NextResponse.json({ ok: false, error: "Gagal menghapus token perangkat" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
