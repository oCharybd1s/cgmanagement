import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { sendNotificationToUser } from "@/lib/notifications/send";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session || !session.orgId) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  let result;
  try {
    result = await sendNotificationToUser(adminServices.adminDb, session.orgId, session.uid, {
      title: "Notifikasi Test",
      body: "Kalau kamu melihat ini, push notification sudah berfungsi.",
      url: "/home",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Gagal mengirim notifikasi" }, { status: 500 });
  }

  if (result.successCount === 0) {
    return NextResponse.json(
      { ok: false, error: "Tidak ada perangkat aktif yang menerima notifikasi. Pastikan izin notifikasi sudah diaktifkan" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, successCount: result.successCount, failureCount: result.failureCount });
}
