import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import {
  SESSION_COOKIE_NAME,
  createSessionCookie,
  getSessionCookieOptions,
  getSessionMaxAgeMs,
} from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  const credentials = await readCredentials(request);
  if (!credentials) {
    return NextResponse.json({ ok: false, error: "Email atau password tidak valid" }, { status: 400 });
  }

  const signIn = await signInWithPassword(credentials.email, credentials.password, apiKey);
  if (!signIn.ok) {
    return NextResponse.json({ ok: false, error: signIn.error }, { status: signIn.status });
  }

  try {
    const { adminAuth } = getAdminServices();
    const decoded = await adminAuth.verifyIdToken(signIn.idToken);
    const maxAgeMs = getSessionMaxAgeMs();
    const sessionCookie = await createSessionCookie(signIn.idToken, maxAgeMs);

    if (!sessionCookie) {
      return NextResponse.json({ ok: false, error: "Gagal membuat sesi" }, { status: 500 });
    }

    const user: SessionUser = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: typeof decoded.role === "string" ? decoded.role : null,
      orgId: typeof decoded.orgId === "string" ? decoded.orgId : null,
      cgGroupId: typeof decoded.cgGroupId === "string" ? decoded.cgGroupId : null,
      isBendahara: decoded.isBendahara === true,
    };

    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions(maxAgeMs));
    return response;
  } catch (error) {
    console.error("Login gagal membuat sesi", error);
    return NextResponse.json({ ok: false, error: "Gagal membuat sesi" }, { status: 500 });
  }
}

async function readCredentials(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return null;
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_REGEX.test(email) || password.length < 6) {
    return null;
  }

  return { email, password };
}

async function signInWithPassword(email: string, password: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const data = await response.json();

    if (!response.ok) {
      return { ok: false as const, status: 401, error: mapSignInErrorCode(data?.error?.message) };
    }

    return { ok: true as const, idToken: data.idToken as string };
  } catch (error) {
    console.error("Tidak bisa menghubungi Identity Toolkit", error);
    return { ok: false as const, status: 502, error: "Tidak bisa menghubungi layanan autentikasi" };
  }
}

function mapSignInErrorCode(code: string | undefined) {
  switch (code) {
    case "USER_DISABLED":
      return "Akun ini telah dinonaktifkan";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Terlalu banyak percobaan. Coba lagi nanti";
    case "EMAIL_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
      return "Email atau password salah";
    default:
      return "Login gagal. Coba lagi";
  }
}
