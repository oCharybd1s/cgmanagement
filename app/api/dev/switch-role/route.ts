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
import { canUseDemoRoleSwitch, isDemoSwitchableRole } from "@/lib/auth/demo-role-switch";
import { signInWithCustomToken } from "@/lib/auth/identity-toolkit";
import type { SessionUser } from "@/lib/auth/types";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session || !canUseDemoRoleSwitch(session)) {
    return NextResponse.json({ ok: false, error: "Tidak diizinkan" }, { status: 403 });
  }

  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  const payload = await readPayload(request);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Role tidak valid" }, { status: 400 });
  }

  try {
    const { adminAuth, adminDb } = getAdminServices();

    await adminAuth.setCustomUserClaims(session.uid, {
      role: payload.role,
      orgId: session.orgId,
      cgGroupId: payload.cgGroupId,
    });

    if (session.orgId) {
      await adminDb
        .collection("organizations")
        .doc(session.orgId)
        .collection("users")
        .doc(session.uid)
        .set({ role: payload.role, cgGroupId: payload.cgGroupId }, { merge: true });
    }

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
      role: payload.role,
      orgId: session.orgId,
      cgGroupId: payload.cgGroupId,
    };

    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions(maxAgeMs));
    return response;
  } catch (error) {
    console.error("Gagal switch role demo", error);
    return NextResponse.json({ ok: false, error: "Gagal switch role" }, { status: 500 });
  }
}

async function readPayload(request: NextRequest) {
  let body: { role?: unknown; cgGroupId?: unknown };
  try {
    body = await request.json();
  } catch {
    return null;
  }

  if (!isDemoSwitchableRole(body.role)) {
    return null;
  }

  if (body.role === "coach") {
    return { role: body.role, cgGroupId: null };
  }

  const cgGroupId = typeof body.cgGroupId === "string" && body.cgGroupId.length > 0 ? body.cgGroupId : null;
  if (!cgGroupId) {
    return null;
  }

  return { role: body.role, cgGroupId };
}
