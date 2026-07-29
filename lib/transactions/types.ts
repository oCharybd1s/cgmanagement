export type TransactionType = "income" | "expense" | "transfer_in" | "transfer_out";

export type Transaction = {
  id: string;
  kasAccountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  transferGroupId: string | null;
  counterpartAccountId: string | null;
  createdBy: string | null;
  createdAt: string | null;
};
