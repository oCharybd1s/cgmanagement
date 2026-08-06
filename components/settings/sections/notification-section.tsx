"use client";

import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useNotificationPreferences, type NotificationPreferences } from "@/hooks/use-notification-preferences";
import { cn } from "@/lib/utils";

const CATEGORY_ITEMS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "birthday", label: "Ulang Tahun", description: "Notifikasi ulang tahun anggota dan reminder H-7" },
  { key: "event", label: "Event", description: "Notifikasi event dan pertemuan mendatang" },
  { key: "vip", label: "List VIP", description: "Notifikasi saat Anda ditugaskan follow-up VIP baru" },
  { key: "laporan", label: "Laporan CG", description: "Notifikasi saat Coach merespon Laporan CG Anda" },
];

export function NotificationSection() {
  const { status, isRegistered, isBusy, error: pushError, enable } = usePushNotifications();
  const { preferences, isLoading, pendingKey, error: prefError, toggle } = useNotificationPreferences();

  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        Perangkat atau browser ini tidak mendukung push notification.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
          <p className="flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
            Notifikasi aktif di perangkat ini
          </p>
        )}

        {status === "denied" && (
          <p className="text-xs text-destructive">
            Izin notifikasi ditolak. Aktifkan lewat pengaturan browser/perangkat untuk mencoba lagi.
          </p>
        )}

        {pushError && <p className="text-xs text-destructive">{pushError}</p>}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Kategori Notifikasi</p>
          <p className="text-xs text-muted-foreground">Atur kategori mana saja yang ingin Anda terima.</p>
        </div>

        <div className="flex flex-col gap-3">
          {CATEGORY_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences[item.key]}
                aria-label={`Notifikasi ${item.label}`}
                disabled={isLoading || pendingKey === item.key}
                onClick={() => toggle(item.key)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                  preferences[item.key] ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform duration-200",
                    preferences[item.key] ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        {prefError && <p className="text-xs text-destructive">{prefError}</p>}
      </div>
    </div>
  );
}
