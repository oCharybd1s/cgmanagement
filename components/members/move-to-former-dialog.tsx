"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, UserMinus, X } from "lucide-react";
import type { Member } from "@/lib/members/types";
import type { FormerMemberReason } from "@/lib/former-members/types";

const REASON_OPTIONS: { value: FormerMemberReason; label: string }[] = [
  { value: "graduated", label: "Lulus" },
  { value: "moved", label: "Pindah Kota" },
  { value: "unresponsive", label: "Tidak Merespon" },
  { value: "other", label: "Lainnya" },
];

export function MoveToFormerDialog({
  member,
  onClose,
  onMoved,
}: {
  member: Member;
  onClose: () => void;
  onMoved: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = React.useState<FormerMemberReason>("other");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/members/${member.id}/move-to-former`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, notes: notes.trim() || null }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal memindahkan anggota ke Alumni");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onMoved();
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
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
          if (!isSubmitting) {
            onClose();
          }
        }}
      >
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="move-to-former-dialog-title"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(event) => event.stopPropagation()}
          className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2
              id="move-to-former-dialog-title"
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              Jadikan Alumni
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-5 px-6 py-5">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{member.fullName || "Anggota ini"}</span> akan
              dipindahkan ke daftar Alumni. Akun login mereka akan dihapus.
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="move-to-former-reason" className="text-xs font-medium text-muted-foreground">
                Alasan
              </label>
              <select
                id="move-to-former-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value as FormerMemberReason)}
                disabled={isSubmitting}
                className="w-full rounded-xl border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="move-to-former-notes" className="text-xs font-medium text-muted-foreground">
                Catatan <span className="font-normal">(opsional)</span>
              </label>
              <textarea
                id="move-to-former-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={isSubmitting}
                rows={3}
                placeholder="Tambahkan catatan jika perlu"
                className="w-full resize-none rounded-xl border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
              />
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
                disabled={isSubmitting}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                    Memproses...
                  </>
                ) : (
                  <>
                    <UserMinus className="h-4 w-4" strokeWidth={2} />
                    Jadikan Alumni
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
