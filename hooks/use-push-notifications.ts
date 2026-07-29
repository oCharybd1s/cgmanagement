"use client";

import { useCallback, useState } from "react";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/firebase";

export type PushPermissionStatus = "unsupported" | "default" | "denied" | "granted";

type UsePushNotificationsResult = {
  status: PushPermissionStatus;
  isBusy: boolean;
  error: string | null;
  enable: () => Promise<void>;
};

async function registerTokenWithServer(token: string): Promise<void> {
  const response = await fetch("/api/notifications/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, userAgent: navigator.userAgent }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Gagal mendaftarkan perangkat");
  }
}

function getInitialStatus(): PushPermissionStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as PushPermissionStatus;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [status, setStatus] = useState<PushPermissionStatus>(getInitialStatus);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enable = useCallback(async () => {
    setError(null);
    setIsBusy(true);

    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        setStatus("unsupported");
        return;
      }

      const permission = await Notification.requestPermission();
      setStatus(permission as PushPermissionStatus);

      if (permission !== "granted") {
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        setError("VAPID key belum dikonfigurasi di environment variable");
        return;
      }

      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        setStatus("unsupported");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        setError("Gagal mendapatkan token perangkat");
        return;
      }

      await registerTokenWithServer(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengaktifkan notifikasi");
    } finally {
      setIsBusy(false);
    }
  }, []);

  return { status, isBusy, error, enable };
}
