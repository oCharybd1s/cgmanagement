import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canEditMember } from "@/lib/auth/roles";
import { generateTemporaryPassword } from "@/lib/members/shared";
import type { SessionUser } from "@/lib/auth/types";

export type MemberPasswordStatusResult =
  | { ok: true; mustChangePassword: boolean; temporaryPasswordPending: string | null }
  | { ok: false; status: number; error: string };

export type ResetMemberPasswordResult =
  | { ok: true; temporaryPassword: string }
  | { ok: false; status: number; error: string };

export async function getMemberPasswordStatusForSession(
  session: SessionUser,
  targetUserId: string,
): Promise<MemberPasswordStatusResult> {
  const authorized = await loadAuthorizedTarget(session, targetUserId);
  if (!authorized.ok) {
    return authorized;
  }

  const { targetData } = authorized;
  return {
    ok: true,
    mustChangePassword: targetData.mustChangePassword === true,
    temporaryPasswordPending:
      typeof targetData.temporaryPasswordPending === "string" ? targetData.temporaryPasswordPending : null,
  };
}

export async function resetMemberPasswordForSession(
  session: SessionUser,
  targetUserId: string,
): Promise<ResetMemberPasswordResult> {
  const authorized = await loadAuthorizedTarget(session, targetUserId);
  if (!authorized.ok) {
    return authorized;
  }

  const { adminAuth, targetRef, targetRole, targetCgGroupId, targetData, trimmedTargetUserId } = authorized;
  const temporaryPassword = generateTemporaryPassword();

  try {
    await adminAuth.updateUser(trimmedTargetUserId, { password: temporaryPassword });
    await adminAuth.setCustomUserClaims(trimmedTargetUserId, {
      role: targetRole,
      orgId: session.orgId,
      cgGroupId: targetCgGroupId,
      isBendahara: targetData.isBendahara === true,
      mustChangePassword: true,
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal mereset password anggota" };
  }

  try {
    await targetRef.update({
      mustChangePassword: true,
      temporaryPasswordPending: temporaryPassword,
      updatedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Password direset tapi gagal menyimpan catatan anggota" };
  }

  return { ok: true, temporaryPassword };
}

async function loadAuthorizedTarget(session: SessionUser, targetUserId: string) {
  if (!session.orgId) {
    return { ok: false as const, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedTargetUserId = targetUserId.trim();
  if (!trimmedTargetUserId) {
    return { ok: false as const, status: 400, error: "Anggota tidak valid" };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false as const, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminAuth, adminDb } = adminServices;

  const targetRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("users")
    .doc(trimmedTargetUserId);

  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    return { ok: false as const, status: 404, error: "Anggota tidak ditemukan" };
  }

  const targetData = targetSnap.data() ?? {};
  const targetRole = typeof targetData.role === "string" ? targetData.role : null;
  const targetCgGroupId = typeof targetData.cgGroupId === "string" ? targetData.cgGroupId : null;

  if (!canEditMember(session.role, session.cgGroupId, targetRole, targetCgGroupId)) {
    return { ok: false as const, status: 403, error: "Anda tidak memiliki akses untuk anggota ini" };
  }

  return {
    ok: true as const,
    adminAuth,
    targetRef,
    targetRole,
    targetCgGroupId,
    targetData,
    trimmedTargetUserId,
  };
}
