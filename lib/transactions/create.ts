import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canManageKasAccount } from "@/lib/auth/roles";
import { validateTransactionInput, type TransactionFieldErrors } from "@/lib/transactions/validation";
import { toStringValue, parseAmount } from "@/lib/transactions/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { Transaction, TransactionType } from "@/lib/transactions/types";

export type CreateTransactionRequest = {
  kasAccountId: unknown;
  type: unknown;
  amount: unknown;
  description: unknown;
  date: unknown;
};

export type CreateTransactionResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; status: number; error: string; fieldErrors?: TransactionFieldErrors };

export async function createTransactionForSession(
  session: SessionUser,
  payload: Partial<CreateTransactionRequest>,
): Promise<CreateTransactionResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const kasAccountId = toStringValue(payload.kasAccountId).trim();
  const description = toStringValue(payload.description).trim();
  const date = toStringValue(payload.date).trim();
  const amount = parseAmount(payload.amount);
  const type = payload.type;

  const fieldErrors = validateTransactionInput({ kasAccountId, type, amount, description, date });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, error: "Periksa kembali data yang diisi", fieldErrors };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;

  const orgRef = adminDb.collection("organizations").doc(session.orgId);
  const accountRef = orgRef.collection("kasAccounts").doc(kasAccountId);
  const txRef = orgRef.collection("transactions").doc();

  const transactionType = type as TransactionType;
  const sign = transactionType === "income" ? 1 : -1;

  try {
    await adminDb.runTransaction(async (trx) => {
      const accountSnap = await trx.get(accountRef);
      if (!accountSnap.exists) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      const accountData = accountSnap.data() ?? {};
      const account = {
        accountType: accountData.accountType === "coach" ? ("coach" as const) : ("cg" as const),
        refId: typeof accountData.refId === "string" ? accountData.refId : null,
        active: accountData.active !== false,
      };

      if (!canManageKasAccount(session.role, session.cgGroupId, session.isBendahara, account)) {
        throw new Error("FORBIDDEN");
      }

      trx.set(txRef, {
        kasAccountId,
        type: transactionType,
        amount,
        description,
        date,
        transferGroupId: null,
        counterpartAccountId: null,
        createdBy: session.uid,
        createdAt: FieldValue.serverTimestamp(),
      });

      trx.update(accountRef, {
        balance: FieldValue.increment(sign * (amount ?? 0)),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mencatat transaksi ini" };
    }
    if (error instanceof Error && error.message === "ACCOUNT_NOT_FOUND") {
      return { ok: false, status: 404, error: "Akun kas tidak ditemukan" };
    }
    return { ok: false, status: 500, error: "Gagal menyimpan transaksi" };
  }

  return {
    ok: true,
    transaction: {
      id: txRef.id,
      kasAccountId,
      type: transactionType,
      amount: amount ?? 0,
      description,
      date,
      transferGroupId: null,
      counterpartAccountId: null,
      createdBy: session.uid,
      createdAt: Timestamp.now().toDate().toISOString(),
    },
  };
}
