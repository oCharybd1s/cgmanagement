"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Circle, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  bendaharaScopeForRole,
  canAssignBendahara,
  canDeleteMember,
  canEditMember,
  cgGroupDisplayLabel,
  getRoleLabel,
} from "@/lib/auth/roles";
import { EditMemberDialog } from "@/components/members/edit-member-dialog";
import { DeleteMemberDialog } from "@/components/members/delete-member-dialog";
import { ResetPasswordDialog } from "@/components/members/reset-password-dialog";
import { PasswordStatusPanel } from "@/components/members/password-status-panel";
import type { Member, SpiritualStatus } from "@/lib/members/types";

const SPIRITUAL_STATUS_FIELDS: { key: keyof SpiritualStatus; label: string }[] = [
  { key: "baptisSelam", label: "Baptis Selam" },
  { key: "baptisRohKudus", label: "Baptis Roh Kudus" },
  { key: "msj1", label: "MSJ 1" },
  { key: "msj2", label: "MSJ 2" },
  { key: "msj3", label: "MSJ 3" },
  { key: "cgt1", label: "CGT 1" },
  { key: "cgt2", label: "CGT 2" },
  { key: "cgt3", label: "CGT 3" },
];

export function MemberDetailDialog({
  member,
  cgLabel,
  viewerRole,
  viewerCgGroupId,
  viewerUserId,
  onClose,
  onMemberUpdated,
  onMemberDeleted,
}: {
  member: Member | null;
  cgLabel: string | null;
  viewerRole: string | null;
  viewerCgGroupId: string | null;
  viewerUserId: string | null;
  onClose: () => void;
  onMemberUpdated?: (member: Member) => void;
  onMemberDeleted?: (memberId: string) => void;
}) {
  const router = useRouter();
  const [renderedMemberId, setRenderedMemberId] = React.useState(member?.id ?? null);
  const [localIsBendahara, setLocalIsBendahara] = React.useState(member?.isBendahara ?? false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [bendaharaError, setBendaharaError] = React.useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);

  if (member && member.id !== renderedMemberId) {
    setRenderedMemberId(member.id);
    setLocalIsBendahara(member.isBendahara);
    setBendaharaError(null);
    setIsUpdating(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setIsResetPasswordOpen(false);
  }

  React.useEffect(() => {
    if (!member) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [member, onClose]);

  const bendaharaScope = member ? bendaharaScopeForRole(member.role) : null;
  const canManageBendahara =
    member !== null &&
    bendaharaScope !== null &&
    canAssignBendahara(viewerRole, viewerCgGroupId, member.role, member.cgGroupId);
  const canEdit =
    member !== null && canEditMember(viewerRole, viewerCgGroupId, member.role, member.cgGroupId);
  const canDelete =
    member !== null &&
    viewerUserId !== member.id &&
    canDeleteMember(viewerRole, viewerCgGroupId, member.role, member.cgGroupId);

  async function toggleBendahara() {
    if (!member) {
      return;
    }
    setIsUpdating(true);
    setBendaharaError(null);
    try {
      const response = await fetch(`/api/members/${member.id}/bendahara`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBendahara: !localIsBendahara }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setBendaharaError(data.error ?? "Gagal memperbarui status bendahara");
        setIsUpdating(false);
        return;
      }
      setLocalIsBendahara(data.isBendahara);
      setIsUpdating(false);
      router.refresh();
    } catch {
      setBendaharaError("Tidak bisa menghubungi server, coba lagi");
      setIsUpdating(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {member ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="member-detail-dialog-title"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="min-w-0">
                  <h2
                    id="member-detail-dialog-title"
                    className="truncate font-display text-lg font-bold tracking-tight text-foreground"
                  >
                    {member.fullName || "Tanpa nama"}
                  </h2>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(member.role)}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
                <div className="flex flex-wrap gap-1.5">
                  <DetailBadge>{getRoleLabel(member.role)}</DetailBadge>
                  <DetailBadge>{cgGroupDisplayLabel(member.role, cgLabel)}</DetailBadge>
                  {localIsBendahara ? <DetailBadge tone="spark">Bendahara</DetailBadge> : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="NIJ" mono>
                    {member.nij ?? "Belum diisi"}
                  </DetailField>
                  <DetailField label="Pelayanan">{member.pelayanan ?? "-"}</DetailField>
                  <DetailField label="Email">{member.email ?? "-"}</DetailField>
                  <DetailField label="No HP" mono>
                    {member.phone ?? "-"}
                  </DetailField>
                  <DetailField label="Tempat Lahir">{member.birthPlace ?? "-"}</DetailField>
                  <DetailField label="Tanggal Lahir" mono>
                    {formatBirthDate(member.birthDate)}
                  </DetailField>
                </div>

                <DetailField label="Alamat">{member.address ?? "-"}</DetailField>

                <div className="flex flex-col gap-2.5 rounded-2xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status Rohani
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {SPIRITUAL_STATUS_FIELDS.map((field) => {
                      const isDone = member.spiritualStatus[field.key];
                      return (
                        <div key={field.key} className="flex items-center gap-2.5 text-sm text-foreground">
                          {isDone ? (
                            <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                          )}
                          {field.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {canEdit ? <PasswordStatusPanel member={member} onResetPassword={() => setIsResetPasswordOpen(true)} /> : null}

                {canManageBendahara ? (
                  <div className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-border p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      {bendaharaScope === "coach"
                        ? "Bendahara Kas Coach — membantu Coach mengelola kas Coach."
                        : "Bendahara Kas CG — mengelola kas CG ini."}
                    </p>
                    {bendaharaError ? <p className="text-xs text-destructive">{bendaharaError}</p> : null}
                    <button
                      type="button"
                      onClick={toggleBendahara}
                      disabled={isUpdating}
                      className="self-start rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors duration-200 hover:bg-muted disabled:opacity-60"
                    >
                      {isUpdating
                        ? "Menyimpan..."
                        : localIsBendahara
                          ? "Cabut Status Bendahara"
                          : "Jadikan Bendahara"}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <div className="flex items-center gap-2">
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsDeleteOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                      Hapus
                    </button>
                  ) : null}
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => setIsEditOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2} />
                      Edit
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {member && isEditOpen ? (
        <EditMemberDialog
          member={member}
          cgLabel={cgLabel}
          onClose={() => setIsEditOpen(false)}
          onUpdated={(updatedMember) => {
            setIsEditOpen(false);
            onMemberUpdated?.(updatedMember);
            onClose();
          }}
        />
      ) : null}

      {member && isDeleteOpen ? (
        <DeleteMemberDialog
          member={member}
          onClose={() => setIsDeleteOpen(false)}
          onDeleted={() => {
            setIsDeleteOpen(false);
            onMemberDeleted?.(member.id);
            onClose();
          }}
        />
      ) : null}

      {member && isResetPasswordOpen ? (
        <ResetPasswordDialog
          member={member}
          onClose={() => setIsResetPasswordOpen(false)}
          onReset={() => onMemberUpdated?.({ ...member, mustChangePassword: true })}
        />
      ) : null}
    </>
  );
}

function DetailField({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-sm text-foreground", mono ? "font-mono font-tabular" : "")}>{children}</p>
    </div>
  );
}

function DetailBadge({
  tone,
  children,
}: {
  tone?: "muted" | "spark";
  children: React.ReactNode;
}) {
  const toneClasses = tone === "spark" ? "bg-brand-spark text-brand-spark-foreground" : "bg-muted text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneClasses)}>
      {children}
    </span>
  );
}

function formatBirthDate(value: string | null): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
