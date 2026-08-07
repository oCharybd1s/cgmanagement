import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canRespondToMeetingReport } from "@/lib/auth/roles";
import { sendNotificationToUser } from "@/lib/notifications/send";
import {
  validateMeetingReportResponseInput,
  type MeetingReportResponseFieldErrors,
} from "@/lib/meeting-reports/validation";
import { toStringValue } from "@/lib/meeting-reports/shared";
import { MEETING_AGENDA_TYPES } from "@/lib/meeting-reports/types";
import type { SessionUser } from "@/lib/auth/types";
import type { MeetingAgendaType, MeetingReport } from "@/lib/meeting-reports/types";

export type RespondMeetingReportRequest = {
  coachResponse: unknown;
};

export type RespondMeetingReportResult =
  | { ok: true; report: MeetingReport }
  | { ok: false; status: number; error: string; fieldErrors?: MeetingReportResponseFieldErrors };

const NOTIFICATION_BODY_MAX_LENGTH = 120;

function truncateForNotification(text: string): string {
  if (text.length <= NOTIFICATION_BODY_MAX_LENGTH) {
    return text;
  }
  return `${text.slice(0, NOTIFICATION_BODY_MAX_LENGTH - 1)}…`;
}

export async function respondToMeetingReportForSession(
  session: SessionUser,
  reportId: string,
  payload: Partial<RespondMeetingReportRequest>,
): Promise<RespondMeetingReportResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canRespondToMeetingReport(session.role)) {
    return { ok: false, status: 403, error: "Hanya Coach yang bisa merespon Laporan CG" };
  }

  const trimmedReportId = reportId.trim();
  if (!trimmedReportId) {
    return { ok: false, status: 400, error: "Laporan CG tidak valid" };
  }

  const coachResponse = toStringValue(payload.coachResponse).trim();

  const fieldErrors = validateMeetingReportResponseInput({ coachResponse });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, error: "Periksa kembali respon yang diisi", fieldErrors };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;

  const targetRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("meetingReports")
    .doc(trimmedReportId);

  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    return { ok: false, status: 404, error: "Laporan CG tidak ditemukan" };
  }

  const targetData = targetSnap.data() ?? {};
  const respondedAt = Timestamp.now();

  try {
    await targetRef.update({
      coachResponse,
      respondedBy: session.uid,
      respondedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan respon Laporan CG" };
  }

  const submittedBy = typeof targetData.submittedBy === "string" ? targetData.submittedBy : null;

  if (submittedBy && submittedBy !== session.uid) {
    await sendNotificationToUser(adminDb, session.orgId, submittedBy, {
      title: "Laporan CG Anda Direspon Coach",
      body: truncateForNotification(coachResponse),
      url: "/laporan",
      category: "laporan",
    }).catch(() => undefined);
  }

  return {
    ok: true,
    report: {
      id: trimmedReportId,
      cgId: typeof targetData.cgId === "string" ? targetData.cgId : null,
      meetingDate: typeof targetData.meetingDate === "string" ? targetData.meetingDate : null,
      agendaType: readAgendaType(targetData.agendaType),
      meetingWithName: typeof targetData.meetingWithName === "string" ? targetData.meetingWithName : null,
      agenda: typeof targetData.agenda === "string" ? targetData.agenda : null,
      result: typeof targetData.result === "string" ? targetData.result : "",
      submittedBy,
      createdAt: targetData.createdAt instanceof Timestamp ? targetData.createdAt.toDate().toISOString() : null,
      coachResponse,
      respondedBy: session.uid,
      respondedAt: respondedAt.toDate().toISOString(),
    },
  };
}

function readAgendaType(value: unknown): MeetingAgendaType {
  return typeof value === "string" && (MEETING_AGENDA_TYPES as readonly string[]).includes(value)
    ? (value as MeetingAgendaType)
    : "others";
}
