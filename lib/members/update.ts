import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canEditMember } from "@/lib/auth/roles";
import { validateUpdateMemberInput, type UpdateMemberFieldErrors } from "@/lib/members/validation";
import { getErrorCode, normalizeOptional, normalizeSpiritualStatus, toStringValue } from "@/lib/members/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { Member } from "@/lib/members/types";

export type UpdateMemberRequest = {
  fullName: unknown;
  email: unknown;
  nij: unknown;
  address: unknown;
  birthPlace: unknown;
  birthDate: unknown;
  phone: unknown;
  pelayanan: unknown;
  spiritualStatus: unknown;
};

export type UpdateMemberResult =
  | { ok: true; member: Member }
  | { ok: false; status: number; error: string; fieldErrors?: UpdateMemberFieldErrors };

export async function updateMemberForSession(
  session: SessionUser,
  targetUserId: string,
  payload: Partial<UpdateMemberRequest>,
): Promise<UpdateMemberResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedTargetUserId = targetUserId.trim();
  if (!trimmedTargetUserId) {
    return { ok: false, status: 400, error: "Anggota tidak valid" };
  }

  const fullName = toStringValue(payload.fullName).trim();
  const email = toStringValue(payload.email).trim().toLowerCase();

  const fieldErrors = validateUpdateMemberInput({ fullName, email });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, error: "Periksa kembali data yang diisi", fieldErrors };
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

  if (!canEditMember(session.role, session.cgGroupId, targetRole, targetCgGroupId)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mengubah data anggota ini" };
  }

  const currentEmail = typeof targetData.email === "string" ? targetData.email : "";
  if (email !== currentEmail) {
    try {
      await adminAuth.updateUser(trimmedTargetUserId, { email, displayName: fullName });
    } catch (error) {
      return {
        ok: false,
        status: 409,
        error: mapUpdateUserError(error),
        fieldErrors: mapUpdateUserFieldError(error),
      };
    }
  } else {
    await adminAuth.updateUser(trimmedTargetUserId, { displayName: fullName }).catch(() => undefined);
  }

  const nij = normalizeOptional(payload.nij);
  const address = normalizeOptional(payload.address);
  const birthPlace = normalizeOptional(payload.birthPlace);
  const birthDate = normalizeOptional(payload.birthDate);
  const phone = normalizeOptional(payload.phone);
  const spiritualStatus = normalizeSpiritualStatus(payload.spiritualStatus);
  const pelayanan = normalizeOptional(payload.pelayanan);

  try {
    await targetRef.update({
      fullName,
      nij,
      address,
      birthPlace,
      birthDate,
      email,
      phone,
      spiritualStatus,
      pelayanan,
      updatedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan perubahan data anggota" };
  }

  return {
    ok: true,
    member: {
      id: trimmedTargetUserId,
      fullName,
      role: targetRole ?? "",
      cgGroupId: targetCgGroupId,
      nij,
      address,
      birthPlace,
      birthDate,
      email,
      phone,
      isBendahara: targetData.isBendahara === true,
      mustChangePassword: targetData.mustChangePassword === true,
      spiritualStatus,
      pelayanan,
    },
  };
}

function mapUpdateUserError(error: unknown): string {
  const code = getErrorCode(error);
  switch (code) {
    case "auth/email-already-exists":
      return "Email sudah dipakai akun lain";
    case "auth/invalid-email":
      return "Format email tidak valid";
    default:
      return "Gagal memperbarui akun anggota";
  }
}

function mapUpdateUserFieldError(error: unknown): UpdateMemberFieldErrors | undefined {
  const code = getErrorCode(error);
  if (code === "auth/email-already-exists" || code === "auth/invalid-email") {
    return { email: mapUpdateUserError(error) };
  }
  return undefined;
}
