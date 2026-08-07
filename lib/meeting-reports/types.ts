export const MEETING_AGENDA_TYPES = ["one_on_one", "sponsor_meeting", "others"] as const;

export type MeetingAgendaType = (typeof MEETING_AGENDA_TYPES)[number];

export type MeetingReport = {
  id: string;
  cgId: string | null;
  meetingDate: string | null;
  agendaType: MeetingAgendaType;
  meetingWithName: string | null;
  agenda: string | null;
  result: string;
  submittedBy: string | null;
  createdAt: string | null;
  coachResponse: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
};
