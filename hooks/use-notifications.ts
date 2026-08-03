"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InAppNotification } from "@/lib/notifications/types";

type NotificationsResponse = {
  ok: boolean;
  notifications?: InAppNotification[];
  nextCursor?: string | null;
  unreadCount?: number;
  error?: string;
};

const POLL_INTERVAL_MS = 60000;
const DEFAULT_PAGE_SIZE = 30;

export type UseNotificationsOptions = {
  initialNotifications?: InAppNotification[];
  initialUnreadCount?: number;
  initialCursor?: string | null;
  pageSize?: number;
};

export type UseNotificationsResult = {
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
};

export function useNotifications(options?: UseNotificationsOptions): UseNotificationsResult {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const hasInitialData = Boolean(options?.initialNotifications);

  const [notifications, setNotifications] = useState<InAppNotification[]>(options?.initialNotifications ?? []);
  const [unreadCount, setUnreadCount] = useState(options?.initialUnreadCount ?? 0);
  const [nextCursor, setNextCursor] = useState<string | null>(options?.initialCursor ?? null);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedOnce = useRef(hasInitialData);

  const fetchFirstPage = useCallback(async () => {
    setIsLoading((previous) => (hasFetchedOnce.current ? previous : true));
    setError(null);

    try {
      const response = await fetch(`/api/notifications?limit=${pageSize}`, { cache: "no-store" });
      const data: NotificationsResponse = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal memuat notifikasi");
        return;
      }

      setNotifications(data.notifications ?? []);
      setNextCursor(data.nextCursor ?? null);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setError("Gagal memuat notifikasi");
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    if (hasFetchedOnce.current) {
      return;
    }
    hasFetchedOnce.current = true;
    fetchFirstPage();
  }, [fetchFirstPage]);

  useEffect(() => {
    const interval = window.setInterval(fetchFirstPage, POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchFirstPage();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/notifications?limit=${pageSize}&cursor=${encodeURIComponent(nextCursor)}`,
        { cache: "no-store" },
      );
      const data: NotificationsResponse = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal memuat notifikasi");
        return;
      }

      setNotifications((previous) => [...previous, ...(data.notifications ?? [])]);
      setNextCursor(data.nextCursor ?? null);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setError("Gagal memuat notifikasi");
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, pageSize]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((previous) =>
      previous.map((item) => (item.id === notificationId && !item.read ? { ...item, read: true } : item)),
    );
    setUnreadCount((previous) => Math.max(0, previous - 1));

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: "PATCH" });
      if (!response.ok) {
        setError("Gagal menandai notifikasi sebagai dibaca");
      }
    } catch {
      setError("Gagal menandai notifikasi sebagai dibaca");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications/read-all", { method: "POST" });
      if (!response.ok) {
        setError("Gagal menandai semua notifikasi sebagai dibaca");
      }
    } catch {
      setError("Gagal menandai semua notifikasi sebagai dibaca");
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    let wasUnread = false;
    setNotifications((previous) => {
      const target = previous.find((item) => item.id === notificationId);
      wasUnread = Boolean(target && !target.read);
      return previous.filter((item) => item.id !== notificationId);
    });
    if (wasUnread) {
      setUnreadCount((previous) => Math.max(0, previous - 1));
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Gagal menghapus notifikasi");
      }
    } catch {
      setError("Gagal menghapus notifikasi");
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    error,
    hasMore: nextCursor !== null,
    refresh: fetchFirstPage,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
