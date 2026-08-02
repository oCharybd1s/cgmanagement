import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { EMAIL_REGEX, isValidIndonesianPhone, sanitizePhoneInput } from "@/lib/members/validation";
import { getErrorCode, toStringValue } from "@/lib/members/shared";
import type { SessionUser } from "@/lib/auth/types";

export type UpdateOwnContactFieldErrors = Partial<Record<"email" | "phone", string>>;

export type UpdateOwnContactResult =
  | { ok: true; email: string; phone: string }
  | { ok: false; status: number; error: string; fieldErrors?: UpdateOwnContactFieldErrors };

export async function updateOwnContactForSession(
  session: SessionUser,
  payload: { email: unknown; phone: unknown },
): Promise<UpdateOwnContactResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const email = toStringValue(payload.email).trim().toLowerCase();
  const phone = sanitizePhoneInput(toStringValue(payload.phone).trim());

  const fieldErrors: UpdateOwnContactFieldErrors = {};
  if (email === "") {
    fieldErrors.email = "Email wajib diisi";
  } else if (!EMAIL_REGEX.test(email)) {
    fieldErrors.email = "Format email tidak valid";
  }

  if (phone === "") {
    fieldErrors.phone = "No HP wajib diisi";
  } else if (!isValidIndonesianPhone(phone)) {
    fieldErrors.phone = "Nomor HP tidak valid, gunakan nomor Indonesia yang benar";
  }

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

  const userRef = adminDb.collection("organizations").doc(session.orgId).collection("users").doc(session.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    return { ok: false, status: 404, error: "Data profil tidak ditemukan" };
  }

  const currentEmail = typeof snapshot.data()?.email === "string" ? (snapshot.data()?.email as string) : "";

  if (email !== currentEmail) {
    try {
      await adminAuth.updateUser(session.uid, { email });
    } catch (error) {
      return {
        ok: false,
        status: 409,
        error: mapUpdateUserError(error),
        fieldErrors: mapUpdateUserFieldError(error),
      };
    }
  }

  try {
    await userRef.update({
      email,
      phone,
      updatedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan data kontak" };
  }

  return { ok: true, email, phone };
}

function mapUpdateUserError(error: unknown): string {
  const code = getErrorCode(error);
  switch (code) {
    case "auth/email-already-exists":
      return "Email sudah dipakai akun lain";
    case "auth/invalid-email":
      return "Format email tidak valid";
    default:
      return "Gagal memperbarui akun";
  }
}

function mapUpdateUserFieldError(error: unknown): UpdateOwnContactFieldErrors | undefined {
  const code = getErrorCode(error);
  if (code === "auth/email-already-exists" || code === "auth/invalid-email") {
    return { email: mapUpdateUserError(error) };
  }
  return undefined;
}
