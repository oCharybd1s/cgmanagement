import Link from "next/link";
import { Wallet } from "lucide-react";
import { formatCurrencyIDR } from "@/lib/transactions/shared";
import type { KasAccount } from "@/lib/kas-accounts/types";
import type { CgGroup } from "@/lib/cg-groups/types";

function accountLabel(account: KasAccount, cgLabelById: Map<string, string>): string {
  if (account.accountType === "coach") {
    return "Kas Coach";
  }
  if (account.refId) {
    return cgLabelById.get(account.refId) ?? account.refId;
  }
  return "Kas CG";
}

export function KasSummaryCard({
  accounts,
  cgGroups,
}: {
  accounts: KasAccount[];
  cgGroups: CgGroup[];
}) {
  if (accounts.length === 0) {
    return null;
  }

  const cgLabelById = new Map(cgGroups.map((group) => [group.id, group.groupCode]));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Wallet className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="font-display text-base font-bold tracking-tight text-foreground">Ringkasan Keuangan</p>
            <p className="text-xs text-muted-foreground">Saldo kas terbaru</p>
          </div>
        </div>
        <Link
          href="/keuangan"
          className="hidden shrink-0 text-xs font-medium text-primary transition-colors duration-200 hover:underline sm:inline"
        >
          Lihat semua
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex flex-col gap-1 rounded-xl border border-border/70 bg-background/40 px-4 py-3"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {accountLabel(account, cgLabelById)}
            </p>
            <p className="font-mono text-lg font-bold tabular-nums text-foreground">
              {formatCurrencyIDR(account.balance)}
            </p>
            {!account.active ? (
              <span className="w-fit rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
                Nonaktif
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <Link
        href="/keuangan"
        className="text-center text-xs font-medium text-primary transition-colors duration-200 hover:underline sm:hidden"
      >
        Lihat semua
      </Link>
    </div>
  );
}
