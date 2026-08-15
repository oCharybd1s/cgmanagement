"use client";

import * as React from "react";
import { BarChart3, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { buildOneOnOneSummary } from "@/lib/meeting-reports/summary";
import {
  areSemestersEqual,
  currentSemester,
  semesterRangeLabel,
  shiftSemester,
  type Semester,
} from "@/lib/meeting-reports/semester";
import type { MeetingReport } from "@/lib/meeting-reports/types";
import type { Member } from "@/lib/members/types";

export function OneOnOneSemesterSummary({
  reports,
  members,
  cgId,
}: {
  reports: MeetingReport[];
  members: Member[];
  cgId: string;
}) {
  const [semester, setSemester] = React.useState<Semester>(currentSemester());

  const cgMembers = React.useMemo(() => members.filter((member) => member.cgGroupId === cgId), [members, cgId]);

  const summary = React.useMemo(
    () => buildOneOnOneSummary(reports, cgMembers, semester),
    [reports, cgMembers, semester],
  );

  const isCurrentSemester = areSemestersEqual(semester, currentSemester());

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <BarChart3 className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="font-display text-base font-bold tracking-tight text-foreground">Ringkasan 1 On 1</p>
            <p className="text-xs text-muted-foreground">{summary.totalMeetings} pertemuan tercatat semester ini</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSemester((current) => shiftSemester(current, -1))}
            aria-label="Semester sebelumnya"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <p className="min-w-36 text-center text-sm font-medium text-foreground">{semesterRangeLabel(semester)}</p>
          <button
            type="button"
            onClick={() => setSemester((current) => shiftSemester(current, 1))}
            aria-label="Semester berikutnya"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
          {!isCurrentSemester ? (
            <button
              type="button"
              onClick={() => setSemester(currentSemester())}
              aria-label="Kembali ke semester berjalan"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </div>

      {cgMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada anggota di CG ini.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {summary.rows.map((row) => (
            <div
              key={row.memberId}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-2.5"
            >
              <p className="text-sm text-foreground">{row.memberName}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  row.meetingCount === 0
                    ? "bg-warning/15 text-warning"
                    : "bg-success/15 text-success"
                }`}
              >
                {row.meetingCount}x meeting
              </span>
            </div>
          ))}
        </div>
      )}

      {summary.unlinkedCount > 0 ? (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            {summary.unlinkedCount} laporan 1 On 1 lama belum tertaut ke anggota manapun. Buka dan simpan ulang
            laporan tersebut untuk menautkannya.
          </p>
        </div>
      ) : null}
    </div>
  );
}
