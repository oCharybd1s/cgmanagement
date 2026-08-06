import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canCreateMeetingReport, isCoach } from "@/lib/auth/roles";
import { validateMeetingReportInput, type MeetingReportFieldErrors } from "@/lib/meeting-reports/validation";
import { toStringValue } from "@/lib/meeting-reports/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { MeetingReport } from "@/lib/meeting-reports/types";

export type CreateMeetingReportRequest = {
  cgId: unknown;
  meetingDate: unknown;
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

  const meetingDate = toStringValue(payload.meetingDate).trim();
  const agenda = toStringValue(payload.agenda).trim();
  const result = toStringValue(payload.result).trim();

  const fieldErrors = validateMeetingReportInput({ meetingDate, agenda, result });

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

  try {
    await docRef.set({
      cgId,
      meetingDate,
      agenda,
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
      agenda,
      result,
      submittedBy: session.uid,
      createdAt: Timestamp.now().toDate().toISOString(),
      coachResponse: null,
      respondedBy: null,
      respondedAt: null,
    },
  };
}
