"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { cgGroupDisplayLabel, getRoleLabel } from "@/lib/auth/roles";
import { validateUpdateMemberInput, type UpdateMemberFieldErrors } from "@/lib/members/validation";
import type { Member, SpiritualStatus } from "@/lib/members/types";

type SpiritualStatusKey = keyof SpiritualStatus;

const SPIRITUAL_STATUS_FIELDS: { key: SpiritualStatusKey; label: string }[] = [
  { key: "baptisSelam", label: "Baptis Selam" },
  { key: "baptisRohKudus", label: "Baptis Roh Kudus" },
  { key: "msj1", label: "MSJ 1" },
  { key: "msj2", label: "MSJ 2" },
  { key: "msj3", label: "MSJ 3" },
  { key: "cgt1", label: "CGT 1" },
  { key: "cgt2", label: "CGT 2" },
  { key: "cgt3", label: "CGT 3" },
];

const inputClass =
  "w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

export function EditMemberDialog({
  member,
  cgLabel,
  onClose,
  onUpdated,
}: {
  member: Member;
  cgLabel: string | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<UpdateMemberFieldErrors>({});

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
    const fullName = String(formData.get("fullName") ?? "");
    const email = String(formData.get("email") ?? "");

    const errors = validateUpdateMemberInput({ fullName, email });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    const spiritualStatus = SPIRITUAL_STATUS_FIELDS.reduce<Record<string, boolean>>((acc, field) => {
      acc[field.key] = formData.get(field.key) === "on";
      return acc;
    }, {});

    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          nij: String(formData.get("nij") ?? ""),
          address: String(formData.get("address") ?? ""),
          birthPlace: String(formData.get("birthPlace") ?? ""),
          birthDate: String(formData.get("birthDate") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          pelayanan: String(formData.get("pelayanan") ?? ""),
          spiritualStatus,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFormError(data.error ?? "Gagal memperbarui data anggota");
        setFieldErrors(data.fieldErrors ?? {});
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onUpdated();
      router.refresh();
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
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-member-dialog-title"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(event) => event.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2
              id="edit-member-dialog-title"
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              Edit Anggota
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
            <Field label="Nama Lengkap" htmlFor="fullName" error={fieldErrors.fullName} required>
              <input
                id="fullName"
                name="fullName"
                type="text"
                defaultValue={member.fullName}
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="email" error={fieldErrors.email} required>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={member.email ?? ""}
                    disabled={isSubmitting}
                    className={cn(inputClass, "pl-10")}
                  />
                </div>
              </Field>

              <Field label="Role">
                <p className="rounded-full border-[1.5px] border-dashed border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
                  {getRoleLabel(member.role)}
                </p>
              </Field>
            </div>

            <Field label="CG">
              <p className="rounded-full border-[1.5px] border-dashed border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
                {cgGroupDisplayLabel(member.role, cgLabel)}
              </p>
            </Field>

            <p className="-mt-2 text-xs text-muted-foreground">
              Role dan CG diubah lewat halaman Struktur Organisasi, bukan dari form ini.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="No HP" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={member.phone ?? ""}
                  disabled={isSubmitting}
                  className={cn(inputClass, "font-mono")}
                />
              </Field>
              <Field label="NIJ" htmlFor="nij">
                <input
                  id="nij"
                  name="nij"
                  type="text"
                  defaultValue={member.nij ?? ""}
                  disabled={isSubmitting}
                  className={cn(inputClass, "font-mono")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tempat Lahir" htmlFor="birthPlace">
                <input
                  id="birthPlace"
                  name="birthPlace"
                  type="text"
                  defaultValue={member.birthPlace ?? ""}
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </Field>
              <Field label="Tanggal Lahir" htmlFor="birthDate">
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  defaultValue={toDateInputValue(member.birthDate)}
                  disabled={isSubmitting}
                  className={cn(inputClass, "font-mono")}
                />
              </Field>
            </div>

            <Field label="Pelayanan" htmlFor="pelayanan">
              <input
                id="pelayanan"
                name="pelayanan"
                type="text"
                defaultValue={member.pelayanan ?? ""}
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>

            <Field label="Alamat" htmlFor="address">
              <textarea
                id="address"
                name="address"
                rows={2}
                defaultValue={member.address ?? ""}
                disabled={isSubmitting}
                className="w-full resize-none rounded-2xl border-[1.5px] border-input bg-input/40 px-4 py-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>

            <fieldset className="flex flex-col gap-2.5 rounded-2xl border border-border p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status Rohani
              </legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {SPIRITUAL_STATUS_FIELDS.map((field) => (
                  <label
                    key={field.key}
                    htmlFor={`edit-${field.key}`}
                    className="flex items-center gap-2.5 text-sm text-foreground"
                  >
                    <input
                      id={`edit-${field.key}`}
                      name={field.key}
                      type="checkbox"
                      defaultChecked={member.spiritualStatus[field.key]}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-[1.5px] border-input text-primary focus-visible:ring-[3px] focus-visible:ring-ring/25"
                    />
                    {field.label}
                  </label>
                ))}
              </div>
            </fieldset>

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

function toDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}
