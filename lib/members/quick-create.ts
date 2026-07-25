import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canQuickAddMember, isCoach } from "@/lib/auth/roles";
import { toStringValue } from "@/lib/members/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { Member } from "@/lib/members/types";

export type QuickAddMemberResult =
  | { ok: true; member: Member }
  | { ok: false; status: number; error: string; fieldErrors?: { fullName?: string; cgGroupId?: string } };

export async function quickAddMemberForSession(
  session: SessionUser,
  payload: { fullName: unknown; cgGroupId: unknown },
): Promise<QuickAddMemberResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canQuickAddMember(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menambah anggota" };
  }

  const fullName = toStringValue(payload.fullName).trim();
  if (fullName === "") {
    return { ok: false, status: 400, error: "Nama wajib diisi", fieldErrors: { fullName: "Nama wajib diisi" } };
  }

  const cgGroupId = isCoach(session.role) ? toStringValue(payload.cgGroupId).trim() : session.cgGroupId;

  if (!cgGroupId) {
    return {
      ok: false,
      status: 400,
      error: "CG wajib dipilih",
      fieldErrors: isCoach(session.role) ? { cgGroupId: "CG wajib dipilih" } : undefined,
    };
  }

  const { adminDb } = getAdminServices();
  const orgRef = adminDb.collection("organizations").doc(session.orgId);
  const cgGroupDoc = await orgRef.collection("cgGroups").doc(cgGroupId).get();

  if (!cgGroupDoc.exists) {
    return { ok: false, status: 404, error: "CG tidak ditemukan" };
  }

  const now = FieldValue.serverTimestamp();
  const memberRef = orgRef.collection("users").doc();
  const emptySpiritualStatus = {
    baptisSelam: false,
    baptisRohKudus: false,
    msj1: false,
    msj2: false,
    msj3: false,
    cgt1: false,
    cgt2: false,
    cgt3: false,
  };

  try {
    await memberRef.set({
      fullName,
      role: "simpatisan",
      cgGroupId,
      nij: null,
      address: null,
      birthPlace: null,
      birthDate: null,
      email: null,
      phone: null,
      isBendahara: false,
      mustChangePassword: false,
      hasAccount: false,
      spiritualStatus: emptySpiritualStatus,
      pelayanan: null,
      createdBy: session.uid,
      createdAt: now,
      updatedBy: session.uid,
      updatedAt: now,
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan data anggota" };
  }

  return {
    ok: true,
    member: {
      id: memberRef.id,
      fullName,
      role: "simpatisan",
      cgGroupId,
      nij: null,
      address: null,
      birthPlace: null,
      birthDate: null,
      email: null,
      phone: null,
      isBendahara: false,
      mustChangePassword: false,
      hasAccount: false,
      spiritualStatus: emptySpiritualStatus,
      pelayanan: null,
    },
  };
}
