import { getAdminServices } from "@/lib/firebase/firebase-admin";
import type { SessionUser } from "@/lib/auth/types";

export const SESSION_COOKIE_NAME = "session";

const MIN_SESSION_MAX_AGE_MS = 5 * 60 * 1000;
const MAX_SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function getSessionMaxAgeMs() {
  const raw = Number(process.env.SESSION_COOKIE_MAX_AGE_MS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return MAX_SESSION_MAX_AGE_MS;
  }
  return Math.min(Math.max(raw, MIN_SESSION_MAX_AGE_MS), MAX_SESSION_MAX_AGE_MS);
}

export function getSessionCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

export async function createSessionCookie(idToken: string, maxAgeMs: number) {
  const adminAuth = getVerifiedAdminAuth();
  if (!adminAuth) {
    return null;
  }
  return adminAuth.createSessionCookie(idToken, { expiresIn: maxAgeMs });
}

export async function verifySessionCookie(
  cookieValue: string | undefined,
  checkRevoked: boolean,
): Promise<SessionUser | null> {
  if (!cookieValue) {
    return null;
  }

  const adminAuth = getVerifiedAdminAuth();
  if (!adminAuth) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(cookieValue, checkRevoked);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: typeof decoded.role === "string" ? decoded.role : null,
      orgId: typeof decoded.orgId === "string" ? decoded.orgId : null,
      cgGroupId: typeof decoded.cgGroupId === "string" ? decoded.cgGroupId : null,
    };
  } catch {
    return null;
  }
}

export async function revokeSession(uid: string) {
  const adminAuth = getVerifiedAdminAuth();
  if (!adminAuth) {
    return;
  }
  try {
    await adminAuth.revokeRefreshTokens(uid);
  } catch (error) {
    console.error("Gagal revoke refresh token", error);
  }
}

function getVerifiedAdminAuth() {
  try {
    return getAdminServices().adminAuth;
  } catch (error) {
    console.error("Firebase Admin belum terkonfigurasi", error);
    return null;
  }
}
