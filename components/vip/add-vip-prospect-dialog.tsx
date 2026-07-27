"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isCoach } from "@/lib/auth/roles";
import { validateVipProspectInput, type VipProspectFieldErrors } from "@/lib/vip-prospects/validation";
import type { VipProspect, VipProspectStatus } from "@/lib/vip-prospects/types";
import type { CgGroup } from "@/lib/cg-groups/types";
import type { Member } from "@/lib/members/types";

const STATUS_OPTIONS: { value: VipProspectStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "accept", label: "Accept" },
  { value: "reject", label: "Reject" },
];

const inputClass =
  "w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

export function AddVipProspectDialog({
  cgGroups,
  members,
  viewerRole,
  viewerCgGroupId,
  onCreated,
}: {
  cgGroups: CgGroup[];
  members: Member[];
  viewerRole: string | null;
  viewerCgGroupId: string | null;
  onCreated?: (prospect: VipProspect) => void;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<VipProspectFieldErrors>({});
  const [selectedCgId, setSelectedCgId] = React.useState("");

  const canPickCgGroup = isCoach(viewerRole);
  const ownCgGroup = cgGroups.find((group) => group.id === viewerCgGroupId) ?? null;

  const followUpCandidates = React.useMemo(() => {
    if (!canPickCgGroup) {
      return members;
    }
    return members.filter((member) => member.cgGroupId === selectedCgId || member.role === "coach");
  }, [canPickCgGroup, members, selectedCgId]);

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
    setSelectedCgId("");
    setIsOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");

    const errors = validateVipProspectInput({ name });
    if (canPickCgGroup && String(formData.get("cgId") ?? "").trim() === "") {
      errors.cgId = "CG wajib dipilih";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/vip-prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: String(formData.get("phone") ?? ""),
          cgId: String(formData.get("cgId") ?? ""),
          followUpByUserId: String(formData.get("followUpByUserId") ?? ""),
          status: String(formData.get("status") ?? "pending"),
          notes: String(formData.get("notes") ?? ""),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFormError(data.error ?? "Gagal menambahkan data VIP");
        setFieldErrors(data.fieldErrors ?? {});
        setIsSubmitting(false);
        return;
      }

      formRef.current?.reset();
      setSelectedCgId("");
      setIsSubmitting(false);
      setIsOpen(false);
      onCreated?.(data.prospect);
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
        Tambah VIP
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
              aria-labelledby="add-vip-dialog-title"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2
                  id="add-vip-dialog-title"
                  className="font-display text-lg font-bold tracking-tight text-foreground"
                >
                  Tambah Data VIP
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
                <Field label="Nama" htmlFor="name" error={fieldErrors.name} required>
                  <input id="name" name="name" type="text" disabled={isSubmitting} className={inputClass} />
                </Field>

                <Field label="No WA" htmlFor="phone">
                  <input id="phone" name="phone" type="tel" disabled={isSubmitting} className={cn(inputClass, "font-mono")} />
                </Field>

                {canPickCgGroup ? (
                  <Field label="CG" htmlFor="cgId" error={fieldErrors.cgId} required>
                    <select
                      id="cgId"
                      name="cgId"
                      value={selectedCgId}
                      onChange={(event) => setSelectedCgId(event.target.value)}
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
                ) : (
                  <Field label="CG">
                    <p className="rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground">
                      {ownCgGroup?.groupCode ?? "CG kamu"}
                    </p>
                  </Field>
                )}

                <Field label="Follow-up Oleh" htmlFor="followUpByUserId">
                  <select id="followUpByUserId" name="followUpByUserId" disabled={isSubmitting} className={inputClass}>
                    <option value="">Belum ditentukan</option>
                    {followUpCandidates.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName || "Tanpa nama"}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status" htmlFor="status">
                  <select id="status" name="status" defaultValue="pending" disabled={isSubmitting} className={inputClass}>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Keterangan" htmlFor="notes">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
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
                      "Simpan Data VIP"
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
