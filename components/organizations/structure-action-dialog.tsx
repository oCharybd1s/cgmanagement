"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type StructureActionOutcome = { ok: true } | { ok: false; error: string };

export function StructureActionDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "primary",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "destructive";
  onClose: () => void;
  onConfirm: () => Promise<StructureActionOutcome>;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);

    const outcome = await onConfirm();

    if (!outcome.ok) {
      setError(outcome.error);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <React.Fragment>
          <motion.div
            key="structure-action-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            key="structure-action-panel"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-lg sm:inset-x-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="structure-action-title"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="structure-action-title"
                className="font-display text-lg font-bold tracking-tight text-foreground"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Tutup"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">{description}</p>

            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-200 disabled:opacity-50",
                  tone === "destructive"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      ) : null}
    </AnimatePresence>
  );
}
