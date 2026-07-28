"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NotebookPen, X, Loader2 } from "lucide-react";
import { isCoach } from "@/lib/auth/roles";
import { useSubmitMeetingReport } from "@/lib/meeting-reports/use-submit-meeting-report";
import { getTodayDateInputValue } from "@/lib/meeting-reports/date";
import type { MeetingReport } from "@/lib/meeting-reports/types";
import type { CgGroup } from "@/lib/cg-groups/types";

const inputClass =
  "w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "w-full resize-none rounded-2xl border-[1.5px] border-input bg-input/40 px-4 py-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

export function AddLaporanDialog({
  cgGroups,
  viewerRole,
  defaultCgId,
  onCreated,
}: {
  cgGroups: CgGroup[];
  viewerRole: string | null;
  defaultCgId?: string;
  onCreated?: (report: MeetingReport) => void;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const canPickCgGroup = isCoach(viewerRole);

  const { isSubmitting, formError, fieldErrors, submit, resetErrors } = useSubmitMeetingReport((report) => {
    formRef.current?.reset();
    setIsOpen(false);
    onCreated?.(report);
  });

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function openDialog() {
    resetErrors();
    setIsOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const meetingDate = String(formData.get("meetingDate") ?? "");
    const agenda = String(formData.get("agenda") ?? "");
    const result = String(formData.get("result") ?? "");
    const cgId = canPickCgGroup ? String(formData.get("cgId") ?? "") : (defaultCgId ?? "");

    await submit({ cgId, meetingDate, agenda, result, requireCgId: canPickCgGroup });
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        <NotebookPen className="h-4 w-4" strokeWidth={2} />
        Tambah Laporan
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-laporan-dialog-title"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2
                  id="add-laporan-dialog-title"
                  className="font-display text-lg font-bold tracking-tight text-foreground"
                >
                  Tambah Laporan CG
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Tutup"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
                {canPickCgGroup ? (
                  <Field label="CG" htmlFor="cgId" error={fieldErrors.cgId} required>
                    <select
                      id="cgId"
                      name="cgId"
                      defaultValue={defaultCgId ?? ""}
                      disabled={isSubmitting}
                      className={inputClass}
                    >
                      <option value="">Pilih CG</option>
                      {cgGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.groupCode}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}

                <Field label="Tanggal Pertemuan" htmlFor="meetingDate" error={fieldErrors.meetingDate} required>
                  <input
                    id="meetingDate"
                    name="meetingDate"
                    type="date"
                    defaultValue={getTodayDateInputValue()}
                    disabled={isSubmitting}
                    className={inputClass}
                  />
                </Field>

                <Field label="Agenda" htmlFor="agenda" error={fieldErrors.agenda} required>
                  <textarea id="agenda" name="agenda" rows={3} disabled={isSubmitting} className={textareaClass} />
                </Field>

                <Field label="Hasil Pertemuan" htmlFor="result" error={fieldErrors.result} required>
                  <textarea id="result" name="result" rows={4} disabled={isSubmitting} className={textareaClass} />
                </Field>

                {formError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {formError}
                  </p>
                ) : null}

                <div className="mt-1 flex items-center justify-end gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
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
                      "Simpan Laporan"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
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
