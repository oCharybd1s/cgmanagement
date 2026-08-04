"use client";

import * as React from "react";
import { Loader2, Pencil, Search, SearchX, Trash2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  canInitiateTransfer,
  canManageKasAccount,
  canManageKasAccountStatus,
  canManageTransactionRecord,
} from "@/lib/auth/roles";
import {
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPE_SIGN,
  compareTransactionsAscending,
  formatCurrencyIDR,
  isEditableTransactionType,
} from "@/lib/transactions/shared";
import { rankBySearch } from "@/lib/search/fuzzy-match";
import { AddTransactionDialog } from "@/components/keuangan/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/keuangan/edit-transaction-dialog";
import { DeleteTransactionDialog } from "@/components/keuangan/delete-transaction-dialog";
import { TransferDialog } from "@/components/keuangan/transfer-dialog";
import type { KasAccount } from "@/lib/kas-accounts/types";
import type { Transaction, TransactionType } from "@/lib/transactions/types";
import type { CgGroup } from "@/lib/cg-groups/types";

function accountLabel(account: KasAccount): string {
  if (account.accountType === "coach") {
    return "Kas Coach";
  }
  return account.refId ?? "Kas CG";
}

function applyDelta(accounts: KasAccount[], kasAccountId: string, delta: number): KasAccount[] {
  return accounts.map((account) =>
    account.id === kasAccountId ? { ...account, balance: account.balance + delta } : account,
  );
}

function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function KeuanganDashboard({
  initialAccounts,
  initialTransactions,
  cgGroups,
  viewerRole,
  viewerCgGroupId,
  viewerIsBendahara,
}: {
  initialAccounts: KasAccount[];
  initialTransactions: Transaction[];
  cgGroups: CgGroup[];
  viewerRole: string | null;
  viewerCgGroupId: string | null;
  viewerIsBendahara: boolean;
}) {
  const [accounts, setAccounts] = React.useState(initialAccounts);
  const [transactions, setTransactions] = React.useState(initialTransactions);
  const [accountFilter, setAccountFilter] = React.useState<string>(() =>
    initialAccounts.length === 1 ? initialAccounts[0].id : "all",
  );
  const [typeFilter, setTypeFilter] = React.useState<TransactionType | "all">("all");
  const [search, setSearch] = React.useState("");
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = React.useState<Transaction | null>(null);

  const cgLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const group of cgGroups) {
      map.set(group.id, group.groupCode);
    }
    return map;
  }, [cgGroups]);

  const accountLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const account of accounts) {
      if (account.accountType === "cg" && account.refId) {
        map.set(account.id, cgLabelById.get(account.refId) ?? accountLabel(account));
      } else {
        map.set(account.id, accountLabel(account));
      }
    }
    return map;
  }, [accounts, cgLabelById]);

  const manageableAccounts = React.useMemo(
    () =>
      accounts.filter((account) =>
        canManageKasAccount(viewerRole, viewerCgGroupId, viewerIsBendahara, account),
      ),
    [accounts, viewerRole, viewerCgGroupId, viewerIsBendahara],
  );

  const canTransfer = canInitiateTransfer(viewerRole, viewerIsBendahara);
  const canManageRecords = canManageTransactionRecord(viewerRole);
  const canToggleStatus = canManageKasAccountStatus(viewerRole);
  const showAccountColumn = accounts.length > 1;

  const visibleTransactions = React.useMemo(() => {
    const matchingFilters = transactions.filter((transaction) => {
      const matchesAccount = accountFilter === "all" || transaction.kasAccountId === accountFilter;
      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      return matchesAccount && matchesType;
    });
    return rankBySearch(search, matchingFilters, (transaction) => [transaction.description]);
  }, [transactions, accountFilter, typeFilter, search]);

  const runningBalanceByTransactionId = React.useMemo(() => {
    const scopedTransactions = (
      accountFilter === "all"
        ? transactions
        : transactions.filter((transaction) => transaction.kasAccountId === accountFilter)
    )
      .slice()
      .sort(compareTransactionsAscending);

    const balances = new Map<string, number>();
    let runningTotal = 0;
    for (const transaction of scopedTransactions) {
      runningTotal += TRANSACTION_TYPE_SIGN[transaction.type] * transaction.amount;
      balances.set(transaction.id, runningTotal);
    }
    return balances;
  }, [transactions, accountFilter]);

  function handleTransactionCreated(transaction: Transaction) {
    setTransactions((current) => [transaction, ...current]);
    setAccounts((current) =>
      applyDelta(current, transaction.kasAccountId, TRANSACTION_TYPE_SIGN[transaction.type] * transaction.amount),
    );
  }

  function handleTransferCreated(pair: [Transaction, Transaction]) {
    setTransactions((current) => [...pair, ...current]);
    setAccounts((current) => {
      let next = current;
      for (const transaction of pair) {
        next = applyDelta(
          next,
          transaction.kasAccountId,
          TRANSACTION_TYPE_SIGN[transaction.type] * transaction.amount,
        );
      }
      return next;
    });
  }

  function handleTransactionUpdated(updated: Transaction) {
    const previous = transactions.find((item) => item.id === updated.id);
    if (previous) {
      const oldSigned = TRANSACTION_TYPE_SIGN[previous.type] * previous.amount;
      const newSigned = TRANSACTION_TYPE_SIGN[updated.type] * updated.amount;
      setAccounts((current) => applyDelta(current, updated.kasAccountId, newSigned - oldSigned));
    }
    setTransactions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setEditingTransaction(null);
  }

  function handleTransactionDeleted(transactionIds: string[]) {
    setAccounts((current) => {
      let next = current;
      for (const id of transactionIds) {
        const transaction = transactions.find((item) => item.id === id);
        if (transaction) {
          next = applyDelta(
            next,
            transaction.kasAccountId,
            -(TRANSACTION_TYPE_SIGN[transaction.type] * transaction.amount),
          );
        }
      }
      return next;
    });
    setTransactions((current) => current.filter((item) => !transactionIds.includes(item.id)));
    setDeletingTransaction(null);
  }

  function handleAccountStatusChanged(accountId: string, active: boolean) {
    setAccounts((current) =>
      current.map((account) => (account.id === accountId ? { ...account, active } : account)),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("grid gap-4", accounts.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-1")}>
        {accounts.map((account) => (
          <SummaryCard
            key={account.id}
            accountId={account.id}
            accountType={account.accountType}
            label={accountLabelById.get(account.id) ?? account.id}
            balance={account.balance}
            active={account.active}
            manageable={manageableAccounts.some((item) => item.id === account.id)}
            canToggleStatus={canToggleStatus}
            onStatusChanged={handleAccountStatusChanged}
          />
        ))}
        {accounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground sm:col-span-full">
            Belum ada akun kas yang bisa diakses. Pastikan Anda sudah terhubung ke CG.
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="transaction-search" className="sr-only">
            Cari keterangan transaksi
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <input
            id="transaction-search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari keterangan transaksi"
            className="w-full rounded-full border-[1.5px] border-input bg-input/40 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25"
          />
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {showAccountColumn ? (
            <select
              aria-label="Filter akun kas"
              value={accountFilter}
              onChange={(event) => setAccountFilter(event.target.value)}
              className="w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 sm:w-auto"
            >
              <option value="all">Semua Akun</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {accountLabelById.get(account.id) ?? account.id}
                </option>
              ))}
            </select>
          ) : null}

          <select
            aria-label="Filter jenis transaksi"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as TransactionType | "all")}
            className="w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 sm:w-auto"
          >
            <option value="all">Semua Jenis</option>
            {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {canTransfer ? (
            <TransferDialog
              accounts={manageableAccounts}
              accountLabelById={accountLabelById}
              onCreated={handleTransferCreated}
            />
          ) : null}

          <AddTransactionDialog
            accounts={manageableAccounts}
            accountLabelById={accountLabelById}
            onCreated={handleTransactionCreated}
          />
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyTransactionState />
      ) : visibleTransactions.length === 0 ? (
        <EmptySearchState />
      ) : (
        <React.Fragment>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {visibleTransactions.length} dari {transactions.length} transaksi
          </p>

          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card/70 shadow-sm backdrop-blur-xl md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Tanggal
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Jenis
                  </th>
                  {showAccountColumn ? (
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Akun
                    </th>
                  ) : null}
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Keterangan
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-medium">
                    Nominal
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-medium">
                    Total Saldo
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    accountLabel={accountLabelById.get(transaction.kasAccountId) ?? transaction.kasAccountId}
                    showAccountColumn={showAccountColumn}
                    runningBalance={runningBalanceByTransactionId.get(transaction.id) ?? 0}
                    canEdit={canManageRecords && isEditableTransactionType(transaction.type)}
                    canDelete={canManageRecords}
                    onEdit={() => setEditingTransaction(transaction)}
                    onDelete={() => setDeletingTransaction(transaction)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {visibleTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                accountLabel={accountLabelById.get(transaction.kasAccountId) ?? transaction.kasAccountId}
                showAccount={showAccountColumn}
                runningBalance={runningBalanceByTransactionId.get(transaction.id) ?? 0}
                canEdit={canManageRecords && isEditableTransactionType(transaction.type)}
                canDelete={canManageRecords}
                onEdit={() => setEditingTransaction(transaction)}
                onDelete={() => setDeletingTransaction(transaction)}
              />
            ))}
          </div>
        </React.Fragment>
      )}

      {editingTransaction ? (
        <EditTransactionDialog
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onUpdated={handleTransactionUpdated}
        />
      ) : null}

      {deletingTransaction ? (
        <DeleteTransactionDialog
          transaction={deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onDeleted={handleTransactionDeleted}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({
  accountId,
  accountType,
  label,
  balance,
  active,
  manageable,
  canToggleStatus,
  onStatusChanged,
}: {
  accountId: string;
  accountType: "coach" | "cg";
  label: string;
  balance: number;
  active: boolean;
  manageable: boolean;
  canToggleStatus: boolean;
  onStatusChanged: (accountId: string, active: boolean) => void;
}) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleToggle() {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await fetch(`/api/kas-accounts/${accountId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal mengubah status akun kas");
        setIsUpdating(false);
        return;
      }

      setIsUpdating(false);
      onStatusChanged(accountId, data.account.active);
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi");
      setIsUpdating(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5 shadow-sm backdrop-blur-xl",
        active ? "border-border bg-card/70" : "border-dashed border-border bg-muted/30",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Wallet className="h-4 w-4" strokeWidth={2} />
        </span>
        {!active ? (
          <Badge tone="destructive">Nonaktif</Badge>
        ) : manageable ? (
          <Badge tone="secondary">Bisa Dikelola</Badge>
        ) : null}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 font-mono text-2xl font-bold tabular-nums",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {formatCurrencyIDR(balance)}
        </p>
      </div>

      {canToggleStatus && accountType === "cg" ? (
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isUpdating}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
              active
                ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                : "border-success/30 text-success hover:bg-success/10",
            )}
          >
            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} /> : null}
            {active ? "Nonaktifkan Kas" : "Aktifkan Kembali"}
          </button>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function TransactionRow({
  transaction,
  accountLabel,
  showAccountColumn,
  runningBalance,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  accountLabel: string;
  showAccountColumn: boolean;
  runningBalance: number;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sign = TRANSACTION_TYPE_SIGN[transaction.type];
  const tone = sign > 0 ? "success" : "destructive";

  return (
    <tr className="transition-colors duration-200 hover:bg-muted/40">
      <td className="px-5 py-3.5 text-foreground">{formatDate(transaction.date)}</td>
      <td className="px-5 py-3.5">
        <Badge tone={tone}>{TRANSACTION_TYPE_LABELS[transaction.type]}</Badge>
      </td>
      {showAccountColumn ? (
        <td className="px-5 py-3.5">
          <Badge tone="secondary">{accountLabel}</Badge>
        </td>
      ) : null}
      <td className="max-w-xs px-5 py-3.5 text-foreground">
        <p className="truncate">{transaction.description}</p>
      </td>
      <td
        className={cn(
          "px-5 py-3.5 text-right font-mono tabular-nums",
          tone === "success" ? "text-success" : "text-destructive",
        )}
      >
        {sign > 0 ? "+" : "-"}
        {formatCurrencyIDR(transaction.amount)}
      </td>
      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-foreground">
        {formatCurrencyIDR(runningBalance)}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-2">
          {canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Ubah transaksi"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Hapus transaksi"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function TransactionCard({
  transaction,
  accountLabel,
  showAccount,
  runningBalance,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  accountLabel: string;
  showAccount: boolean;
  runningBalance: number;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sign = TRANSACTION_TYPE_SIGN[transaction.type];
  const tone = sign > 0 ? "success" : "destructive";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
          <Badge tone={tone}>{TRANSACTION_TYPE_LABELS[transaction.type]}</Badge>
        </div>
        <p className={cn("font-mono text-sm font-semibold tabular-nums", tone === "success" ? "text-success" : "text-destructive")}>
          {sign > 0 ? "+" : "-"}
          {formatCurrencyIDR(transaction.amount)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {showAccount ? <Badge tone="secondary">{accountLabel}</Badge> : null}
      </div>

      <p className="border-t border-border pt-3 text-sm text-foreground">{transaction.description}</p>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">Total Saldo</span>
        <span className="font-mono tabular-nums text-foreground">{formatCurrencyIDR(runningBalance)}</span>
      </div>

      {canEdit || canDelete ? (
        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          {canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Ubah
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors duration-200 hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Hapus
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "secondary" | "success" | "destructive";
  children: React.ReactNode;
}) {
  const toneClasses: Record<typeof tone, string> = {
    secondary: "bg-secondary text-secondary-foreground",
    success: "bg-success text-success-foreground",
    destructive: "bg-destructive/15 text-destructive",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneClasses[tone])}>
      {children}
    </span>
  );
}

function EmptyTransactionState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Wallet className="h-5 w-5" strokeWidth={2} />
      </span>
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">Belum ada transaksi</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Catat transaksi pertama dengan tombol &quot;Tambah Transaksi&quot; di atas.
      </p>
    </div>
  );
}

function EmptySearchState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-4 w-4" strokeWidth={2} />
      </span>
      <p className="text-sm font-medium text-foreground">Tidak ada transaksi yang cocok</p>
      <p className="text-xs text-muted-foreground">Coba kata kunci atau filter lain.</p>
    </div>
  );
}
