import { semesterForDate, type Semester } from "@/lib/meeting-reports/semester";
import type { MeetingReport } from "@/lib/meeting-reports/types";
import type { Member } from "@/lib/members/types";

export type OneOnOneSummaryRow = {
  memberId: string;
  memberName: string;
  meetingCount: number;
};

export type OneOnOneSummary = {
  rows: OneOnOneSummaryRow[];
  unlinkedCount: number;
  totalMeetings: number;
};

export function buildOneOnOneSummary(
  reports: MeetingReport[],
  members: Member[],
  semester: Semester,
): OneOnOneSummary {
  const countsByMemberId = new Map<string, number>();
  let unlinkedCount = 0;

  for (const report of reports) {
    if (report.agendaType !== "one_on_one" || !report.meetingDate) {
      continue;
    }

    const meetingDate = new Date(report.meetingDate);
    if (Number.isNaN(meetingDate.getTime())) {
      continue;
    }

    const reportSemester = semesterForDate(meetingDate);
    if (reportSemester.year !== semester.year || reportSemester.half !== semester.half) {
      continue;
    }

    if (!report.meetingWithId) {
      unlinkedCount += 1;
      continue;
    }

    countsByMemberId.set(report.meetingWithId, (countsByMemberId.get(report.meetingWithId) ?? 0) + 1);
  }

  const rows: OneOnOneSummaryRow[] = members.map((member) => ({
    memberId: member.id,
    memberName: member.fullName || "Tanpa nama",
    meetingCount: countsByMemberId.get(member.id) ?? 0,
  }));

  rows.sort((a, b) => a.meetingCount - b.meetingCount || a.memberName.localeCompare(b.memberName, "id"));

  const totalMeetings = rows.reduce((sum, row) => sum + row.meetingCount, 0) + unlinkedCount;

  return { rows, unlinkedCount, totalMeetings };
}
