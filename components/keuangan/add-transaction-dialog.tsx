"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateTransactionInput, type TransactionFieldErrors } from "@/lib/transactions/validation";
import { parseAmount } from "@/lib/transactions/shared";
import { getTodayDateInputValue } from "@/lib/meeting-reports/date";
import { AmountInput } from "@/components/keuangan/amount-input";
import type { Transaction, TransactionType } from "@/lib/transactions/types";

const inputClass =
  "w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

export function AddTransactionDialog({
  accounts,
  accountLabelById,
  onCreated,
}: {
  accounts: { id: string }[];
  accountLabelById: Map<string, string>;
  onCreated?: (transaction: Transaction) => void;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<TransactionFieldErrors>({});
  const [type, setType] = React.useState<TransactionType>("income");

  const canPickAccount = accounts.length > 1;

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function openDialog() {
    setFormError(null);
    setFieldErrors({});
    setType("income");
    setIsOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const kasAccountId = String(formData.get("kasAccountId") ?? "");
    const description = String(formData.get("description") ?? "");
    const date = String(formData.get("date") ?? "");
    const amount = parseAmount(formData.get("amount"));

    const errors = validateTransactionInput({ kasAccountId, type, amount, description, date });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kasAccountId, type, amount, description, date }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFormError(data.error ?? "Gagal menyimpan transaksi");
        setFieldErrors(data.fieldErrors ?? {});
        setIsSubmitting(false);
        return;
      }

      formRef.current?.reset();
      setType("income");
      setIsSubmitting(false);
      setIsOpen(false);
      onCreated?.(data.transaction);
    } catch {
      setFormError("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
    }
  }

  if (accounts.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        <PlusCircle className="h-4 w-4" strokeWidth={2} />
        Tambah Transaksi
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-transaction-dialog-title"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2
                  id="add-transaction-dialog-title"
                  className="font-display text-lg font-bold tracking-tight text-foreground"
                >
                  Tambah Transaksi
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Tutup"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5"
              >
                {canPickAccount ? (
                  <Field label="Akun Kas" htmlFor="kasAccountId" error={fieldErrors.kasAccountId} required>
                    <select id="kasAccountId" name="kasAccountId" disabled={isSubmitting} className={inputClass}>
                      <option value="">Pilih akun kas</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {accountLabelById.get(account.id) ?? account.id}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <input type="hidden" name="kasAccountId" value={accounts[0]?.id ?? ""} />
                )}

                <Field label="Jenis Transaksi" required>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("income")}
                      className={cn(
                        "rounded-full border-[1.5px] px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                        type === "income"
                          ? "border-success bg-success/15 text-success"
                          : "border-input text-muted-foreground hover:border-primary",
                      )}
                    >
                      Kredit (Masuk)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("expense")}
                      className={cn(
                        "rounded-full border-[1.5px] px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                        type === "expense"
                          ? "border-destructive bg-destructive/15 text-destructive"
                          : "border-input text-muted-foreground hover:border-primary",
                      )}
                    >
                      Debit (Keluar)
                    </button>
                  </div>
                  {fieldErrors.type ? <p className="text-xs text-destructive">{fieldErrors.type}</p> : null}
                </Field>

                <Field label="Nominal" htmlFor="amount" error={fieldErrors.amount} required>
                  <AmountInput
                    id="amount"
                    name="amount"
                    disabled={isSubmitting}
                    className={cn(inputClass, "font-mono")}
                  />
                </Field>

                <Field label="Tanggal" htmlFor="date" error={fieldErrors.date} required>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={getTodayDateInputValue()}
                    disabled={isSubmitting}
                    className={inputClass}
                  />
                </Field>

                <Field label="Keterangan" htmlFor="description" error={fieldErrors.description} required>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full resize-none rounded-2xl border-[1.5px] border-input bg-input/40 px-4 py-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </Field>

                {formError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {formError}
                  </p>
                ) : null}

                <div className="mt-1 flex items-center justify-end gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                    className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Transaksi"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
