import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canManageVipProspect, isCoach } from "@/lib/auth/roles";
import { validateVipProspectInput, type VipProspectFieldErrors } from "@/lib/vip-prospects/validation";
import { normalizeOptional, normalizeStatus, toStringValue } from "@/lib/vip-prospects/shared";
import { createLinkedSimpatisanFromProspect } from "@/lib/vip-prospects/auto-link";
import type { SessionUser } from "@/lib/auth/types";
import type { VipProspect } from "@/lib/vip-prospects/types";

export type UpdateVipProspectRequest = {
  name: unknown;
  phone: unknown;
  cgId: unknown;
  followUpByUserId: unknown;
  status: unknown;
  notes: unknown;
};

export type UpdateVipProspectResult =
  | { ok: true; prospect: VipProspect }
  | { ok: false; status: number; error: string; fieldErrors?: VipProspectFieldErrors };

export async function updateVipProspectForSession(
  session: SessionUser,
  prospectId: string,
  payload: Partial<UpdateVipProspectRequest>,
): Promise<UpdateVipProspectResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedProspectId = prospectId.trim();
  if (!trimmedProspectId) {
    return { ok: false, status: 400, error: "Data VIP tidak valid" };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;

  const targetRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("vipProspects")
    .doc(trimmedProspectId);

  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    return { ok: false, status: 404, error: "Data VIP tidak ditemukan" };
  }

  const targetData = targetSnap.data() ?? {};
  const currentCgId = typeof targetData.cgId === "string" ? targetData.cgId : null;

  if (!canManageVipProspect(session.role, session.cgGroupId, currentCgId)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mengubah data VIP ini" };
  }

  const name = toStringValue(payload.name).trim();
  const fieldErrors = validateVipProspectInput({ name });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, error: "Periksa kembali data yang diisi", fieldErrors };
  }

  const cgId = isCoach(session.role) ? (normalizeOptional(payload.cgId) ?? currentCgId) : currentCgId;
  const phone = normalizeOptional(payload.phone);
  const followUpByUserId = normalizeOptional(payload.followUpByUserId);
  const status = normalizeStatus(payload.status);
  const notes = normalizeOptional(payload.notes);
  const previousStatus = typeof targetData.status === "string" ? targetData.status : "pending";
  const existingLinkedMemberId =
    typeof targetData.linkedMemberId === "string" && targetData.linkedMemberId ? targetData.linkedMemberId : null;

  let linkedMemberId = existingLinkedMemberId;
  if (status === "berpotensi" && !existingLinkedMemberId && previousStatus !== "berpotensi" && cgId) {
    linkedMemberId = await createLinkedSimpatisanFromProspect(adminDb, session.orgId, session.uid, cgId, name, phone);
  }

  try {
    await targetRef.update({
      name,
      phone,
      cgId,
      followUpByUserId,
      status,
      notes,
      linkedMemberId,
      updatedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan perubahan data VIP" };
  }

  return {
    ok: true,
    prospect: {
      id: trimmedProspectId,
      name,
      phone,
      cgId,
      followUpByUserId,
      status,
      notes,
      linkedMemberId,
      createdBy: typeof targetData.createdBy === "string" ? targetData.createdBy : null,
    },
  };
}
