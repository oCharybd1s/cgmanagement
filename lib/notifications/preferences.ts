import type { Firestore } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import type { SessionUser } from "@/lib/auth/types";
import type { NotificationCategory } from "@/lib/notifications/types";

export type NotificationPreferences = {
  birthday: boolean;
  event: boolean;
  vip: boolean;
  laporan: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  birthday: true,
  event: true,
  vip: true,
  laporan: true,
};

export function toNotificationPreferences(value: unknown): NotificationPreferences {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    birthday: record.birthday !== false,
    event: record.event !== false,
    vip: record.vip !== false,
    laporan: record.laporan !== false,
  };
}

export async function getNotificationPreferencesForSession(
  session: SessionUser,
): Promise<NotificationPreferences> {
  if (!session.orgId) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const { adminDb } = getAdminServices();
  const snapshot = await adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("users")
    .doc(session.uid)
    .get();

  if (!snapshot.exists) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return toNotificationPreferences(snapshot.data()?.notificationPreferences);
}

export type UpdateNotificationPreferencesResult =
  | { ok: true; preferences: NotificationPreferences }
  | { ok: false; status: number; error: string };

export async function updateNotificationPreferencesForSession(
  session: SessionUser,
  patch: Partial<NotificationPreferences>,
): Promise<UpdateNotificationPreferencesResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const { adminDb } = getAdminServices();
  const userRef = adminDb.collection("organizations").doc(session.orgId).collection("users").doc(session.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    return { ok: false, status: 404, error: "Akun tidak ditemukan" };
  }

  const current = toNotificationPreferences(snapshot.data()?.notificationPreferences);
  const next: NotificationPreferences = {
    birthday: typeof patch.birthday === "boolean" ? patch.birthday : current.birthday,
    event: typeof patch.event === "boolean" ? patch.event : current.event,
    vip: typeof patch.vip === "boolean" ? patch.vip : current.vip,
    laporan: typeof patch.laporan === "boolean" ? patch.laporan : current.laporan,
  };

  try {
    await userRef.update({ notificationPreferences: next });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan preferensi notifikasi" };
  }

  return { ok: true, preferences: next };
}

export async function isNotificationCategoryEnabled(
  adminDb: Firestore,
  orgId: string,
  userId: string,
  category: NotificationCategory | undefined,
): Promise<boolean> {
  if (!category || category === "general") {
    return true;
  }

  const snapshot = await adminDb.collection("organizations").doc(orgId).collection("users").doc(userId).get();

  if (!snapshot.exists) {
    return true;
  }

  const preferences = toNotificationPreferences(snapshot.data()?.notificationPreferences);
  return preferences[category];
}
