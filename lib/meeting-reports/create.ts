import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canCreateMeetingReport, isCoach } from "@/lib/auth/roles";
import { validateMeetingReportInput, type MeetingReportFieldErrors } from "@/lib/meeting-reports/validation";
import { normalizeAgendaType, toStringValue } from "@/lib/meeting-reports/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { MeetingReport } from "@/lib/meeting-reports/types";

export type CreateMeetingReportRequest = {
  cgId: unknown;
  meetingDate: unknown;
  agendaType: unknown;
  meetingWithName: unknown;
  agenda: unknown;
  result: unknown;
};

export type CreateMeetingReportResult =
  | { ok: true; report: MeetingReport }
  | { ok: false; status: number; error: string; fieldErrors?: MeetingReportFieldErrors };

export async function createMeetingReportForSession(
  session: SessionUser,
  payload: Partial<CreateMeetingReportRequest>,
): Promise<CreateMeetingReportResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canCreateMeetingReport(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk membuat Laporan CG" };
  }

  const agendaType = normalizeAgendaType(payload.agendaType);
  if (!agendaType) {
    return {
      ok: false,
      status: 400,
      error: "Tipe agenda wajib dipilih",
      fieldErrors: { agendaType: "Tipe agenda wajib dipilih" },
    };
  }

  const meetingDate = toStringValue(payload.meetingDate).trim();
  const meetingWithName = agendaType === "one_on_one" ? toStringValue(payload.meetingWithName).trim() : "";
  const agenda = agendaType === "others" ? toStringValue(payload.agenda).trim() : "";
  const result = toStringValue(payload.result).trim();

  const fieldErrors = validateMeetingReportInput({ meetingDate, agendaType, meetingWithName, agenda, result });

  let cgId: string;
  if (isCoach(session.role)) {
    cgId = toStringValue(payload.cgId).trim();
    if (cgId === "") {
      fieldErrors.cgId = "CG wajib dipilih";
    }
  } else {
    if (!session.cgGroupId) {
      return { ok: false, status: 403, error: "Akun Anda belum terhubung ke CG" };
    }
    cgId = session.cgGroupId;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, error: "Periksa kembali data yang diisi", fieldErrors };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;

  const docRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("meetingReports")
    .doc();

  const meetingWithNameValue = meetingWithName === "" ? null : meetingWithName;
  const agendaValue = agenda === "" ? null : agenda;

  try {
    await docRef.set({
      cgId,
      meetingDate,
      agendaType,
      meetingWithName: meetingWithNameValue,
      agenda: agendaValue,
      result,
      submittedBy: session.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan Laporan CG" };
  }

  return {
    ok: true,
    report: {
      id: docRef.id,
      cgId,
      meetingDate,
      agendaType,
      meetingWithName: meetingWithNameValue,
      agenda: agendaValue,
      result,
      submittedBy: session.uid,
      createdAt: Timestamp.now().toDate().toISOString(),
      coachResponse: null,
      respondedBy: null,
      respondedAt: null,
    },
  };
}
