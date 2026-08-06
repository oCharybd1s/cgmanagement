"use client";

import * as React from "react";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/firebase";
import { registerTokenWithServer } from "@/lib/notifications/register-token-client";

export function NotificationTokenSync() {
  React.useEffect(() => {
    let cancelled = false;

    async function fetchToken(
      messaging: NonNullable<Awaited<ReturnType<typeof getFirebaseMessaging>>>,
      vapidKey: string,
      registration: ServiceWorkerRegistration,
    ) {
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch(
        () => null,
      );

      if (token) {
        return token;
      }

      const existingSubscription = await registration.pushManager.getSubscription().catch(() => null);
      if (existingSubscription) {
        await existingSubscription.unsubscribe().catch(() => undefined);
      }

      return getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch(() => null);
    }

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
      const token = await fetchToken(messaging, vapidKey, registration);

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
