"use client";

import * as React from "react";
import { Bell, BellRing, Loader2, CheckCircle2, Radio } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

type NotificationTestCardProps = {
  canBroadcast: boolean;
};

export function NotificationTestCard({ canBroadcast }: NotificationTestCardProps) {
  const { status, isRegistered, isBusy, error, enable } = usePushNotifications();
  const [isSending, setIsSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [justSent, setJustSent] = React.useState<"self" | "broadcast" | null>(null);

  async function sendTo(endpoint: string, mode: "self" | "broadcast") {
    setSendError(null);
    setIsSending(true);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setSendError(data?.error ?? "Gagal mengirim notifikasi test");
        return;
      }
      setJustSent(mode);
      window.setTimeout(() => setJustSent(null), 4000);
    } catch {
      setSendError("Gagal mengirim notifikasi test");
    } finally {
      setIsSending(false);
    }
  }

  if (status === "unsupported") {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Bell className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="font-display text-base font-bold tracking-tight text-foreground">Push Notification</p>
          <p className="text-xs text-muted-foreground">Setup & test pengiriman notifikasi ke perangkat ini</p>
        </div>
      </div>

      {!isRegistered ? (
        <button
          type="button"
          onClick={enable}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <BellRing className="h-4 w-4" strokeWidth={2} />}
          Aktifkan Notifikasi
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => sendTo("/api/notifications/test", "self")}
            disabled={isSending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <BellRing className="h-4 w-4" strokeWidth={2} />}
            Kirim ke Saya
          </button>

          {canBroadcast && (
            <button
              type="button"
              onClick={() => sendTo("/api/notifications/broadcast-test", "broadcast")}
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Radio className="h-4 w-4" strokeWidth={2} />}
              Kirim ke Semua Anggota
            </button>
          )}
        </div>
      )}

      {status === "denied" && (
        <p className="text-xs text-destructive">
          Izin notifikasi ditolak. Aktifkan lewat pengaturan browser/perangkat untuk mencoba lagi.
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {sendError && <p className="text-xs text-destructive">{sendError}</p>}

      {justSent === "self" && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          Notifikasi terkirim, cek perangkatmu
        </p>
      )}

      {justSent === "broadcast" && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          Broadcast terkirim ke semua perangkat aktif
        </p>
      )}
    </div>
  );
}
