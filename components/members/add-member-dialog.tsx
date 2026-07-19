"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Mail, Loader2, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, assignableRolesForCreator, isCoach } from "@/lib/auth/roles";
import { validateCreateMemberInput, type CreateMemberFieldErrors } from "@/lib/members/validation";
import type { CgGroup } from "@/lib/cg-groups/types";

type SpiritualStatusKey =
  | "baptisSelam"
  | "baptisRohKudus"
  | "msj1"
  | "msj2"
  | "msj3"
  | "cgt1"
  | "cgt2"
  | "cgt3";

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

type SuccessState = {
  fullName: string;
  temporaryPassword: string;
};

export function AddMemberDialog({
  cgGroups,
  viewerRole,
  viewerCgGroupId,
}: {
  cgGroups: CgGroup[];
  viewerRole: string | null;
  viewerCgGroupId: string | null;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<CreateMemberFieldErrors>({});
  const [successState, setSuccessState] = React.useState<SuccessState | null>(null);
  const [selectedRole, setSelectedRole] = React.useState("");

  const assignableRoles = assignableRolesForCreator(viewerRole);
  const canPickCgGroup = isCoach(viewerRole);
  const ownCgGroup = cgGroups.find((group) => group.id === viewerCgGroupId) ?? null;
  const isNewMemberCoach = selectedRole === "coach";

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
    setFormError(null);
    setFieldErrors({});
    setSuccessState(null);
    setSelectedRole("");
    setIsOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessState(null);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "");
    const email = String(formData.get("email") ?? "");

    const errors = validateCreateMemberInput({ fullName, email });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    const role = String(formData.get("role") ?? "").trim();
    const cgGroupId = role === "coach" ? "" : canPickCgGroup ? String(formData.get("cgGroupId") ?? "").trim() : "";
    const spiritualStatus = SPIRITUAL_STATUS_FIELDS.reduce<Record<string, boolean>>((acc, field) => {
      acc[field.key] = formData.get(field.key) === "on";
      return acc;
    }, {});

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          role,
          cgGroupId,
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
        setFormError(data.error ?? "Gagal menambahkan anggota");
        setFieldErrors(data.fieldErrors ?? {});
        setIsSubmitting(false);
        return;
      }

      formRef.current?.reset();
      setSelectedRole("");
      setSuccessState({ fullName, temporaryPassword: data.temporaryPassword });
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setFormError("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        <UserPlus className="h-4 w-4" strokeWidth={2} />
        Tambah Anggota
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
              aria-labelledby="add-member-dialog-title"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2
                  id="add-member-dialog-title"
                  className="font-display text-lg font-bold tracking-tight text-foreground"
                >
                  Tambah Anggota
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

              {successState ? (
                <SuccessPanel
                  fullName={successState.fullName}
                  temporaryPassword={successState.temporaryPassword}
                  onAddAnother={() => setSuccessState(null)}
                  onClose={() => setIsOpen(false)}
                />
              ) : (
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 overflow-y-auto px-6 py-5"
                >
                  <Field label="Nama Lengkap" htmlFor="fullName" error={fieldErrors.fullName} required>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
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
                          disabled={isSubmitting}
                          className={cn(inputClass, "pl-10")}
                        />
                      </div>
                    </Field>

                    <Field label="Role" htmlFor="role" error={fieldErrors.role}>
                      <select
                        id="role"
                        name="role"
                        disabled={isSubmitting}
                        value={selectedRole}
                        onChange={(event) => setSelectedRole(event.target.value)}
                        className={inputClass}
                      >
                        <option value="">Belum ditentukan</option>
                        {assignableRoles.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <p className="-mt-2 text-xs text-muted-foreground">
                    Password sementara dibuat otomatis oleh sistem setelah anggota berhasil ditambahkan.
                    Anggota bisa menggantinya sendiri setelah login pertama.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {isNewMemberCoach ? (
                      <Field label="CG">
                        <p className="rounded-full border-[1.5px] border-dashed border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
                          Coach mengelola semua CG
                        </p>
                      </Field>
                    ) : canPickCgGroup ? (
                      <Field label="CG" htmlFor="cgGroupId" error={fieldErrors.cgGroupId}>
                        <select
                          id="cgGroupId"
                          name="cgGroupId"
                          disabled={isSubmitting}
                          defaultValue=""
                          className={inputClass}
                        >
                          <option value="">Belum ditentukan</option>
                          {cgGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.groupCode}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ) : (
                      <Field label="CG" htmlFor="cgGroupIdDisplay">
                        <input
                          id="cgGroupIdDisplay"
                          type="text"
                          disabled
                          readOnly
                          value={ownCgGroup ? ownCgGroup.groupCode : "CG Anda saat ini"}
                          className={cn(inputClass, "text-muted-foreground")}
                        />
                      </Field>
                    )}

                    <Field label="NIJ" htmlFor="nij">
                      <input id="nij" name="nij" type="text" disabled={isSubmitting} className={cn(inputClass, "font-mono")} />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="No HP" htmlFor="phone">
                      <input id="phone" name="phone" type="tel" disabled={isSubmitting} className={cn(inputClass, "font-mono")} />
                    </Field>
                    <Field label="Tempat Lahir" htmlFor="birthPlace">
                      <input id="birthPlace" name="birthPlace" type="text" disabled={isSubmitting} className={inputClass} />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tanggal Lahir" htmlFor="birthDate">
                      <input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        disabled={isSubmitting}
                        className={cn(inputClass, "font-mono")}
                      />
                    </Field>
                    <Field label="Pelayanan" htmlFor="pelayanan">
                      <input id="pelayanan" name="pelayanan" type="text" disabled={isSubmitting} className={inputClass} />
                    </Field>
                  </div>

                  <Field label="Alamat" htmlFor="address">
                    <textarea
                      id="address"
                      name="address"
                      rows={2}
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
                          htmlFor={field.key}
                          className="flex items-center gap-2.5 text-sm text-foreground"
                        >
                          <input
                            id={field.key}
                            name={field.key}
                            type="checkbox"
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
                        "Simpan Anggota"
                      )}
                    </button>
                  </div>
                </form>
              )}
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

function SuccessPanel({
  fullName,
  temporaryPassword,
  onAddAnother,
  onClose,
}: {
  fullName: string;
  temporaryPassword: string;
  onAddAnother: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="h-6 w-6" strokeWidth={2.5} />
      </span>
      <div>
        <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
          {fullName} berhasil ditambahkan
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Data anggota baru sudah tersimpan.</p>
      </div>

      <div className="w-full rounded-2xl border border-warning/40 bg-warning/10 p-4 text-left">
        <p className="text-xs font-medium uppercase tracking-wide text-warning-foreground">
          Password Sementara
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">{temporaryPassword}</span>
          <button
            type="button"
            onClick={copyPassword}
            className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
            {copied ? "Tersalin" : "Salin"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Teruskan email dan password ini ke anggota baru. Minta mereka menggantinya setelah login pertama.
        </p>
      </div>

      <div className="mt-2 flex w-full items-center justify-center gap-3">
        <button
          type="button"
          onClick={onAddAnother}
          className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
        >
          Tambah Lagi
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}