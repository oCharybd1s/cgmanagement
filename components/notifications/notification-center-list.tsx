"use client";

import { CheckCheck, Inbox, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { InAppNotification } from "@/lib/notifications/types";

export function NotificationCenterList({
  initialNotifications,
  initialUnreadCount,
  initialCursor,
}: {
  initialNotifications: InAppNotification[];
  initialUnreadCount: number;
  initialCursor: string | null;
}) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    initialNotifications,
    initialUnreadCount,
    initialCursor,
  });

  function handleOpenNotification(notification: InAppNotification) {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  }

  function handleDeleteNotification(notification: InAppNotification) {
    deleteNotification(notification.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight text-foreground">Notifikasi</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-secondary"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={2} />
            Tandai semua dibaca
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/70 py-16 text-sm text-muted-foreground shadow-sm backdrop-blur-xl">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          Memuat notifikasi...
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Inbox className="h-5 w-5" strokeWidth={2} />
          </span>
          <h3 className="font-display text-base font-bold tracking-tight text-foreground">Belum ada notifikasi</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Notifikasi ulang tahun, event, dan lainnya akan muncul di sini, termasuk yang terlewat saat kamu tidak membuka aplikasi.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={handleOpenNotification}
              onDelete={handleDeleteNotification}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={() => loadMore()}
          disabled={isLoadingMore}
          className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
          Muat Lebih Banyak
        </button>
      ) : null}
    </div>
  );
}
