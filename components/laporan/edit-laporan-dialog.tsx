"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, Loader2 } from "lucide-react";
import { validateMeetingReportInput, type MeetingReportFieldErrors } from "@/lib/meeting-reports/validation";
import { AGENDA_TYPE_OPTIONS } from "@/lib/meeting-reports/shared";
import type { MeetingAgendaType, MeetingReport } from "@/lib/meeting-reports/types";
import type { CgGroup } from "@/lib/cg-groups/types";

const inputClass =
  "w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "w-full resize-none rounded-2xl border-[1.5px] border-input bg-input/40 px-4 py-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

export function EditLaporanDialog({
  report,
  cgGroups,
  onClose,
  onUpdated,
}: {
  report: MeetingReport;
  cgGroups: CgGroup[];
  onClose: () => void;
  onUpdated: (report: MeetingReport) => void;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<MeetingReportFieldErrors>({});
  const [selectedAgendaType, setSelectedAgendaType] = React.useState<MeetingAgendaType>(report.agendaType);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const cgId = String(formData.get("cgId") ?? "");
    const meetingDate = String(formData.get("meetingDate") ?? "");
    const meetingWithName = String(formData.get("meetingWithName") ?? "");
    const agenda = String(formData.get("agenda") ?? "");
    const result = String(formData.get("result") ?? "");

    const errors = validateMeetingReportInput({
      meetingDate,
      agendaType: selectedAgendaType,
      meetingWithName,
      agenda,
      result,
    });
    if (cgId.trim() === "") {
      errors.cgId = "CG wajib dipilih";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/meeting-reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cgId,
          meetingDate,
          agendaType: selectedAgendaType,
          meetingWithName,
          agenda,
          result,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFormError(data.error ?? "Gagal menyimpan perubahan Laporan CG");
        setFieldErrors(data.fieldErrors ?? {});
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onUpdated(data.report);
    } catch {
      setFormError("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-laporan-dialog-title"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(event) => event.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2
              id="edit-laporan-dialog-title"
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              Ubah Laporan CG
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            <Field label="CG" htmlFor="cgId" error={fieldErrors.cgId} required>
              <select id="cgId" name="cgId" defaultValue={report.cgId ?? ""} disabled={isSubmitting} className={inputClass}>
                <option value="">Pilih CG</option>
                {cgGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.groupCode}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tanggal Pertemuan" htmlFor="meetingDate" error={fieldErrors.meetingDate} required>
              <input
                id="meetingDate"
                name="meetingDate"
                type="date"
                defaultValue={report.meetingDate ?? ""}
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>

            <Field label="Tipe Pertemuan" htmlFor="agendaType" error={fieldErrors.agendaType} required>
              <select
                id="agendaType"
                name="agendaType"
                value={selectedAgendaType}
                onChange={(event) => setSelectedAgendaType(event.target.value as MeetingAgendaType)}
                disabled={isSubmitting}
                className={inputClass}
              >
                {AGENDA_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            {selectedAgendaType === "one_on_one" ? (
              <Field label="Ketemu Dengan" htmlFor="meetingWithName" error={fieldErrors.meetingWithName} required>
                <input
                  id="meetingWithName"
                  name="meetingWithName"
                  type="text"
                  defaultValue={report.meetingWithName ?? ""}
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </Field>
            ) : null}

            {selectedAgendaType === "others" ? (
              <Field label="Agenda" htmlFor="agenda" error={fieldErrors.agenda} required>
                <textarea
                  id="agenda"
                  name="agenda"
                  rows={3}
                  defaultValue={report.agenda ?? ""}
                  disabled={isSubmitting}
                  className={textareaClass}
                />
              </Field>
            ) : null}

            <Field label="Hasil Pertemuan" htmlFor="result" error={fieldErrors.result} required>
              <textarea
                id="result"
                name="result"
                rows={4}
                defaultValue={report.result}
                disabled={isSubmitting}
                className={textareaClass}
              />
            </Field>

            {formError ? (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="mt-1 flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
