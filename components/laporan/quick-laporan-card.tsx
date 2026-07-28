"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, NotebookPen } from "lucide-react";
import { isCoach } from "@/lib/auth/roles";
import { useSubmitMeetingReport } from "@/lib/meeting-reports/use-submit-meeting-report";
import { getTodayDateInputValue } from "@/lib/meeting-reports/date";
import type { CgGroup } from "@/lib/cg-groups/types";

const inputClass =
  "w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "w-full resize-none rounded-2xl border-[1.5px] border-input bg-input/40 px-4 py-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

export function QuickLaporanCard({
  cgGroups,
  viewerRole,
}: {
  cgGroups: CgGroup[];
  viewerRole: string | null;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const meetingDateRef = React.useRef<HTMLInputElement>(null);
  const [justSubmitted, setJustSubmitted] = React.useState(false);

  const canPickCgGroup = isCoach(viewerRole);

  const { isSubmitting, formError, fieldErrors, submit } = useSubmitMeetingReport(() => {
    formRef.current?.reset();
    if (meetingDateRef.current) {
      meetingDateRef.current.value = getTodayDateInputValue();
    }
    setJustSubmitted(true);
    window.setTimeout(() => setJustSubmitted(false), 4000);
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const meetingDate = String(formData.get("meetingDate") ?? "");
    const agenda = String(formData.get("agenda") ?? "");
    const result = String(formData.get("result") ?? "");
    const cgId = String(formData.get("cgId") ?? "");

    await submit({ cgId, meetingDate, agenda, result, requireCgId: canPickCgGroup });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <NotebookPen className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="font-display text-base font-bold tracking-tight text-foreground">Laporan CG Cepat</p>
            <p className="text-xs text-muted-foreground">Isi laporan pertemuan CG langsung dari sini</p>
          </div>
        </div>
        <Link
          href="/laporan"
          className="hidden shrink-0 text-xs font-medium text-primary transition-colors duration-200 hover:underline sm:inline"
        >
          Lihat semua
        </Link>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
        {canPickCgGroup ? (
          <Field label="CG" htmlFor="quick-cgId" error={fieldErrors.cgId} required>
            <select id="quick-cgId" name="cgId" disabled={isSubmitting} className={inputClass}>
              <option value="">Pilih CG</option>
              {cgGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.groupCode}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Tanggal Pertemuan" htmlFor="quick-meetingDate" error={fieldErrors.meetingDate} required>
          <input
            ref={meetingDateRef}
            id="quick-meetingDate"
            name="meetingDate"
            type="date"
            defaultValue={getTodayDateInputValue()}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>

        <Field label="Agenda" htmlFor="quick-agenda" error={fieldErrors.agenda} required>
          <textarea id="quick-agenda" name="agenda" rows={2} disabled={isSubmitting} className={textareaClass} />
        </Field>

        <Field label="Hasil Pertemuan" htmlFor="quick-result" error={fieldErrors.result} required>
          <textarea id="quick-result" name="result" rows={3} disabled={isSubmitting} className={textareaClass} />
        </Field>

        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-1">
          {justSubmitted ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              Laporan tersimpan
            </p>
          ) : (
            <span />
          )}
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
              "Simpan Laporan"
            )}
          </button>
        </div>
      </form>
    </div>
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
