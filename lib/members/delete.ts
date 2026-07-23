import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canDeleteMember } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export type DeleteMemberResult =
  | { ok: true; memberId: string }
  | { ok: false; status: number; error: string };

export async function deleteMemberForSession(
  session: SessionUser,
  targetUserId: string,
): Promise<DeleteMemberResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedTargetUserId = targetUserId.trim();
  if (!trimmedTargetUserId) {
    return { ok: false, status: 400, error: "Anggota tidak valid" };
  }

  if (trimmedTargetUserId === session.uid) {
    return { ok: false, status: 400, error: "Anda tidak bisa menghapus akun Anda sendiri" };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminAuth, adminDb } = adminServices;

  const targetRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("users")
    .doc(trimmedTargetUserId);

  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    return { ok: false, status: 404, error: "Anggota tidak ditemukan" };
  }

  const targetData = targetSnap.data() ?? {};
  const targetRole = typeof targetData.role === "string" ? targetData.role : null;
  const targetCgGroupId = typeof targetData.cgGroupId === "string" ? targetData.cgGroupId : null;

  if (!canDeleteMember(session.role, session.cgGroupId, targetRole, targetCgGroupId)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menghapus anggota ini" };
  }

  try {
    await targetRef.delete();
  } catch {
    return { ok: false, status: 500, error: "Gagal menghapus data anggota" };
  }

  await adminAuth.deleteUser(trimmedTargetUserId).catch(() => undefined);

  return { ok: true, memberId: trimmedTargetUserId };
}
