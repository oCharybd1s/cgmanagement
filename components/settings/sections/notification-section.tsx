"use client";

import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function NotificationSection() {
  const { status, isRegistered, isBusy, error, enable } = usePushNotifications();

  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        Perangkat atau browser ini tidak mendukung push notification.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Push Notification</p>
        <p className="text-xs text-muted-foreground">
          Terima notifikasi ulang tahun, event, dan info lainnya langsung di perangkat ini.
        </p>
      </div>

      {!isRegistered ? (
        <button
          type="button"
          onClick={enable}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <BellRing className="h-4 w-4" strokeWidth={2} />}
          Aktifkan Notifikasi
        </button>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          Notifikasi aktif di perangkat ini
        </p>
      )}

      {status === "denied" && (
        <p className="text-xs text-destructive">
          Izin notifikasi ditolak. Aktifkan lewat pengaturan browser/perangkat untuk mencoba lagi.
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
