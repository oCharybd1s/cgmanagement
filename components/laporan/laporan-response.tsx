"use client";

import * as React from "react";
import { Loader2, MessageSquareReply, Send } from "lucide-react";
import { canRespondToMeetingReport } from "@/lib/auth/roles";
import { useRespondMeetingReport } from "@/lib/meeting-reports/use-respond-meeting-report";
import type { MeetingReport } from "@/lib/meeting-reports/types";

const textareaClass =
  "w-full resize-none rounded-2xl border-[1.5px] border-input bg-input/40 px-4 py-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

export function LaporanResponse({
  report,
  viewerRole,
  respondedByName,
  onResponded,
}: {
  report: MeetingReport;
  viewerRole: string | null;
  respondedByName: string | null;
  onResponded: (report: MeetingReport) => void;
}) {
  const canRespond = canRespondToMeetingReport(viewerRole);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(report.coachResponse ?? "");

  const { isSubmitting, formError, fieldErrors, submit, resetErrors } = useRespondMeetingReport((updated) => {
    setDraft(updated.coachResponse ?? "");
    setIsEditing(false);
    onResponded(updated);
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(report.id, draft);
  }

  function startEditing() {
    setDraft(report.coachResponse ?? "");
    resetErrors();
    setIsEditing(true);
  }

  if (!canRespond && !report.coachResponse) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MessageSquareReply className="h-3.5 w-3.5" strokeWidth={2} />
        Menunggu respon Coach
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {report.coachResponse && !isEditing ? (
        <div className="flex flex-col gap-1 rounded-xl bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <MessageSquareReply className="h-3.5 w-3.5" strokeWidth={2} />
            Respon Coach{respondedByName ? ` · ${respondedByName}` : ""}
          </div>
          <p className="whitespace-pre-line text-sm text-foreground">{report.coachResponse}</p>
        </div>
      ) : null}

      {canRespond && !isEditing ? (
        <button
          type="button"
          onClick={startEditing}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary transition-colors duration-200 hover:underline"
        >
          {report.coachResponse ? "Ubah Respon" : "Beri Respon"}
        </button>
      ) : null}

      {canRespond && isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor={`coach-response-${report.id}`} className="sr-only">
            Respon untuk laporan ini
          </label>
          <textarea
            id={`coach-response-${report.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            disabled={isSubmitting}
            placeholder="Tulis respon untuk laporan ini"
            className={textareaClass}
          />
          {fieldErrors.coachResponse ? (
            <p className="text-xs text-destructive">{fieldErrors.coachResponse}</p>
          ) : null}
          {formError ? (
            <p role="alert" className="text-xs text-destructive">
              {formError}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(report.coachResponse ?? "");
                resetErrors();
                setIsEditing(false);
              }}
              disabled={isSubmitting}
              className="rounded-full px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <React.Fragment>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                  Mengirim...
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Send className="h-3.5 w-3.5" strokeWidth={2} />
                  Kirim
                </React.Fragment>
              )}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
