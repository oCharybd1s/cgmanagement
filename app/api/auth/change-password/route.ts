import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import {
  SESSION_COOKIE_NAME,
  createSessionCookie,
  getSessionCookieOptions,
  getSessionMaxAgeMs,
  revokeSession,
  verifySessionCookie,
} from "@/lib/auth/session";
import { signInWithCustomToken } from "@/lib/auth/identity-toolkit";
import type { SessionUser } from "@/lib/auth/types";

const MIN_PASSWORD_LENGTH = 6;

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  if (!session.orgId) {
    return NextResponse.json({ ok: false, error: "Sesi Anda belum terhubung ke organisasi" }, { status: 403 });
  }

  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  const newPassword = await readNewPassword(request);
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter` },
      { status: 400 },
    );
  }

  try {
    const { adminAuth, adminDb } = getAdminServices();

    await adminAuth.updateUser(session.uid, { password: newPassword });
    await adminAuth.setCustomUserClaims(session.uid, {
      role: session.role,
      orgId: session.orgId,
      cgGroupId: session.cgGroupId,
      isBendahara: session.isBendahara,
      mustChangePassword: false,
    });

    await adminDb
      .collection("organizations")
      .doc(session.orgId)
      .collection("users")
      .doc(session.uid)
      .set(
        {
          mustChangePassword: false,
          temporaryPasswordPending: null,
          updatedBy: session.uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    await revokeSession(session.uid);
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const customToken = await adminAuth.createCustomToken(session.uid);
    const idToken = await signInWithCustomToken(customToken, apiKey);
    const maxAgeMs = getSessionMaxAgeMs();
    const sessionCookie = await createSessionCookie(idToken, maxAgeMs);

    if (!sessionCookie) {
      return NextResponse.json({ ok: false, error: "Gagal membuat sesi baru" }, { status: 500 });
    }

    const user: SessionUser = {
      uid: session.uid,
      email: session.email,
      role: session.role,
      orgId: session.orgId,
      cgGroupId: session.cgGroupId,
      isBendahara: session.isBendahara,
      mustChangePassword: false,
    };

    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions(maxAgeMs));
    return response;
  } catch (error) {
    console.error("Gagal mengganti password", error);
    return NextResponse.json({ ok: false, error: "Gagal mengganti password" }, { status: 500 });
  }
}

async function readNewPassword(request: NextRequest): Promise<string | null> {
  let body: { newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return null;
  }
  return typeof body.newPassword === "string" ? body.newPassword : null;
}
