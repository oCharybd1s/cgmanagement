export type MeetingReport = {
  id: string;
  cgId: string | null;
  meetingDate: string | null;
  agenda: string;
  result: string;
  submittedBy: string | null;
  createdAt: string | null;
  coachResponse: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
};
