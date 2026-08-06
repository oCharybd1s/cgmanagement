import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type {
  CollectionReference,
  DocumentReference,
  Firestore,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import type { SessionUser } from "@/lib/auth/types";
import type { InAppNotification, NotificationCategory, NotificationPayload } from "@/lib/notifications/types";

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 50;
const BATCH_SIZE = 400;
export const NOTIFICATION_RETENTION_DAYS = 7;

function notificationsCollection(adminDb: Firestore, orgId: string, userId: string) {
  return adminDb
    .collection("organizations")
    .doc(orgId)
    .collection("users")
    .doc(userId)
    .collection("notifications");
}

export async function persistNotificationForUser(
  adminDb: Firestore,
  orgId: string,
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  await notificationsCollection(adminDb, orgId, userId).add({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? null,
    category: payload.category ?? "general",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    readAt: null,
  });
}

export type NotificationListResult = {
  notifications: InAppNotification[];
  nextCursor: string | null;
  unreadCount: number;
};

export async function getNotificationsForSession(
  session: SessionUser,
  options?: { limit?: number; cursor?: string | null },
): Promise<NotificationListResult> {
  if (!session.orgId) {
    return { notifications: [], nextCursor: null, unreadCount: 0 };
  }

  const { adminDb } = getAdminServices();
  const collectionRef = notificationsCollection(adminDb, session.orgId, session.uid);
  const pageSize = clampPageSize(options?.limit);

  let query = collectionRef.orderBy("createdAt", "desc").limit(pageSize + 1);

  if (options?.cursor) {
    const cursorSnapshot = await collectionRef.doc(options.cursor).get();
    if (cursorSnapshot.exists) {
      query = query.startAfter(cursorSnapshot);
    }
  }

  const [snapshot, unreadCount] = await Promise.all([query.get(), countUnread(collectionRef)]);

  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    notifications: pageDocs.map(toInAppNotification),
    nextCursor: hasMore ? pageDocs[pageDocs.length - 1].id : null,
    unreadCount,
  };
}

export type MarkNotificationReadResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function markNotificationReadForSession(
  session: SessionUser,
  notificationId: string,
): Promise<MarkNotificationReadResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedId = notificationId.trim();
  if (!trimmedId) {
    return { ok: false, status: 400, error: "Notifikasi tidak valid" };
  }

  const { adminDb } = getAdminServices();
  const docRef = notificationsCollection(adminDb, session.orgId, session.uid).doc(trimmedId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return { ok: false, status: 404, error: "Notifikasi tidak ditemukan" };
  }

  if (snapshot.data()?.read === true) {
    return { ok: true };
  }

  await docRef.update({
    read: true,
    readAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
}

export type MarkAllNotificationsReadResult = { ok: true; updatedCount: number };

export async function markAllNotificationsReadForSession(
  session: SessionUser,
): Promise<MarkAllNotificationsReadResult> {
  if (!session.orgId) {
    return { ok: true, updatedCount: 0 };
  }

  const { adminDb } = getAdminServices();
  const collectionRef = notificationsCollection(adminDb, session.orgId, session.uid);

  let updatedCount = 0;

  while (true) {
    const snapshot = await collectionRef.where("read", "==", false).limit(BATCH_SIZE).get();
    if (snapshot.empty) {
      break;
    }

    const batch = adminDb.batch();
    const readAt = FieldValue.serverTimestamp();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true, readAt });
    });
    await batch.commit();

    updatedCount += snapshot.size;

    if (snapshot.size < BATCH_SIZE) {
      break;
    }
  }

  return { ok: true, updatedCount };
}

export type DeleteNotificationResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function deleteNotificationForSession(
  session: SessionUser,
  notificationId: string,
): Promise<DeleteNotificationResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedId = notificationId.trim();
  if (!trimmedId) {
    return { ok: false, status: 400, error: "Notifikasi tidak valid" };
  }

  const { adminDb } = getAdminServices();
  const docRef = notificationsCollection(adminDb, session.orgId, session.uid).doc(trimmedId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return { ok: false, status: 404, error: "Notifikasi tidak ditemukan" };
  }

  await docRef.delete();

  return { ok: true };
}

export async function pruneExpiredNotificationsForOrg(
  adminDb: Firestore,
  orgId: string,
  retentionDays: number = NOTIFICATION_RETENTION_DAYS,
): Promise<number> {
  const cutoff = Timestamp.fromMillis(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const userRefs = await adminDb.collection("organizations").doc(orgId).collection("users").listDocuments();

  let deletedCount = 0;
  for (const userRef of userRefs) {
    deletedCount += await pruneExpiredNotificationsForUser(userRef, cutoff);
  }

  return deletedCount;
}

async function pruneExpiredNotificationsForUser(
  userRef: DocumentReference,
  cutoff: Timestamp,
): Promise<number> {
  const collectionRef = userRef.collection("notifications");
  let deletedCount = 0;

  while (true) {
    const snapshot = await collectionRef.where("createdAt", "<", cutoff).limit(BATCH_SIZE).get();
    if (snapshot.empty) {
      break;
    }

    const batch = userRef.firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    deletedCount += snapshot.size;

    if (snapshot.size < BATCH_SIZE) {
      break;
    }
  }

  return deletedCount;
}

async function countUnread(collectionRef: CollectionReference): Promise<number> {
  const snapshot = await collectionRef.where("read", "==", false).count().get();
  return snapshot.data().count;
}

function clampPageSize(requested: number | undefined): number {
  if (!requested || !Number.isFinite(requested) || requested <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(requested), MAX_PAGE_SIZE);
}

function toInAppNotification(doc: QueryDocumentSnapshot): InAppNotification {
  const data = doc.data();

  return {
    id: doc.id,
    title: readString(data.title) ?? "",
    body: readString(data.body) ?? "",
    url: readString(data.url),
    category: readCategory(data.category),
    read: data.read === true,
    createdAt: toDateLabel(data.createdAt),
    readAt: toDateLabel(data.readAt),
  };
}

function readCategory(value: unknown): NotificationCategory {
  if (value === "birthday" || value === "event" || value === "vip" || value === "laporan" || value === "general") {
    return value;
  }
  return "general";
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toDateLabel(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return readString(value);
}
