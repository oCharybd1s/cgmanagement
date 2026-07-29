import { isTransactionType } from "@/lib/transactions/shared";

export type TransactionFieldErrors = Partial<
  Record<"kasAccountId" | "type" | "amount" | "description" | "date", string>
>;

export function validateTransactionInput(input: {
  kasAccountId: string;
  type: unknown;
  amount: number | null;
  description: string;
  date: string;
}): TransactionFieldErrors {
  const errors: TransactionFieldErrors = {};

  if (input.kasAccountId.trim() === "") {
    errors.kasAccountId = "Akun kas wajib dipilih";
  }

  if (!isTransactionType(input.type) || input.type === "transfer_in" || input.type === "transfer_out") {
    errors.type = "Jenis transaksi tidak valid";
  }

  if (input.amount === null || input.amount <= 0) {
    errors.amount = "Nominal wajib diisi dan lebih dari 0";
  }

  if (input.description.trim() === "") {
    errors.description = "Keterangan wajib diisi";
  }

  if (input.date.trim() === "") {
    errors.date = "Tanggal wajib diisi";
  }

  return errors;
}

export type TransferFieldErrors = Partial<
  Record<"fromAccountId" | "toAccountId" | "amount" | "description" | "date", string>
>;

export function validateTransferInput(input: {
  fromAccountId: string;
  toAccountId: string;
  amount: number | null;
  description: string;
  date: string;
}): TransferFieldErrors {
  const errors: TransferFieldErrors = {};

  if (input.fromAccountId.trim() === "") {
    errors.fromAccountId = "Akun asal wajib dipilih";
  }

  if (input.toAccountId.trim() === "") {
    errors.toAccountId = "Akun tujuan wajib dipilih";
  }

  if (
    input.fromAccountId.trim() !== "" &&
    input.toAccountId.trim() !== "" &&
    input.fromAccountId === input.toAccountId
  ) {
    errors.toAccountId = "Akun tujuan harus berbeda dari akun asal";
  }

  if (input.amount === null || input.amount <= 0) {
    errors.amount = "Nominal wajib diisi dan lebih dari 0";
  }

  if (input.description.trim() === "") {
    errors.description = "Keterangan wajib diisi";
  }

  if (input.date.trim() === "") {
    errors.date = "Tanggal wajib diisi";
  }

  return errors;
}
