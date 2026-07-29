export type FcmTokenDoc = {
  id: string;
  token: string;
  userAgent: string | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

export type SendResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};
