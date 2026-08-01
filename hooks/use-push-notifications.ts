"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/firebase";
import { registerTokenWithServer } from "@/lib/notifications/register-token-client";

export type PushPermissionStatus = "unsupported" | "default" | "denied" | "granted";

type UsePushNotificationsResult = {
  status: PushPermissionStatus;
  isRegistered: boolean;
  isBusy: boolean;
  error: string | null;
  enable: () => Promise<void>;
};

function toFriendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";

  if (message.toLowerCase().includes("push service error") || message.toLowerCase().includes("registration failed")) {
    return "Perangkat ini punya sisa pendaftaran notifikasi lama yang bentrok. Coba lagi, atau hapus manual lewat Site Settings browser jika masih gagal.";
  }

  return message || "Terjadi kesalahan saat mengaktifkan notifikasi";
}

function getInitialStatus(): PushPermissionStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as PushPermissionStatus;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [status, setStatus] = useState<PushPermissionStatus>(getInitialStatus);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function subscribeForegroundMessages() {
      if (typeof window === "undefined" || Notification.permission !== "granted") {
        return;
      }

      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        return;
      }

      unsubscribe = onMessage(messaging, async (payload) => {
        const title = payload.notification?.title ?? "Notifikasi";
        const body = payload.notification?.body ?? "";
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, { body, icon: "/icons/icon-192.png" });
      });
    }

    subscribeForegroundMessages();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const enable = useCallback(async () => {
    setError(null);
    setIsRegistered(false);
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

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        setError("Gagal mendapatkan token perangkat dari FCM");
        return;
      }

      await registerTokenWithServer(token);
      setIsRegistered(true);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setIsBusy(false);
    }
  }, []);

  return { status, isRegistered, isBusy, error, enable };
}
