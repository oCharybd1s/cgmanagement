"use client";

import * as React from "react";
import { normalizeAgendaType } from "@/lib/meeting-reports/shared";
import { validateMeetingReportInput, type MeetingReportFieldErrors } from "@/lib/meeting-reports/validation";
import type { MeetingReport } from "@/lib/meeting-reports/types";

export type SubmitMeetingReportInput = {
  cgId: string;
  meetingDate: string;
  agendaType: string;
  meetingWithName: string;
  agenda: string;
  result: string;
  requireCgId: boolean;
};

export function useSubmitMeetingReport(onCreated?: (report: MeetingReport) => void) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<MeetingReportFieldErrors>({});

  function resetErrors() {
    setFormError(null);
    setFieldErrors({});
  }

  async function submit(input: SubmitMeetingReportInput): Promise<boolean> {
    setFormError(null);

    const agendaType = normalizeAgendaType(input.agendaType);
    if (!agendaType) {
      setFieldErrors({ agendaType: "Tipe agenda wajib dipilih" });
      return false;
    }

    const errors = validateMeetingReportInput({
      meetingDate: input.meetingDate,
      agendaType,
      meetingWithName: input.meetingWithName,
      agenda: input.agenda,
      result: input.result,
    });
    if (input.requireCgId && input.cgId.trim() === "") {
      errors.cgId = "CG wajib dipilih";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/meeting-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cgId: input.cgId,
          meetingDate: input.meetingDate,
          agendaType,
          meetingWithName: input.meetingWithName,
          agenda: input.agenda,
          result: input.result,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFormError(data.error ?? "Gagal menyimpan Laporan CG");
        setFieldErrors(data.fieldErrors ?? {});
        setIsSubmitting(false);
        return false;
      }

      setIsSubmitting(false);
      onCreated?.(data.report);
      return true;
    } catch {
      setFormError("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
      return false;
    }
  }

  return { isSubmitting, formError, fieldErrors, submit, resetErrors };
}
