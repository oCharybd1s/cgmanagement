import { Timestamp } from "firebase-admin/firestore";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { isCoach, isCgl, isSponsor } from "@/lib/auth/roles";
import { MEETING_AGENDA_TYPES } from "@/lib/meeting-reports/types";
import type { SessionUser } from "@/lib/auth/types";
import type { MeetingAgendaType, MeetingReport } from "@/lib/meeting-reports/types";

export async function getMeetingReportsForSession(session: SessionUser): Promise<MeetingReport[]> {
  if (!session.orgId) {
    return [];
  }

  const { adminDb } = getAdminServices();
  const reportsRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("meetingReports");

  if (isCoach(session.role)) {
    const snapshot = await reportsRef.get();
    return finalizeMeetingReports(snapshot.docs);
  }

  if ((isCgl(session.role) || isSponsor(session.role)) && session.cgGroupId) {
    const snapshot = await reportsRef.where("cgId", "==", session.cgGroupId).get();
    return finalizeMeetingReports(snapshot.docs);
  }

  return [];
}

function finalizeMeetingReports(docs: QueryDocumentSnapshot[]): MeetingReport[] {
  return docs.map(toMeetingReport).sort(compareMeetingReports);
}

function compareMeetingReports(a: MeetingReport, b: MeetingReport): number {
  const dateA = a.meetingDate ?? "";
  const dateB = b.meetingDate ?? "";
  if (dateA !== dateB) {
    return dateA < dateB ? 1 : -1;
  }
  const createdA = a.createdAt ?? "";
  const createdB = b.createdAt ?? "";
  return createdA < createdB ? 1 : -1;
}

function toMeetingReport(doc: QueryDocumentSnapshot): MeetingReport {
  const data = doc.data();

  return {
    id: doc.id,
    cgId: readString(data.cgId),
    meetingDate: readString(data.meetingDate),
    agendaType: readAgendaType(data.agendaType),
    meetingWithName: readString(data.meetingWithName),
    agenda: readString(data.agenda),
    result: readString(data.result) ?? "",
    submittedBy: readString(data.submittedBy),
    createdAt: toDateLabel(data.createdAt),
    coachResponse: readString(data.coachResponse),
    respondedBy: readString(data.respondedBy),
    respondedAt: toDateLabel(data.respondedAt),
  };
}

function readAgendaType(value: unknown): MeetingAgendaType {
  return typeof value === "string" && (MEETING_AGENDA_TYPES as readonly string[]).includes(value)
    ? (value as MeetingAgendaType)
    : "others";
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
