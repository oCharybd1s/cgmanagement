"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, X, Loader2 } from "lucide-react";
import { isCoach, isCgl, isSponsor } from "@/lib/auth/roles";
import { EVENT_TYPE_LABELS, creatableEventTypesForRole, isCgScopedEventType } from "@/lib/events/access";
import { validateEventInput, type EventFieldErrors } from "@/lib/events/validation";
import type { EventRecord, EventType } from "@/lib/events/types";
import type { CgGroup } from "@/lib/cg-groups/types";
import type { Member } from "@/lib/members/types";

const inputClass =
  "w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

const readOnlyClass =
  "rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground";

type EventFormDialogProps = {
  mode: "create" | "edit";
  event?: EventRecord;
  defaultDate?: string;
  viewerUid: string;
  viewerRole: string | null;
  viewerCgGroupId: string | null;
  members: Member[];
  cgGroups: CgGroup[];
  onClose: () => void;
  onSaved: (event: EventRecord) => void;
};

export function EventFormDialog({
  mode,
  event,
  defaultDate,
  viewerUid,
  viewerRole,
  viewerCgGroupId,
  members,
  cgGroups,
  onClose,
  onSaved,
}: EventFormDialogProps) {
  const creatableTypes = React.useMemo(() => creatableEventTypesForRole(viewerRole), [viewerRole]);
  const [selectedType, setSelectedType] = React.useState<EventType>(
    mode === "edit" && event ? event.type : (creatableTypes[0] ?? "all"),
  );
  const [selectedCgId, setSelectedCgId] = React.useState("");
  const [selectedTargetUserId, setSelectedTargetUserId] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<EventFieldErrors>({});

  const ownCgGroup = cgGroups.find((group) => group.id === viewerCgGroupId) ?? null;

  const oneOnOneCandidates = React.useMemo(() => {
    if (isCoach(viewerRole)) {
      return members.filter((member) => member.id !== viewerUid);
    }
    return members.filter(
      (member) =>
        member.cgGroupId === viewerCgGroupId && (member.role === "member" || member.role === "simpatisan"),
    );
  }, [members, viewerRole, viewerUid, viewerCgGroupId]);

  const cglCandidates = React.useMemo(() => members.filter((member) => member.role === "cgl"), [members]);

  React.useEffect(() => {
    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  function handleTypeChange(nextType: EventType) {
    setSelectedType(nextType);
    setSelectedCgId("");
    setSelectedTargetUserId("");
    setFieldErrors({});
  }

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setFormError(null);

    const formData = new FormData(formEvent.currentTarget);
    const name = String(formData.get("name") ?? "");
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "").trim();
    const description = String(formData.get("description") ?? "");

    const errors = validateEventInput({ name, date, time: time === "" ? null : time });

    if (mode === "create") {
      if (isCoach(viewerRole) && isCgScopedEventType(selectedType) && selectedCgId === "") {
        errors.cgId = "CG wajib dipilih";
      }
      if (selectedType === "meeting_one_on_one" && selectedTargetUserId === "") {
        errors.targetUserId = "Peserta meeting wajib dipilih";
      }
      if (selectedType === "meeting_cgl" && isCoach(viewerRole) && selectedTargetUserId === "") {
        errors.targetUserId = "CGL wajib dipilih";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    const endpoint = mode === "create" ? "/api/events" : `/api/events/${event?.id}`;
    const httpMethod = mode === "create" ? "POST" : "PATCH";
    const payload =
      mode === "create"
        ? { name, description, date, time, type: selectedType, cgId: selectedCgId, targetUserId: selectedTargetUserId }
        : { name, description, date, time };

    try {
      const response = await fetch(endpoint, {
        method: httpMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFormError(data.error ?? "Gagal menyimpan event");
        setFieldErrors(data.fieldErrors ?? {});
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onSaved(data.event);
    } catch {
      setFormError("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
    }
  }

  function renderScopeField(): React.ReactNode {
    if (selectedType === "meeting_one_on_one") {
      return (
        <Field label="Peserta" htmlFor="targetUserId" error={fieldErrors.targetUserId} required>
          <select
            id="targetUserId"
            value={selectedTargetUserId}
            onChange={(changeEvent) => setSelectedTargetUserId(changeEvent.target.value)}
            disabled={isSubmitting}
            className={inputClass}
          >
            <option value="">Pilih peserta</option>
            {oneOnOneCandidates.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName || "Tanpa nama"}
              </option>
            ))}
          </select>
        </Field>
      );
    }

    if (selectedType === "meeting_cgl") {
      if (isCgl(viewerRole)) {
        return (
          <Field label="Dengan">
            <p className={readOnlyClass}>Coach</p>
          </Field>
        );
      }
      return (
        <Field label="CGL" htmlFor="targetUserId" error={fieldErrors.targetUserId} required>
          <select
            id="targetUserId"
            value={selectedTargetUserId}
            onChange={(changeEvent) => setSelectedTargetUserId(changeEvent.target.value)}
            disabled={isSubmitting}
            className={inputClass}
          >
            <option value="">Pilih CGL</option>
            {cglCandidates.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName || "Tanpa nama"}
              </option>
            ))}
          </select>
        </Field>
      );
    }

    if (isCgScopedEventType(selectedType)) {
      if (isCoach(viewerRole)) {
        return (
          <Field label="CG" htmlFor="cgId" error={fieldErrors.cgId} required={selectedType === "meeting_cg"}>
            <select
              id="cgId"
              value={selectedCgId}
              onChange={(changeEvent) => setSelectedCgId(changeEvent.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            >
              <option value="">{selectedType === "all_ministry" ? "Semua CG" : "Pilih CG"}</option>
              {cgGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.groupCode}
                </option>
              ))}
            </select>
          </Field>
        );
      }

      if (isCgl(viewerRole) || isSponsor(viewerRole)) {
        return (
          <Field label="CG">
            <p className={readOnlyClass}>{ownCgGroup?.groupCode ?? "CG kamu"}</p>
          </Field>
        );
      }
    }

    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-form-dialog-title"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(clickEvent) => clickEvent.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2
              id="event-form-dialog-title"
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              {mode === "create" ? "Tambah Event" : "Ubah Event"}
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
            {mode === "create" ? (
              <Field label="Tipe Event" htmlFor="type" required>
                <select
                  id="type"
                  value={selectedType}
                  onChange={(changeEvent) => handleTypeChange(changeEvent.target.value as EventType)}
                  disabled={isSubmitting}
                  className={inputClass}
                >
                  {creatableTypes.map((type) => (
                    <option key={type} value={type}>
                      {EVENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Tipe Event">
                <p className={readOnlyClass}>{event ? EVENT_TYPE_LABELS[event.type] : ""}</p>
              </Field>
            )}

            {mode === "create" ? renderScopeField() : null}

            <Field label="Nama Event" htmlFor="name" error={fieldErrors.name} required>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={mode === "edit" ? event?.name : ""}
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal" htmlFor="date" error={fieldErrors.date} required>
                <input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={mode === "edit" ? event?.date : defaultDate}
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </Field>

              <Field label="Jam" htmlFor="time" error={fieldErrors.time}>
                <input
                  id="time"
                  name="time"
                  type="time"
                  defaultValue={mode === "edit" ? (event?.time ?? "") : ""}
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Deskripsi" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={mode === "edit" ? (event?.description ?? "") : ""}
                disabled={isSubmitting}
                className="w-full resize-none rounded-2xl border-[1.5px] border-input bg-input/40 px-4 py-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <CalendarPlus className="h-4 w-4" strokeWidth={2} />
                    {mode === "create" ? "Simpan Event" : "Simpan Perubahan"}
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
