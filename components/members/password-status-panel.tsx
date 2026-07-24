"use client";

import * as React from "react";
import { Check, Copy, Eye, KeyRound, Loader2 } from "lucide-react";
import type { Member } from "@/lib/members/types";

export function PasswordStatusPanel({
  member,
  onResetPassword,
}: {
  member: Member;
  onResetPassword: () => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [revealedPassword, setRevealedPassword] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function handleReveal() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/members/${member.id}/reset-password`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal mengambil status password");
        setIsLoading(false);
        return;
      }

      setRevealedPassword(typeof data.temporaryPasswordPending === "string" ? data.temporaryPasswordPending : null);
      setIsLoading(false);
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi");
      setIsLoading(false);
    }
  }

  async function copyPassword() {
    if (!revealedPassword) {
      return;
    }
    try {
      await navigator.clipboard.writeText(revealedPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!member.mustChangePassword) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Anggota ini sudah pernah mengganti password sendiri.</p>
        <button
          type="button"
          onClick={onResetPassword}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
        >
          <KeyRound className="h-3.5 w-3.5" strokeWidth={2} />
          Reset Password
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-warning/40 bg-warning/10 p-4 text-left">
      <p className="text-xs font-medium uppercase tracking-wide text-warning-foreground">Belum Ganti Password</p>

      {revealedPassword ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">{revealedPassword}</span>
          <button
            type="button"
            onClick={copyPassword}
            className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            {copied ? "Tersalin" : "Salin"}
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Password sementara belum diambil</p>
          <button
            type="button"
            onClick={handleReveal}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            Lihat
          </button>
        </div>
      )}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onResetPassword}
          className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 px-3 py-1.5 text-xs font-semibold text-warning-foreground transition-colors duration-200 hover:bg-warning/20"
        >
          <KeyRound className="h-3.5 w-3.5" strokeWidth={2} />
          Reset Password
        </button>
      </div>
    </div>
  );
}
