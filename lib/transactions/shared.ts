import type { Transaction, TransactionType } from "@/lib/transactions/types";

const TRANSACTION_TYPE_VALUES: TransactionType[] = ["income", "expense", "transfer_in", "transfer_out"];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Kredit (Masuk)",
  expense: "Debit (Keluar)",
  transfer_in: "Transfer Masuk",
  transfer_out: "Transfer Keluar",
};

export const TRANSACTION_TYPE_SIGN: Record<TransactionType, 1 | -1> = {
  income: 1,
  expense: -1,
  transfer_in: 1,
  transfer_out: -1,
};

export function isTransactionType(value: unknown): value is TransactionType {
  return TRANSACTION_TYPE_VALUES.includes(value as TransactionType);
}

export function isEditableTransactionType(type: TransactionType): boolean {
  return type === "income" || type === "expense";
}

export function compareTransactionsAscending(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) {
    return a.date < b.date ? -1 : 1;
  }
  return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
}

export function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeOptional(value: unknown): string | null {
  const text = toStringValue(value).trim();
  return text === "" ? null : text;
}

export function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? Math.round(value) : null;
  }
  if (typeof value === "string") {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    if (digitsOnly === "") {
      return null;
    }
    const parsed = Number(digitsOnly);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

export function formatCurrencyIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
