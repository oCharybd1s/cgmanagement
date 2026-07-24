"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Copy, KeyRound, Loader2, X } from "lucide-react";
import type { Member } from "@/lib/members/types";

export function ResetPasswordDialog({
  member,
  onClose,
  onReset,
}: {
  member: Member;
  onClose: () => void;
  onReset: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/members/${member.id}/reset-password`, { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal mereset password");
        setIsSubmitting(false);
        return;
      }

      setTemporaryPassword(data.temporaryPassword);
      setIsSubmitting(false);
      onReset();
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
    }
  }

  async function copyPassword() {
    if (!temporaryPassword) {
      return;
    }
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
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
          aria-labelledby="reset-password-dialog-title"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(event) => event.stopPropagation()}
          className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2
              id="reset-password-dialog-title"
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              Reset Password
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

          <div className="flex flex-col gap-4 px-6 py-5">
            {temporaryPassword ? (
              <div className="w-full rounded-2xl border border-warning/40 bg-warning/10 p-4 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-warning-foreground">
                  Password Sementara Baru
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">{temporaryPassword}</span>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                    {copied ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Password lama {member.fullName || "anggota ini"} sudah tidak berlaku. Teruskan password baru
                  ini, mereka akan diminta ganti password saat login berikutnya.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" strokeWidth={2} />
                <p className="text-sm text-foreground">
                  Password login <span className="font-semibold">{member.fullName || "anggota ini"}</span> saat
                  ini akan langsung tidak berlaku, diganti password sementara yang baru.
                </p>
              </div>
            )}

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-3">
              {temporaryPassword ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Selesai
                </button>
              ) : (
                <>
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
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        Mereset...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" strokeWidth={2} />
                        Reset Password
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
