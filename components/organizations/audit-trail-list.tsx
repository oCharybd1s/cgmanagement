import { ShieldCheck, ArrowRightLeft, Trash2 } from "lucide-react";
import type { OrganizationLogEntry } from "@/lib/organizations/log";

const ACTION_LABELS: Record<string, string> = {
  promote: "Promosi",
  demote: "Demosi",
  delete_cg: "Hapus CG",
};

export function AuditTrailList({ entries }: { entries: OrganizationLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" strokeWidth={2} />
        </span>
        <h3 className="font-display text-base font-bold tracking-tight text-foreground">Belum ada aktivitas</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Riwayat perubahan struktur organisasi akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">Audit Trail</h2>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <AuditTrailRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function AuditTrailRow({ entry }: { entry: OrganizationLogEntry }) {
  const isDelete = entry.actionType === "delete_cg";
  const label = ACTION_LABELS[entry.actionType] ?? entry.actionType;
  const metadata = entry.metadata ?? {};

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            {isDelete ? <Trash2 className="h-4 w-4" strokeWidth={2} /> : <ArrowRightLeft className="h-4 w-4" strokeWidth={2} />}
          </span>
          <span className="font-display text-sm font-bold tracking-tight text-foreground">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
      </div>

      <dl className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
        {entry.cgGroupId ? <Field label="CG" value={String(metadata.groupCode ?? entry.cgGroupId)} /> : null}
        {entry.oldRole ? <Field label="Role lama" value={entry.oldRole} /> : null}
        {entry.newRole ? <Field label="Role baru" value={entry.newRole} /> : null}
        {isDelete ? <Field label="Member dipindah" value={String(metadata.movedCount ?? 0)} /> : null}
        {isDelete ? <Field label="Member dihapus" value={String(metadata.removedCount ?? 0)} /> : null}
        {isDelete ? (
          <Field label="Saldo dipindah ke Kas Coach" value={formatCurrency(Number(metadata.kasBalanceMovedToCoach ?? 0))} />
        ) : null}
        <Field label="Oleh" value={entry.changedBy ?? "-"} />
      </dl>

      {entry.reason ? <p className="mt-3 text-sm text-foreground">{entry.reason}</p> : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 sm:justify-start">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}
