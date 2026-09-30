import { Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canMoveToPastMember } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";
import type { FormerMemberReason } from "@/lib/former-members/types";

export type MoveToFormerResult =
  | { ok: true; formerMemberId: string }
  | { ok: false; status: number; error: string };

export async function moveActiveMemberToFormerForSession(
  session: SessionUser,
  targetUserId: string,
  reason: FormerMemberReason,
  notes: string | null,
): Promise<MoveToFormerResult> {
  if (!canMoveToPastMember(session.role)) {
    return { ok: false, status: 403, error: "Hanya Coach yang bisa memindahkan anggota ke Alumni" };
  }

  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedTargetUserId = targetUserId.trim();
  if (!trimmedTargetUserId) {
    return { ok: false, status: 400, error: "Anggota tidak valid" };
  }

  if (trimmedTargetUserId === session.uid) {
    return { ok: false, status: 400, error: "Anda tidak bisa memindahkan diri sendiri ke Alumni" };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }

  const { adminAuth, adminDb } = adminServices;
  const orgRef = adminDb.collection("organizations").doc(session.orgId);
  const targetRef = orgRef.collection("users").doc(trimmedTargetUserId);

  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    return { ok: false, status: 404, error: "Anggota tidak ditemukan" };
  }

  const targetData = targetSnap.data() ?? {};
  const fullName = typeof targetData.fullName === "string" ? targetData.fullName.trim() : "";
  const phone = typeof targetData.phone === "string" ? targetData.phone.trim() || null : null;
  const lastRole = typeof targetData.role === "string" ? targetData.role : null;
  const cgGroupId = typeof targetData.cgGroupId === "string" ? targetData.cgGroupId : null;

  const formerMemberRef = orgRef.collection("formerMembers").doc();

  await formerMemberRef.set({
    fullName,
    phone,
    lastRole,
    cgGroupId,
    reason,
    notes: notes ? notes.trim() || null : null,
    leftDate: Timestamp.now(),
    originalMemberId: trimmedTargetUserId,
  });

  try {
    await targetRef.delete();
  } catch {
    await formerMemberRef.delete().catch(() => undefined);
    return { ok: false, status: 500, error: "Gagal menghapus data anggota" };
  }

  await adminAuth.deleteUser(trimmedTargetUserId).catch(() => undefined);

  return { ok: true, formerMemberId: formerMemberRef.id };
}
