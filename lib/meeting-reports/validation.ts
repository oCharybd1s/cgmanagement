export type MeetingReportFieldErrors = Partial<Record<"cgId" | "meetingDate" | "agenda" | "result", string>>;

export function validateMeetingReportInput(input: {
  meetingDate: string;
  agenda: string;
  result: string;
}): MeetingReportFieldErrors {
  const errors: MeetingReportFieldErrors = {};

  if (input.meetingDate.trim() === "") {
    errors.meetingDate = "Tanggal pertemuan wajib diisi";
  }

  if (input.agenda.trim() === "") {
    errors.agenda = "Agenda wajib diisi";
  }

  if (input.result.trim() === "") {
    errors.result = "Hasil pertemuan wajib diisi";
  }

  return errors;
}
