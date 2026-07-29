export type KasAccountType = "coach" | "cg";

export type KasAccount = {
  id: string;
  accountType: KasAccountType;
  refId: string | null;
  balance: number;
  active: boolean;
};
