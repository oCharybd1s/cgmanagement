import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canReadKasAccount } from "@/lib/auth/roles";
import { isTransactionType } from "@/lib/transactions/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { KasAccount } from "@/lib/kas-accounts/types";
import type { Transaction, TransactionType } from "@/lib/transactions/types";

export function accountIdsVisibleToSession(session: SessionUser, accounts: KasAccount[]): string[] {
  return accounts
    .filter((account) => canReadKasAccount(session.role, session.cgGroupId, account))
    .map((account) => account.id);
}

export async function getTransactionsForAccounts(orgId: string, accountIds: string[]): Promise<Transaction[]> {
  if (!orgId || accountIds.length === 0) {
    return [];
  }

  const { adminDb } = getAdminServices();
  const transactionsRef = adminDb.collection("organizations").doc(orgId).collection("transactions");

  const chunks = chunkArray(accountIds, 10);
  const snapshots = await Promise.all(
    chunks.map((chunk) => transactionsRef.where("kasAccountId", "in", chunk).get()),
  );

  const docs = snapshots.flatMap((snapshot) => snapshot.docs);
  return docs.map(toTransaction).sort(compareTransactionsDesc);
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function compareTransactionsDesc(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

function toTransaction(doc: QueryDocumentSnapshot): Transaction {
  const data = doc.data();

  return {
    id: doc.id,
    kasAccountId: readString(data.kasAccountId) ?? "",
    type: toType(data.type),
    amount: typeof data.amount === "number" ? data.amount : 0,
    description: readString(data.description) ?? "",
    date: readString(data.date) ?? "",
    transferGroupId: readString(data.transferGroupId),
    counterpartAccountId: readString(data.counterpartAccountId),
    createdBy: readString(data.createdBy),
    createdAt: toIsoString(data.createdAt),
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toType(value: unknown): TransactionType {
  return isTransactionType(value) ? value : "expense";
}

function toIsoString(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}
