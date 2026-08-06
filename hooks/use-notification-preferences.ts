"use client";

import { useCallback, useEffect, useState } from "react";

export type NotificationPreferences = {
  birthday: boolean;
  event: boolean;
  vip: boolean;
  laporan: boolean;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  birthday: true,
  event: true,
  vip: true,
  laporan: true,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<keyof NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/notifications/preferences");
        const data = await response.json().catch(() => null);
        if (!cancelled && response.ok && data?.preferences) {
          setPreferences(data.preferences as NotificationPreferences);
        }
      } catch {
        if (!cancelled) {
          setError("Gagal memuat preferensi notifikasi");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(
    async (key: keyof NotificationPreferences) => {
      const nextValue = !preferences[key];
      const previous = preferences;

      setPreferences((current) => ({ ...current, [key]: nextValue }));
      setPendingKey(key);
      setError(null);

      try {
        const response = await fetch("/api/notifications/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: nextValue }),
        });

        if (!response.ok) {
          throw new Error("Gagal menyimpan preferensi notifikasi");
        }
      } catch {
        setPreferences(previous);
        setError("Gagal menyimpan preferensi notifikasi");
      } finally {
        setPendingKey(null);
      }
    },
    [preferences],
  );

  return { preferences, isLoading, pendingKey, error, toggle };
}
