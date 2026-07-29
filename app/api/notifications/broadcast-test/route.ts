import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { canBroadcastNotification } from "@/lib/auth/roles";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { sendNotificationToOrg } from "@/lib/notifications/send";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session || !session.orgId) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  if (!canBroadcastNotification(session.role)) {
    return NextResponse.json({ ok: false, error: "Hanya Coach yang bisa broadcast notifikasi" }, { status: 403 });
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  let result;
  try {
    result = await sendNotificationToOrg(adminServices.adminDb, session.orgId, {
      title: "Notifikasi Test Broadcast",
      body: "Ini kiriman ke semua anggota yang sudah aktifkan notifikasi.",
      url: "/home",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Gagal broadcast notifikasi" }, { status: 500 });
  }

  if (result.successCount === 0) {
    return NextResponse.json(
      { ok: false, error: "Belum ada satu pun perangkat aktif di seluruh organisasi" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, successCount: result.successCount, failureCount: result.failureCount });
}
