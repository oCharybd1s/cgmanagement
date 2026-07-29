import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canManageKasAccountStatus } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";
import type { KasAccount } from "@/lib/kas-accounts/types";

export type SetKasAccountStatusResult =
  | { ok: true; account: KasAccount }
  | { ok: false; status: number; error: string };

export async function setKasAccountStatusForSession(
  session: SessionUser,
  accountId: string,
  active: boolean,
): Promise<SetKasAccountStatusResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canManageKasAccountStatus(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mengubah status akun kas" };
  }

  const trimmedId = accountId.trim();
  if (!trimmedId || trimmedId === "coach") {
    return { ok: false, status: 400, error: "Akun Kas Coach tidak bisa dinonaktifkan" };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;

  const ref = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("kasAccounts")
    .doc(trimmedId);

  const snapshot = await ref.get();
  if (!snapshot.exists) {
    return { ok: false, status: 404, error: "Akun kas tidak ditemukan" };
  }

  await ref.update({ active, updatedAt: FieldValue.serverTimestamp() });

  const data = snapshot.data() ?? {};

  return {
    ok: true,
    account: {
      id: trimmedId,
      accountType: data.accountType === "coach" ? "coach" : "cg",
      refId: typeof data.refId === "string" ? data.refId : null,
      balance: typeof data.balance === "number" ? data.balance : 0,
      active,
    },
  };
}
