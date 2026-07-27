import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canDeleteMeetingReport } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export type DeleteMeetingReportResult =
  | { ok: true; reportId: string }
  | { ok: false; status: number; error: string };

export async function deleteMeetingReportForSession(
  session: SessionUser,
  reportId: string,
): Promise<DeleteMeetingReportResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canDeleteMeetingReport(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menghapus Laporan CG" };
  }

  const trimmedReportId = reportId.trim();
  if (!trimmedReportId) {
    return { ok: false, status: 400, error: "Laporan CG tidak valid" };
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

  try {
    await targetRef.delete();
  } catch {
    return { ok: false, status: 500, error: "Gagal menghapus Laporan CG" };
  }

  return { ok: true, reportId: trimmedReportId };
}
