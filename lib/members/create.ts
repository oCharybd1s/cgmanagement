import { randomInt } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { assignableRolesForCreator, canCreateMember, isCoach } from "@/lib/auth/roles";
import { validateCreateMemberInput, type CreateMemberFieldErrors } from "@/lib/members/validation";
import type { SessionUser } from "@/lib/auth/types";
import type { SpiritualStatus } from "@/lib/members/types";

const TEMP_PASSWORD_LENGTH = 12;
const TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export type CreateMemberRequest = {
  fullName: unknown;
  email: unknown;
  role: unknown;
  cgGroupId: unknown;
  nij: unknown;
  address: unknown;
  birthPlace: unknown;
  birthDate: unknown;
  phone: unknown;
  pelayanan: unknown;
  spiritualStatus: unknown;
};

export type CreateMemberResult =
  | { ok: true; memberId: string; temporaryPassword: string }
  | { ok: false; status: number; error: string; fieldErrors?: CreateMemberFieldErrors };

export async function createMemberForSession(
  session: SessionUser,
  payload: Partial<CreateMemberRequest>,
): Promise<CreateMemberResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canCreateMember(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menambah anggota" };
  }

  const fullName = toStringValue(payload.fullName).trim();
  const email = toStringValue(payload.email).trim().toLowerCase();

  const fieldErrors = validateCreateMemberInput({ fullName, email });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, error: "Periksa kembali data yang diisi", fieldErrors };
  }

  const requestedRole = toStringValue(payload.role).trim().toLowerCase();
  if (requestedRole && !assignableRolesForCreator(session.role).includes(requestedRole)) {
    return {
      ok: false,
      status: 403,
      error: "Role tersebut tidak diizinkan untuk akun Anda",
      fieldErrors: { role: "Role tidak diizinkan untuk akun Anda" },
    };
  }

  let cgGroupId: string | null;
  if (requestedRole === "coach") {
    cgGroupId = null;
  } else if (isCoach(session.role)) {
    const requestedCgGroupId = toStringValue(payload.cgGroupId).trim();
    cgGroupId = requestedCgGroupId === "" ? null : requestedCgGroupId;
  } else {
    if (!session.cgGroupId) {
      return { ok: false, status: 403, error: "Akun Anda belum terhubung ke CG" };
    }
    cgGroupId = session.cgGroupId;
  }

  const temporaryPassword = generateTemporaryPassword();

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminAuth, adminDb } = adminServices;

  let uid: string;
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password: temporaryPassword,
      displayName: fullName,
    });
    uid = userRecord.uid;
  } catch (error) {
    return {
      ok: false,
      status: 409,
      error: mapCreateUserError(error),
      fieldErrors: mapCreateUserFieldError(error),
    };
  }

  try {
    await adminAuth.setCustomUserClaims(uid, {
      role: requestedRole || null,
      orgId: session.orgId,
      cgGroupId,
      isBendahara: false,
    });
  } catch {
    await adminAuth.deleteUser(uid).catch(() => undefined);
    return { ok: false, status: 500, error: "Gagal menyimpan hak akses anggota baru" };
  }

  const now = FieldValue.serverTimestamp();

  try {
    await adminDb
      .collection("organizations")
      .doc(session.orgId)
      .collection("users")
      .doc(uid)
      .set({
        fullName,
        role: requestedRole || null,
        cgGroupId,
        nij: normalizeOptional(payload.nij),
        address: normalizeOptional(payload.address),
        birthPlace: normalizeOptional(payload.birthPlace),
        birthDate: normalizeOptional(payload.birthDate),
        email,
        phone: normalizeOptional(payload.phone),
        isBendahara: false,
        spiritualStatus: normalizeSpiritualStatus(payload.spiritualStatus),
        pelayanan: normalizeOptional(payload.pelayanan),
        createdBy: session.uid,
        createdAt: now,
        updatedBy: session.uid,
        updatedAt: now,
      });
  } catch {
    await adminAuth.deleteUser(uid).catch(() => undefined);
    return { ok: false, status: 500, error: "Gagal menyimpan data anggota" };
  }

  return { ok: true, memberId: uid, temporaryPassword };
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeOptional(value: unknown): string | null {
  const text = toStringValue(value).trim();
  return text === "" ? null : text;
}

function normalizeSpiritualStatus(value: unknown): SpiritualStatus {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return {
    baptisSelam: record.baptisSelam === true,
    baptisRohKudus: record.baptisRohKudus === true,
    msj1: record.msj1 === true,
    msj2: record.msj2 === true,
    msj3: record.msj3 === true,
    cgt1: record.cgt1 === true,
    cgt2: record.cgt2 === true,
    cgt3: record.cgt3 === true,
  };
}

function generateTemporaryPassword(): string {
  let result = "";
  for (let index = 0; index < TEMP_PASSWORD_LENGTH; index += 1) {
    result += TEMP_PASSWORD_CHARS[randomInt(TEMP_PASSWORD_CHARS.length)];
  }
  return result;
}

function mapCreateUserError(error: unknown): string {
  const code = getErrorCode(error);
  switch (code) {
    case "auth/email-already-exists":
      return "Email sudah terdaftar";
    case "auth/invalid-email":
      return "Format email tidak valid";
    default:
      return "Gagal membuat akun anggota baru";
  }
}

function mapCreateUserFieldError(error: unknown): CreateMemberFieldErrors | undefined {
  const code = getErrorCode(error);
  if (code === "auth/email-already-exists" || code === "auth/invalid-email") {
    return { email: mapCreateUserError(error) };
  }
  return undefined;
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}