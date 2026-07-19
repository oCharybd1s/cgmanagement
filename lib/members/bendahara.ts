import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { bendaharaScopeForRole, canAssignBendahara } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export type SetBendaharaResult =
  | { ok: true; memberId: string; isBendahara: boolean }
  | { ok: false; status: number; error: string };

export async function setBendaharaStatusForSession(
  session: SessionUser,
  targetUserId: string,
  isBendahara: boolean,
): Promise<SetBendaharaResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedTargetUserId = targetUserId.trim();
  if (!trimmedTargetUserId) {
    return { ok: false, status: 400, error: "Anggota tidak valid" };
  }

  let adminServices;
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

  if (!bendaharaScopeForRole(targetRole)) {
    return {
      ok: false,
      status: 400,
      error: "Status bendahara hanya berlaku untuk CGL (Kas Coach) atau Sponsor (Kas CG)",
    };
  }

  if (!canAssignBendahara(session.role, session.cgGroupId, targetRole, targetCgGroupId)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mengubah status bendahara ini" };
  }

  try {
    await targetRef.update({
      isBendahara,
      updatedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal memperbarui status bendahara" };
  }

  try {
    await adminAuth.setCustomUserClaims(trimmedTargetUserId, {
      role: targetRole,
      orgId: session.orgId,
      cgGroupId: targetCgGroupId,
      isBendahara,
    });
  } catch {
    return {
      ok: false,
      status: 500,
      error: "Status tersimpan, tapi gagal memperbarui hak akses. Minta anggota logout lalu login ulang",
    };
  }

  return { ok: true, memberId: trimmedTargetUserId, isBendahara };
}
