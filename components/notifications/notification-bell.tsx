"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, Loader2, Inbox } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { InAppNotification } from "@/lib/notifications/types";

const BELL_PAGE_SIZE = 8;

export function NotificationBell() {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications({
    pageSize: BELL_PAGE_SIZE,
  });

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleOpenNotification(notification: InAppNotification) {
    setIsOpen(false);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  }

  function handleDeleteNotification(notification: InAppNotification) {
    deleteNotification(notification.id);
  }

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Notifikasi"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4.5 w-4.5" strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-mono text-[10px] font-semibold leading-none text-destructive-foreground">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 flex max-h-[28rem] w-[min(24rem,90vw)] flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <p className="font-display text-sm font-bold tracking-tight text-foreground">Notifikasi</p>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors duration-200 hover:bg-primary/10"
                >
                  <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Tandai semua dibaca
                </button>
              ) : null}
            </div>

            <div className="h-px bg-border" />

            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Memuat notifikasi...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Inbox className="h-4.5 w-4.5" strokeWidth={2} />
                  </span>
                  <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
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
            </div>

            <div className="h-px bg-border" />

            <Link
              href="/notifikasi"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-center text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/5"
            >
              Lihat semua notifikasi
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
