import { Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canManageMeetingReport } from "@/lib/auth/roles";
import { validateMeetingReportInput, type MeetingReportFieldErrors } from "@/lib/meeting-reports/validation";
import { toStringValue } from "@/lib/meeting-reports/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { MeetingReport } from "@/lib/meeting-reports/types";

export type UpdateMeetingReportRequest = {
  cgId: unknown;
  meetingDate: unknown;
  agenda: unknown;
  result: unknown;
};

export type UpdateMeetingReportResult =
  | { ok: true; report: MeetingReport }
  | { ok: false; status: number; error: string; fieldErrors?: MeetingReportFieldErrors };

export async function updateMeetingReportForSession(
  session: SessionUser,
  reportId: string,
  payload: Partial<UpdateMeetingReportRequest>,
): Promise<UpdateMeetingReportResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canManageMeetingReport(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mengubah Laporan CG" };
  }

  const trimmedReportId = reportId.trim();
  if (!trimmedReportId) {
    return { ok: false, status: 400, error: "Laporan CG tidak valid" };
  }

  const meetingDate = toStringValue(payload.meetingDate).trim();
  const agenda = toStringValue(payload.agenda).trim();
  const result = toStringValue(payload.result).trim();
  const cgId = toStringValue(payload.cgId).trim();

  const fieldErrors = validateMeetingReportInput({ meetingDate, agenda, result });
  if (cgId === "") {
    fieldErrors.cgId = "CG wajib dipilih";
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

  try {
    await targetRef.update({
      cgId,
      meetingDate,
      agenda,
      result,
      updatedBy: session.uid,
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan perubahan Laporan CG" };
  }

  return {
    ok: true,
    report: {
      id: trimmedReportId,
      cgId,
      meetingDate,
      agenda,
      result,
      submittedBy: typeof targetData.submittedBy === "string" ? targetData.submittedBy : null,
      createdAt: targetData.createdAt instanceof Timestamp ? targetData.createdAt.toDate().toISOString() : null,
    },
  };
}
