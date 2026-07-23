"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { Member } from "@/lib/members/types";

export function DeleteMemberDialog({
  member,
  onClose,
  onDeleted,
}: {
  member: Member;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onClose]);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal menghapus anggota");
        setIsDeleting(false);
        return;
      }

      setIsDeleting(false);
      onDeleted();
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi");
      setIsDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={() => {
          if (!isDeleting) {
            onClose();
          }
        }}
      >
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-member-dialog-title"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(event) => event.stopPropagation()}
          className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2
              id="delete-member-dialog-title"
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              Hapus Anggota
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" strokeWidth={2} />
              <p className="text-sm text-foreground">
                Data <span className="font-semibold">{member.fullName || "anggota ini"}</span> beserta akun
                loginnya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                    Menghapus...
                  </>
                ) : (
                  "Hapus Permanen"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
