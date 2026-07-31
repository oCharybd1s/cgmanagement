import { Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { isCoach } from "@/lib/auth/roles";
import { canViewEvent, type EventViewerContext } from "@/lib/events/access";
import { getOwnMemberForSession } from "@/lib/members/data";
import { EVENT_TYPES } from "@/lib/events/types";
import type { SessionUser } from "@/lib/auth/types";
import type { EventRecord, EventType } from "@/lib/events/types";

export type EventDateRange = { start: string; end: string };

export async function getEventsForSession(session: SessionUser, range: EventDateRange): Promise<EventRecord[]> {
  if (!session.orgId) {
    return [];
  }

  const { adminDb } = getAdminServices();
  const eventsRef = adminDb.collection("organizations").doc(session.orgId).collection("events");
  const snapshot = await eventsRef.where("date", ">=", range.start).where("date", "<=", range.end).get();
  const events = snapshot.docs.map(toEventRecord);

  if (isCoach(session.role)) {
    return events.sort(compareEvents);
  }

  const hasMinistry = await resolveHasMinistry(session);
  const viewer: EventViewerContext = {
    uid: session.uid,
    role: session.role,
    cgGroupId: session.cgGroupId,
    hasMinistry,
  };

  return events.filter((event) => canViewEvent(viewer, event)).sort(compareEvents);
}

export async function getEventsForOrgOnDate(orgId: string, dateKey: string): Promise<EventRecord[]> {
  const { adminDb } = getAdminServices();
  const eventsRef = adminDb.collection("organizations").doc(orgId).collection("events");
  const snapshot = await eventsRef.where("date", "==", dateKey).get();
  return snapshot.docs.map(toEventRecord).sort(compareEvents);
}

async function resolveHasMinistry(session: SessionUser): Promise<boolean> {
  const member = await getOwnMemberForSession(session);
  return Boolean(member?.pelayanan);
}

function compareEvents(a: EventRecord, b: EventRecord): number {
  if (a.date !== b.date) {
    return a.date < b.date ? -1 : 1;
  }
  const timeA = a.time ?? "99:99";
  const timeB = b.time ?? "99:99";
  return timeA < timeB ? -1 : timeA > timeB ? 1 : 0;
}

function toEventRecord(doc: QueryDocumentSnapshot): EventRecord {
  const data = doc.data();

  return {
    id: doc.id,
    name: readString(data.name) ?? "",
    description: readString(data.description),
    date: readString(data.date) ?? "",
    time: readString(data.time),
    type: toEventType(data.type),
    targetCgId: readString(data.targetCgId),
    targetUserId: readString(data.targetUserId),
    createdBy: readString(data.createdBy) ?? "",
    createdByRole: readString(data.createdByRole) ?? "",
    createdAt: toDateLabel(data.createdAt),
    updatedBy: readString(data.updatedBy),
    updatedAt: toDateLabel(data.updatedAt),
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toEventType(value: unknown): EventType {
  return (EVENT_TYPES as readonly string[]).includes(value as string) ? (value as EventType) : "all";
}

function toDateLabel(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return readString(value);
}
