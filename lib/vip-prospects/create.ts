import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canCreateVipProspect, isCoach } from "@/lib/auth/roles";
import { validateVipProspectInput, type VipProspectFieldErrors } from "@/lib/vip-prospects/validation";
import { normalizeOptional, normalizeStatus, toStringValue } from "@/lib/vip-prospects/shared";
import { createLinkedSimpatisanFromProspect } from "@/lib/vip-prospects/auto-link";
import type { SessionUser } from "@/lib/auth/types";
import type { VipProspect } from "@/lib/vip-prospects/types";

export type CreateVipProspectRequest = {
  name: unknown;
  phone: unknown;
  cgId: unknown;
  followUpByUserId: unknown;
  status: unknown;
  notes: unknown;
};

export type CreateVipProspectResult =
  | { ok: true; prospect: VipProspect }
  | { ok: false; status: number; error: string; fieldErrors?: VipProspectFieldErrors };

export async function createVipProspectForSession(
  session: SessionUser,
  payload: Partial<CreateVipProspectRequest>,
): Promise<CreateVipProspectResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canCreateVipProspect(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menambah data VIP" };
  }

  const name = toStringValue(payload.name).trim();
  const fieldErrors = validateVipProspectInput({ name });

  let cgId: string;
  if (isCoach(session.role)) {
    cgId = toStringValue(payload.cgId).trim();
    if (cgId === "") {
      fieldErrors.cgId = "CG wajib dipilih";
    }
  } else {
    if (!session.cgGroupId) {
      return { ok: false, status: 403, error: "Akun Anda belum terhubung ke CG" };
    }
    cgId = session.cgGroupId;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, error: "Periksa kembali data yang diisi", fieldErrors };
  }

  const phone = normalizeOptional(payload.phone);
  const followUpByUserId = normalizeOptional(payload.followUpByUserId);
  const status = normalizeStatus(payload.status);
  const notes = normalizeOptional(payload.notes);

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;

  const docRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("vipProspects")
    .doc();

  let linkedMemberId: string | null = null;
  if (status === "berpotensi") {
    linkedMemberId = await createLinkedSimpatisanFromProspect(adminDb, session.orgId, session.uid, cgId, name, phone);
  }

  try {
    await docRef.set({
      name,
      phone,
      cgId,
      followUpByUserId,
      status,
      notes,
      linkedMemberId,
      createdBy: session.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan data VIP" };
  }

  return {
    ok: true,
    prospect: {
      id: docRef.id,
      name,
      phone,
      cgId,
      followUpByUserId,
      status,
      notes,
      linkedMemberId,
      createdBy: session.uid,
    },
  };
}
