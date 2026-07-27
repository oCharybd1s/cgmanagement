import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { AVATAR_IDS } from "@/components/settings/avatars/avatar-catalog";
import type { SessionUser } from "@/lib/auth/types";

export type UpdateOwnAvatarResult =
  | { ok: true; avatarId: string }
  | { ok: false; status: number; error: string };

export async function updateOwnAvatarForSession(
  session: SessionUser,
  avatarId: unknown,
): Promise<UpdateOwnAvatarResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (typeof avatarId !== "string" || !AVATAR_IDS.includes(avatarId as (typeof AVATAR_IDS)[number])) {
    return { ok: false, status: 400, error: "Avatar tidak valid" };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;

  const userRef = adminDb.collection("organizations").doc(session.orgId).collection("users").doc(session.uid);

  try {
    await userRef.update({
      avatarId,
      updatedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan avatar" };
  }

  return { ok: true, avatarId };
}
