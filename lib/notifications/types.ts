export type FcmTokenDoc = {
  id: string;
  token: string;
  userAgent: string | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type NotificationCategory = "birthday" | "event" | "vip" | "general";

export type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
  category?: NotificationCategory;
};

export type SendResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  category: NotificationCategory;
  read: boolean;
  createdAt: string | null;
  readAt: string | null;
};
