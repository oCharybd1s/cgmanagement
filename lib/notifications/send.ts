import type { Firestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { listFcmTokens, deleteFcmTokensByValue } from "@/lib/notifications/token-store";
import type { NotificationPayload, SendResult } from "@/lib/notifications/types";

const INVALID_TOKEN_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

export async function sendNotificationToTokens(
  tokens: string[],
  payload: NotificationPayload,
): Promise<SendResult> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const messaging = getMessaging();
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    webpush: {
      fcmOptions: payload.url ? { link: payload.url } : undefined,
      notification: {
        icon: "/icons/icon-192.png",
      },
    },
  });

  const invalidTokens: string[] = [];
  response.responses.forEach((result, index) => {
    if (result.success) {
      return;
    }
    console.error("fcm send failed", {
      tokenSuffix: tokens[index].slice(-12),
      code: result.error?.code,
      message: result.error?.message,
    });
    if (result.error && INVALID_TOKEN_ERROR_CODES.has(result.error.code)) {
      invalidTokens.push(tokens[index]);
    }
  });

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  };
}

export async function sendNotificationToUser(
  adminDb: Firestore,
  orgId: string,
  userId: string,
  payload: NotificationPayload,
): Promise<SendResult> {
  const tokenDocs = await listFcmTokens(adminDb, orgId, userId);
  const tokens = tokenDocs.map((doc) => doc.token).filter((token) => token.length > 0);

  if (tokens.length === 0) {
    console.error("fcm send skipped, no registered tokens", { orgId, userId });
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const result = await sendNotificationToTokens(tokens, payload);

  if (result.invalidTokens.length > 0) {
    await deleteFcmTokensByValue(adminDb, orgId, userId, result.invalidTokens);
  }

  return result;
}

export async function sendNotificationToUsers(
  adminDb: Firestore,
  orgId: string,
  userIds: string[],
  payload: NotificationPayload,
): Promise<SendResult> {
  const results = await Promise.all(
    userIds.map((userId) => sendNotificationToUser(adminDb, orgId, userId, payload)),
  );

  return results.reduce<SendResult>(
    (total, current) => ({
      successCount: total.successCount + current.successCount,
      failureCount: total.failureCount + current.failureCount,
      invalidTokens: [...total.invalidTokens, ...current.invalidTokens],
    }),
    { successCount: 0, failureCount: 0, invalidTokens: [] },
  );
}
