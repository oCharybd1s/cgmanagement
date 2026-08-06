"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, TriangleAlert } from "lucide-react";
import type { CgGroup } from "@/lib/cg-groups/types";
import type { FormerMemberReason } from "@/lib/former-members/types";

const REASON_LABELS: Record<FormerMemberReason, string> = {
  graduated: "Lulus",
  moved: "Pindah Kota",
  unresponsive: "Tidak Merespon",
  other: "Lainnya",
};

type CgGroupMember = {
  id: string;
  fullName: string;
  role: string | null;
};

type MemberDispositionState = {
  action: "move" | "remove";
  targetCgGroupId: string;
  formerMemberReason: FormerMemberReason;
  notes: string;
};

export function DeleteCgGroupDialog({
  open,
  onClose,
  cgGroup,
  availableTargets,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  cgGroup: CgGroup;
  availableTargets: CgGroup[];
  onDeleted: (cgGroupId: string) => void;
}) {
  const [members, setMembers] = React.useState<CgGroupMember[]>([]);
  const [dispositions, setDispositions] = React.useState<Record<string, MemberDispositionState>>({});
  const [reason, setReason] = React.useState("");
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    let isCancelled = false;

    Promise.resolve()
      .then(() => {
        if (isCancelled) return undefined;
        setIsLoadingMembers(true);
        setError(null);
        return fetch(`/api/cg-groups/${cgGroup.id}`);
      })
      .then((response) => response?.json())
      .then((data) => {
        if (isCancelled || !data?.ok) return;
        const loadedMembers = data.members as CgGroupMember[];
        setMembers(loadedMembers);
        setDispositions(
          Object.fromEntries(
            loadedMembers.map((member) => [
              member.id,
              { action: "remove", targetCgGroupId: "", formerMemberReason: "other", notes: "" } as MemberDispositionState,
            ]),
          ),
        );
      })
      .catch(() => {
        if (!isCancelled) setError("Gagal memuat data member CG");
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingMembers(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [open, cgGroup.id]);

  function updateDisposition(memberId: string, patch: Partial<MemberDispositionState>) {
    setDispositions((previous) => ({
      ...previous,
      [memberId]: { ...previous[memberId], ...patch },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!reason.trim()) {
      setError("Alasan penghapusan wajib diisi");
      return;
    }

    for (const member of members) {
      const disposition = dispositions[member.id];
      if (disposition?.action === "move" && !disposition.targetCgGroupId) {
        setError(`Pilih CG tujuan untuk ${member.fullName}`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/cg-groups/${cgGroup.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          dispositions: members.map((member) => {
            const disposition = dispositions[member.id];
            if (disposition.action === "move") {
              return { memberId: member.id, action: "move", targetCgGroupId: disposition.targetCgGroupId };
            }
            return {
              memberId: member.id,
              action: "remove",
              formerMemberReason: disposition.formerMemberReason,
              notes: disposition.notes.trim() || null,
            };
          }),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Gagal menghapus CG");
        return;
      }

      onDeleted(cgGroup.id);
      onClose();
    } catch {
      setError("Gagal menghapus CG. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <React.Fragment>
          <motion.div
            key="delete-cg-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            key="delete-cg-panel"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-h-[85vh] max-w-lg -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:inset-x-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-cg-title"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <TriangleAlert className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                <div>
                  <h2 id="delete-cg-title" className="font-display text-lg font-bold tracking-tight text-foreground">
                    Hapus {cgGroup.groupCode}
                  </h2>
                  <p className="text-xs text-muted-foreground">Aksi ini tidak bisa dibatalkan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Tutup"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="delete-cg-reason" className="text-xs font-medium text-muted-foreground">
                    Alasan penghapusan
                  </label>
                  <textarea
                    id="delete-cg-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    disabled={isSubmitting}
                    rows={2}
                    placeholder="Contoh: salah input, CG digabung ke YS41, dst."
                    className="w-full rounded-xl border-[1.5px] border-input bg-input/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-[3px] focus:ring-ring/25 disabled:opacity-50"
                  />
                </div>

                {isLoadingMembers ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={2} />
                    Memuat member...
                  </div>
                ) : members.length === 0 ? (
                  <p className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                    CG ini tidak punya member. Saldo kas (jika ada) akan dipindahkan ke Kas Coach.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Tentukan nasib {members.length} member di CG ini
                    </p>
                    {members.map((member) => (
                      <MemberDispositionRow
                        key={member.id}
                        member={member}
                        disposition={dispositions[member.id]}
                        availableTargets={availableTargets}
                        disabled={isSubmitting}
                        onChange={(patch) => updateDisposition(member.id, patch)}
                      />
                    ))}
                  </div>
                )}

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border p-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingMembers}
                  className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground transition-colors duration-200 hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
                  Hapus CG
                </button>
              </div>
            </form>
          </motion.div>
        </React.Fragment>
      ) : null}
    </AnimatePresence>
  );
}

function MemberDispositionRow({
  member,
  disposition,
  availableTargets,
  disabled,
  onChange,
}: {
  member: CgGroupMember;
  disposition: MemberDispositionState | undefined;
  availableTargets: CgGroup[];
  disabled: boolean;
  onChange: (patch: Partial<MemberDispositionState>) => void;
}) {
  if (!disposition) return null;

  return (
    <div className="rounded-xl border border-border bg-input/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{member.fullName}</span>
        <div className="flex overflow-hidden rounded-full border border-border text-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ action: "move" })}
            className={
              disposition.action === "move"
                ? "bg-primary px-3 py-1 font-medium text-primary-foreground"
                : "bg-transparent px-3 py-1 font-medium text-muted-foreground hover:bg-muted"
            }
          >
            Pindah
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ action: "remove" })}
            className={
              disposition.action === "remove"
                ? "bg-destructive px-3 py-1 font-medium text-destructive-foreground"
                : "bg-transparent px-3 py-1 font-medium text-muted-foreground hover:bg-muted"
            }
          >
            Hapus
          </button>
        </div>
      </div>

      {disposition.action === "move" ? (
        <select
          value={disposition.targetCgGroupId}
          onChange={(event) => onChange({ targetCgGroupId: event.target.value })}
          disabled={disabled}
          className="mt-2 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
        >
          <option value="">Pilih CG tujuan</option>
          {availableTargets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.groupCode}
            </option>
          ))}
        </select>
      ) : (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select
            value={disposition.formerMemberReason}
            onChange={(event) => onChange({ formerMemberReason: event.target.value as FormerMemberReason })}
            disabled={disabled}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground sm:w-40"
          >
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={disposition.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
            disabled={disabled}
            placeholder="Catatan (opsional)"
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
}
