import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canManageTransactionRecord } from "@/lib/auth/roles";
import { validateTransactionInput, type TransactionFieldErrors } from "@/lib/transactions/validation";
import { isEditableTransactionType, isTransactionType, parseAmount, toStringValue } from "@/lib/transactions/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { Transaction, TransactionType } from "@/lib/transactions/types";

export type UpdateTransactionRequest = {
  type: unknown;
  amount: unknown;
  description: unknown;
  date: unknown;
};

export type UpdateTransactionResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; status: number; error: string; fieldErrors?: TransactionFieldErrors };

class ValidationError extends Error {
  fieldErrors: TransactionFieldErrors;

  constructor(fieldErrors: TransactionFieldErrors) {
    super("VALIDATION_ERROR");
    this.fieldErrors = fieldErrors;
  }
}

export async function updateTransactionForSession(
  session: SessionUser,
  transactionId: string,
  payload: Partial<UpdateTransactionRequest>,
): Promise<UpdateTransactionResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canManageTransactionRecord(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mengubah transaksi" };
  }

  const trimmedId = transactionId.trim();
  if (!trimmedId) {
    return { ok: false, status: 400, error: "Transaksi tidak valid" };
  }

  const description = toStringValue(payload.description).trim();
  const date = toStringValue(payload.date).trim();
  const amount = parseAmount(payload.amount);
  const requestedType = payload.type;

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
    const updated = await adminDb.runTransaction(async (trx) => {
      const txSnap = await trx.get(txRef);
      if (!txSnap.exists) {
        throw new Error("NOT_FOUND");
      }

      const txData = txSnap.data() ?? {};
      const currentType = isTransactionType(txData.type) ? txData.type : "expense";

      if (!isEditableTransactionType(currentType)) {
        throw new Error("NOT_EDITABLE");
      }

      const nextType: TransactionType =
        requestedType === "income" || requestedType === "expense" ? requestedType : currentType;

      const kasAccountId = typeof txData.kasAccountId === "string" ? txData.kasAccountId : "";
      const fieldErrors = validateTransactionInput({
        kasAccountId,
        type: nextType,
        amount,
        description,
        date,
      });
      if (Object.keys(fieldErrors).length > 0) {
        throw new ValidationError(fieldErrors);
      }

      const currentAmount = typeof txData.amount === "number" ? txData.amount : 0;
      const oldSignedAmount = (currentType === "income" ? 1 : -1) * currentAmount;
      const newSignedAmount = (nextType === "income" ? 1 : -1) * (amount ?? 0);
      const delta = newSignedAmount - oldSignedAmount;

      const accountRef = orgRef.collection("kasAccounts").doc(kasAccountId);
      trx.update(accountRef, {
        balance: FieldValue.increment(delta),
        updatedAt: FieldValue.serverTimestamp(),
      });

      trx.update(txRef, {
        type: nextType,
        amount,
        description,
        date,
        updatedBy: session.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const transaction: Transaction = {
        id: trimmedId,
        kasAccountId,
        type: nextType,
        amount: amount ?? 0,
        description,
        date,
        transferGroupId: null,
        counterpartAccountId: null,
        createdBy: typeof txData.createdBy === "string" ? txData.createdBy : null,
        createdAt: null,
      };

      return transaction;
    });

    return { ok: true, transaction: updated };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { ok: false, status: 400, error: "Periksa kembali data yang diisi", fieldErrors: error.fieldErrors };
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { ok: false, status: 404, error: "Transaksi tidak ditemukan" };
    }
    if (error instanceof Error && error.message === "NOT_EDITABLE") {
      return { ok: false, status: 400, error: "Transaksi transfer tidak bisa diubah, hapus lalu buat ulang" };
    }
    return { ok: false, status: 500, error: "Gagal menyimpan perubahan transaksi" };
  }
}
