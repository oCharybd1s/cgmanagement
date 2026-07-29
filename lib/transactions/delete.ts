import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canManageTransactionRecord } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export type DeleteTransactionResult =
  | { ok: true; transactionIds: string[] }
  | { ok: false; status: number; error: string };

export async function deleteTransactionForSession(
  session: SessionUser,
  transactionId: string,
): Promise<DeleteTransactionResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canManageTransactionRecord(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menghapus transaksi" };
  }

  const trimmedId = transactionId.trim();
  if (!trimmedId) {
    return { ok: false, status: 400, error: "Transaksi tidak valid" };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;

  const orgRef = adminDb.collection("organizations").doc(session.orgId);
  const txRef = orgRef.collection("transactions").doc(trimmedId);

  try {
    const deletedIds = await adminDb.runTransaction(async (trx) => {
      const txSnap = await trx.get(txRef);
      if (!txSnap.exists) {
        throw new Error("NOT_FOUND");
      }

      const txData = txSnap.data() ?? {};
      const transferGroupId = typeof txData.transferGroupId === "string" ? txData.transferGroupId : null;

      if (!transferGroupId) {
        const kasAccountId = typeof txData.kasAccountId === "string" ? txData.kasAccountId : "";
        const accountRef = orgRef.collection("kasAccounts").doc(kasAccountId);
        const amount = typeof txData.amount === "number" ? txData.amount : 0;
        const sign = txData.type === "income" ? 1 : -1;

        trx.update(accountRef, {
          balance: FieldValue.increment(-sign * amount),
          updatedAt: FieldValue.serverTimestamp(),
        });
        trx.delete(txRef);
        return [trimmedId];
      }

      const pairSnap = await trx.get(
        orgRef.collection("transactions").where("transferGroupId", "==", transferGroupId),
      );

      const ids: string[] = [];
      for (const doc of pairSnap.docs) {
        const data = doc.data();
        const kasAccountId = typeof data.kasAccountId === "string" ? data.kasAccountId : "";
        const accountRef = orgRef.collection("kasAccounts").doc(kasAccountId);
        const amount = typeof data.amount === "number" ? data.amount : 0;
        const sign = data.type === "transfer_in" ? 1 : -1;

        trx.update(accountRef, {
          balance: FieldValue.increment(-sign * amount),
          updatedAt: FieldValue.serverTimestamp(),
        });
        trx.delete(doc.ref);
        ids.push(doc.id);
      }

      return ids;
    });

    return { ok: true, transactionIds: deletedIds };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { ok: false, status: 404, error: "Transaksi tidak ditemukan" };
    }
    return { ok: false, status: 500, error: "Gagal menghapus transaksi" };
  }
}
