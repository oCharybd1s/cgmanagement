"use client";

import * as React from "react";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/firebase";
import { registerTokenWithServer } from "@/lib/notifications/register-token-client";

export function NotificationTokenSync() {
  React.useEffect(() => {
    let cancelled = false;

    async function syncToken() {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return;
      }

      if (Notification.permission !== "granted") {
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        return;
      }

      const messaging = await getFirebaseMessaging();
      if (!messaging || cancelled) {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch(
        () => null,
      );

      if (!token || cancelled) {
        return;
      }

      await registerTokenWithServer(token).catch(() => null);
    }

    syncToken();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
