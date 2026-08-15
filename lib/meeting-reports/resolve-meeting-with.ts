import type { DocumentReference } from "firebase-admin/firestore";
import { isCoach } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";
import type { MeetingReportFieldErrors } from "@/lib/meeting-reports/validation";

export type ResolveMeetingWithResult =
  | { ok: true; meetingWithId: string | null; meetingWithName: string | null }
  | { ok: false; status: number; error: string; fieldErrors?: MeetingReportFieldErrors };

export async function resolveMeetingWith(
  orgRef: DocumentReference,
  session: SessionUser,
  agendaType: string,
  meetingWithIdInput: string,
): Promise<ResolveMeetingWithResult> {
  if (agendaType !== "one_on_one") {
    return { ok: true, meetingWithId: null, meetingWithName: null };
  }

  const meetingWithId = meetingWithIdInput.trim();

  if (meetingWithId === "") {
    return {
      ok: false,
      status: 400,
      error: "Pilih anggota yang ditemui dari daftar",
      fieldErrors: { meetingWithId: "Pilih anggota yang ditemui dari daftar" },
    };
  }

  if (meetingWithId === session.uid) {
    return {
      ok: false,
      status: 400,
      error: "Tidak bisa membuat laporan 1 On 1 dengan diri sendiri",
      fieldErrors: { meetingWithId: "Tidak bisa membuat laporan 1 On 1 dengan diri sendiri" },
    };
  }

  const targetSnapshot = await orgRef.collection("users").doc(meetingWithId).get();

  if (!targetSnapshot.exists) {
    return {
      ok: false,
      status: 404,
      error: "Anggota tidak ditemukan",
      fieldErrors: { meetingWithId: "Anggota tidak ditemukan" },
    };
  }

  const targetData = targetSnapshot.data() ?? {};
  const targetCgId = typeof targetData.cgGroupId === "string" ? targetData.cgGroupId : null;
  const targetName =
    typeof targetData.fullName === "string" && targetData.fullName.trim() !== ""
      ? targetData.fullName.trim()
      : "Tanpa nama";

  if (isCoach(session.role)) {
    return { ok: true, meetingWithId, meetingWithName: targetName };
  }

  if (session.cgGroupId && targetCgId === session.cgGroupId) {
    return { ok: true, meetingWithId, meetingWithName: targetName };
  }

  return {
    ok: false,
    status: 403,
    error: "Pilih anggota di CG Anda sendiri",
    fieldErrors: { meetingWithId: "Pilih anggota di CG Anda sendiri" },
  };
}
