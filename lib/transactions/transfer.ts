import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canInitiateTransfer, canTransferBetweenKasAccounts } from "@/lib/auth/roles";
import { validateTransferInput, type TransferFieldErrors } from "@/lib/transactions/validation";
import { parseAmount, toStringValue } from "@/lib/transactions/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { Transaction } from "@/lib/transactions/types";

export type CreateTransferRequest = {
  fromAccountId: unknown;
  toAccountId: unknown;
  amount: unknown;
  description: unknown;
  date: unknown;
};

export type CreateTransferResult =
  | { ok: true; transactions: [Transaction, Transaction] }
  | { ok: false; status: number; error: string; fieldErrors?: TransferFieldErrors };

export async function createTransferForSession(
  session: SessionUser,
  payload: Partial<CreateTransferRequest>,
): Promise<CreateTransferResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canInitiateTransfer(session.role, session.isBendahara)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk transfer dana" };
  }

  const fromAccountId = toStringValue(payload.fromAccountId).trim();
  const toAccountId = toStringValue(payload.toAccountId).trim();
  const description = toStringValue(payload.description).trim();
  const date = toStringValue(payload.date).trim();
  const amount = parseAmount(payload.amount);

  const fieldErrors = validateTransferInput({ fromAccountId, toAccountId, amount, description, date });
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
  const fromRef = orgRef.collection("kasAccounts").doc(fromAccountId);
  const toRef = orgRef.collection("kasAccounts").doc(toAccountId);
  const outRef = orgRef.collection("transactions").doc();
  const inRef = orgRef.collection("transactions").doc();
  const transferGroupId = outRef.id;

  try {
    await adminDb.runTransaction(async (trx) => {
      const [fromSnap, toSnap] = await Promise.all([trx.get(fromRef), trx.get(toRef)]);

      if (!fromSnap.exists || !toSnap.exists) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      const fromData = fromSnap.data() ?? {};
      const toData = toSnap.data() ?? {};
      const fromAccount = {
        accountType: fromData.accountType === "coach" ? ("coach" as const) : ("cg" as const),
        refId: typeof fromData.refId === "string" ? fromData.refId : null,
        active: fromData.active !== false,
      };
      const toAccount = {
        accountType: toData.accountType === "coach" ? ("coach" as const) : ("cg" as const),
        refId: typeof toData.refId === "string" ? toData.refId : null,
        active: toData.active !== false,
      };

      if (
        !canTransferBetweenKasAccounts(
          session.role,
          session.cgGroupId,
          session.isBendahara,
          fromAccount,
          toAccount,
        )
      ) {
        throw new Error("FORBIDDEN");
      }

      trx.set(outRef, {
        kasAccountId: fromAccountId,
        type: "transfer_out",
        amount,
        description,
        date,
        transferGroupId,
        counterpartAccountId: toAccountId,
        createdBy: session.uid,
        createdAt: FieldValue.serverTimestamp(),
      });

      trx.set(inRef, {
        kasAccountId: toAccountId,
        type: "transfer_in",
        amount,
        description,
        date,
        transferGroupId,
        counterpartAccountId: fromAccountId,
        createdBy: session.uid,
        createdAt: FieldValue.serverTimestamp(),
      });

      trx.update(fromRef, {
        balance: FieldValue.increment(-(amount ?? 0)),
        updatedAt: FieldValue.serverTimestamp(),
      });
      trx.update(toRef, {
        balance: FieldValue.increment(amount ?? 0),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk transfer antar akun ini" };
    }
    if (error instanceof Error && error.message === "ACCOUNT_NOT_FOUND") {
      return { ok: false, status: 404, error: "Akun kas tidak ditemukan" };
    }
    return { ok: false, status: 500, error: "Gagal memproses transfer" };
  }

  const nowIso = Timestamp.now().toDate().toISOString();

  return {
    ok: true,
    transactions: [
      {
        id: outRef.id,
        kasAccountId: fromAccountId,
        type: "transfer_out",
        amount: amount ?? 0,
        description,
        date,
        transferGroupId,
        counterpartAccountId: toAccountId,
        createdBy: session.uid,
        createdAt: nowIso,
      },
      {
        id: inRef.id,
        kasAccountId: toAccountId,
        type: "transfer_in",
        amount: amount ?? 0,
        description,
        date,
        transferGroupId,
        counterpartAccountId: fromAccountId,
        createdBy: session.uid,
        createdAt: nowIso,
      },
    ],
  };
}
