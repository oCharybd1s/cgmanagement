"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import type { CgGroup } from "@/lib/cg-groups/types";

export function CreateCgGroupDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (cgGroup: CgGroup) => void;
}) {
  const [groupCode, setGroupCode] = React.useState("");
  const [groupName, setGroupName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const codeInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;

    codeInputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!groupCode.trim() || !groupName.trim()) {
      setError("Kode dan nama CG wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/cg-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupCode, groupName }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Gagal membuat CG");
        return;
      }

      onCreated(result.cgGroup as CgGroup);
      onClose();
    } catch {
      setError("Gagal membuat CG. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <React.Fragment>
          <motion.div
            key="create-cg-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            key="create-cg-panel"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-lg sm:inset-x-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-cg-title"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="create-cg-title" className="font-display text-lg font-bold tracking-tight text-foreground">
                Buat CG Baru
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

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cg-code" className="text-xs font-medium text-muted-foreground">
                  Kode CG
                </label>
                <input
                  ref={codeInputRef}
                  id="cg-code"
                  type="text"
                  value={groupCode}
                  onChange={(event) => setGroupCode(event.target.value)}
                  placeholder="SY38"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="cg-name" className="text-xs font-medium text-muted-foreground">
                  Nama CG
                </label>
                <input
                  id="cg-name"
                  type="text"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="CG Semangat Baru"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-50"
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="mt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
                  Buat CG
                </button>
              </div>
            </form>
          </motion.div>
        </React.Fragment>
      ) : null}
    </AnimatePresence>
  );
}
