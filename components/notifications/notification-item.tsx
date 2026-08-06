"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, Cake, CalendarDays, MessageSquareReply, Trash2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNotificationTime, getCategoryLabel } from "@/lib/notifications/format";
import type { InAppNotification, NotificationCategory } from "@/lib/notifications/types";

const CATEGORY_ICONS: Record<NotificationCategory, typeof Bell> = {
  birthday: Cake,
  event: CalendarDays,
  vip: UserPlus,
  laporan: MessageSquareReply,
  general: Bell,
};

export function NotificationItem({
  notification,
  onOpen,
  onDelete,
}: {
  notification: InAppNotification;
  onOpen: (notification: InAppNotification) => void;
  onDelete: (notification: InAppNotification) => void;
}) {
  const router = useRouter();
  const Icon = CATEGORY_ICONS[notification.category];
  const timeLabel = formatNotificationTime(notification.createdAt);

  function handleActivate() {
    onOpen(notification);
    if (notification.url) {
      router.push(notification.url);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate();
    }
  }

  function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    onDelete(notification);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left shadow-sm backdrop-blur-xl transition-colors duration-200",
        notification.read
          ? "border-border bg-card/70 hover:bg-muted/60"
          : "border-primary/25 bg-primary/5 hover:bg-primary/10",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              notification.read ? "font-medium text-foreground" : "font-bold text-foreground",
            )}
          >
            {notification.title}
          </p>
          {!notification.read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{notification.body}</p>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{timeLabel}</span>
          <span className="text-border">•</span>
          <span>{getCategoryLabel(notification.category)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDeleteClick}
        aria-label="Hapus notifikasi"
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground/60 transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
