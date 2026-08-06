"use client";

import * as React from "react";
import {
  validateMeetingReportResponseInput,
  type MeetingReportResponseFieldErrors,
} from "@/lib/meeting-reports/validation";
import type { MeetingReport } from "@/lib/meeting-reports/types";

export function useRespondMeetingReport(onResponded?: (report: MeetingReport) => void) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<MeetingReportResponseFieldErrors>({});

  function resetErrors() {
    setFormError(null);
    setFieldErrors({});
  }

  async function submit(reportId: string, coachResponse: string): Promise<boolean> {
    setFormError(null);

    const errors = validateMeetingReportResponseInput({ coachResponse });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/meeting-reports/${reportId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachResponse }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFormError(data.error ?? "Gagal menyimpan respon Laporan CG");
        setFieldErrors(data.fieldErrors ?? {});
        setIsSubmitting(false);
        return false;
      }

      setIsSubmitting(false);
      onResponded?.(data.report);
      return true;
    } catch {
      setFormError("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
      return false;
    }
  }

  return { isSubmitting, formError, fieldErrors, submit, resetErrors };
}
