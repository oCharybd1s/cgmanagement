import type { MeetingAgendaType } from "@/lib/meeting-reports/types";

export type MeetingReportFieldErrors = Partial<
  Record<"cgId" | "meetingDate" | "agendaType" | "meetingWithName" | "agenda" | "result", string>
>;

export function validateMeetingReportInput(input: {
  meetingDate: string;
  agendaType: MeetingAgendaType;
  meetingWithName: string;
  agenda: string;
  result: string;
}): MeetingReportFieldErrors {
  const errors: MeetingReportFieldErrors = {};

  if (input.meetingDate.trim() === "") {
    errors.meetingDate = "Tanggal pertemuan wajib diisi";
  }

  if (input.agendaType === "one_on_one" && input.meetingWithName.trim() === "") {
    errors.meetingWithName = "Nama yang ditemui wajib diisi";
  }

  if (input.agendaType === "others" && input.agenda.trim() === "") {
    errors.agenda = "Agenda wajib diisi";
  }

  if (input.result.trim() === "") {
    errors.result = "Hasil pertemuan wajib diisi";
  }

  return errors;
}

export type MeetingReportResponseFieldErrors = Partial<Record<"coachResponse", string>>;

export function validateMeetingReportResponseInput(input: { coachResponse: string }): MeetingReportResponseFieldErrors {
  const errors: MeetingReportResponseFieldErrors = {};

  if (input.coachResponse.trim() === "") {
    errors.coachResponse = "Respon wajib diisi";
  }

  return errors;
}
