"use client";

import * as React from "react";
import {
  ShieldCheck,
  UserCog,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  WalletCards,
  Copy,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel, canAssignBendahara, canPromoteMember, canDemoteMember } from "@/lib/auth/roles";
import { StructureActionDialog, type StructureActionOutcome } from "@/components/organizations/structure-action-dialog";
import type { OrganizationTreeCgGroup, OrganizationTreeMember } from "@/lib/organizations/tree";

export type PromoteResult = {
  memberId: string;
  cgGroupId: string;
  oldRole: string;
  newRole: string;
  swappedCglUserId: string | null;
  temporaryPassword: string | null;
};
export type DemoteResult = { memberId: string; cgGroupId: string; oldRole: string; newRole: string };
export type BendaharaResult = { cgGroupId: string; memberId: string; isBendahara: boolean };

export function CgTreeView({
  coach = [],
  group,
  viewerRole,
  viewerCgGroupId,
  onPromoted,
  onDemoted,
  onBendaharaChanged,
}: {
  coach?: OrganizationTreeMember[];
  group: OrganizationTreeCgGroup;
  viewerRole: string | null;
  viewerCgGroupId: string | null;
  onPromoted: (result: PromoteResult) => void;
  onDemoted: (result: DemoteResult) => void;
  onBendaharaChanged: (result: BendaharaResult) => void;
}) {
  const [promoteTarget, setPromoteTarget] = React.useState<OrganizationTreeMember | null>(null);
  const [demoteTarget, setDemoteTarget] = React.useState<OrganizationTreeMember | null>(null);
  const [bendaharaTarget, setBendaharaTarget] = React.useState<OrganizationTreeMember | null>(null);
  const [promoteEmail, setPromoteEmail] = React.useState("");
  const [promotedPasswordInfo, setPromotedPasswordInfo] = React.useState<{
    fullName: string;
    password: string;
  } | null>(null);

  const promoteNeedsEmail = promoteTarget?.role === "simpatisan" && promoteTarget.hasAccount === false;

  async function handlePromoteConfirm(): Promise<StructureActionOutcome> {
    if (!promoteTarget) {
      return { ok: false, error: "Anggota belum dipilih" };
    }

    const trimmedEmail = promoteEmail.trim();
    if (promoteNeedsEmail && !trimmedEmail) {
      return { ok: false, error: "Email wajib diisi" };
    }

    try {
      const response = await fetch("/api/struktur/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: promoteTarget.id,
          email: promoteNeedsEmail ? trimmedEmail : undefined,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        return { ok: false, error: result.error ?? "Gagal menaikkan anggota" };
      }

      onPromoted({
        memberId: result.memberId,
        cgGroupId: result.cgGroupId,
        oldRole: result.oldRole,
        newRole: result.newRole,
        swappedCglUserId: result.swappedCglUserId,
        temporaryPassword: result.temporaryPassword,
      });

      if (result.temporaryPassword) {
        setPromotedPasswordInfo({ fullName: promoteTarget.fullName, password: result.temporaryPassword });
      }
      setPromoteEmail("");
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menaikkan anggota. Periksa koneksi lalu coba lagi." };
    }
  }

  async function handleDemoteConfirm(): Promise<StructureActionOutcome> {
    if (!demoteTarget) {
      return { ok: false, error: "Anggota belum dipilih" };
    }

    try {
      const response = await fetch("/api/struktur/demote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: demoteTarget.id }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        return { ok: false, error: result.error ?? "Gagal menurunkan anggota" };
      }

      onDemoted({
        memberId: result.memberId,
        cgGroupId: result.cgGroupId,
        oldRole: result.oldRole,
        newRole: result.newRole,
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menurunkan anggota. Periksa koneksi lalu coba lagi." };
    }
  }

  async function handleBendaharaConfirm(): Promise<StructureActionOutcome> {
    if (!bendaharaTarget) {
      return { ok: false, error: "Anggota belum dipilih" };
    }

    const nextIsBendahara = !bendaharaTarget.isBendahara;

    try {
      const response = await fetch(`/api/members/${bendaharaTarget.id}/bendahara`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBendahara: nextIsBendahara }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        return { ok: false, error: result.error ?? "Gagal mengubah status Bendahara" };
      }

      onBendaharaChanged({ cgGroupId: group.id, memberId: result.memberId, isBendahara: result.isBendahara });
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal mengubah status Bendahara. Periksa koneksi lalu coba lagi." };
    }
  }

  const promoteLabel = promoteTarget ? promoteActionLabel(promoteTarget.role) : "";
  const promoteDescription = promoteTarget
    ? promoteTarget.role === "sponsor"
      ? group.cgl
        ? `Jadikan ${promoteTarget.fullName} sebagai CGL baru untuk ${group.groupCode}? ${group.cgl.fullName} akan otomatis diturunkan menjadi Sponsor.`
        : `Jadikan ${promoteTarget.fullName} sebagai CGL untuk ${group.groupCode}?`
      : `${promoteLabel} ${promoteTarget.fullName}?${promoteNeedsEmail ? " Masukkan email untuk membuatkan akun login." : ""}`
    : "";

  const demoteLabel = demoteTarget ? demoteActionLabel(demoteTarget.role) : "";
  const demoteDescription = demoteTarget
    ? demoteTarget.role === "cgl"
      ? `Turunkan ${demoteTarget.fullName} dari CGL menjadi Sponsor untuk ${group.groupCode}? CG ini akan sementara tanpa CGL.`
      : `${demoteLabel} ${demoteTarget.fullName}?`
    : "";

  const bendaharaDescription = bendaharaTarget
    ? bendaharaTarget.isBendahara
      ? `Cabut status Bendahara dari ${bendaharaTarget.fullName}?`
      : bendaharaTarget.role === "cgl"
        ? `Jadikan ${bendaharaTarget.fullName} sebagai Bendahara Kas Coach?`
        : `Jadikan ${bendaharaTarget.fullName} sebagai Bendahara Kas ${group.groupCode}?`
    : "";

  const canDemoteCgl = group.cgl !== null && canDemoteMember(viewerRole, viewerCgGroupId, "cgl", group.id);
  const canAssignCglBendahara =
    group.cgl !== null && canAssignBendahara(viewerRole, viewerCgGroupId, group.cgl.role, group.id);

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card/40 px-4 py-10 shadow-sm backdrop-blur-xl">
      {coach.length > 0 ? (
        <React.Fragment>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {coach.map((person) => (
              <TreeNode key={person.id} icon={ShieldCheck} label="Coach" name={person.fullName} tone="primary" />
            ))}
          </div>

          <Connector />
        </React.Fragment>
      ) : null}

      <TreeNode label="CG" name={group.groupCode} tone="accent" />

      <Connector />

      {group.cgl ? (
        <div className="flex flex-col items-center gap-2">
          <TreeNode icon={UserCog} label="CGL" name={group.cgl.fullName} tone="secondary" />

          {group.cgl.isBendahara ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
              <WalletCards className="h-3 w-3" strokeWidth={2} />
              Bendahara Kas Coach
            </span>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {canDemoteCgl ? (
              <button
                type="button"
                onClick={() => setDemoteTarget(group.cgl)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-destructive hover:text-destructive"
              >
                <ArrowDownCircle className="h-3.5 w-3.5" strokeWidth={2} />
                Turunkan ke Sponsor
              </button>
            ) : null}

            {canAssignCglBendahara ? (
              <button
                type="button"
                onClick={() => setBendaharaTarget(group.cgl)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                  group.cgl.isBendahara
                    ? "border-warning/40 bg-warning/10 text-warning-foreground hover:border-destructive hover:text-destructive dark:text-warning"
                    : "border-border text-muted-foreground hover:border-warning hover:text-warning-foreground dark:hover:text-warning",
                )}
              >
                <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
                {group.cgl.isBendahara ? "Cabut Bendahara" : "Jadikan Bendahara"}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <TreeNode label="CGL" name="Belum ada CGL" tone="empty" />
      )}

      <Connector />

      <TreeTier
        label="Sponsor"
        members={group.sponsors}
        emptyLabel="Belum ada Sponsor di CG ini"
        renderAction={(member) => (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {canPromoteMember(viewerRole, viewerCgGroupId, member.role, group.id) ? (
                <button
                  type="button"
                  onClick={() => setPromoteTarget(member)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" strokeWidth={2} />
                  Jadikan CGL
                </button>
              ) : null}
              {canDemoteMember(viewerRole, viewerCgGroupId, member.role, group.id) ? (
                <button
                  type="button"
                  onClick={() => setDemoteTarget(member)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-destructive hover:text-destructive"
                >
                  <ArrowDownCircle className="h-3.5 w-3.5" strokeWidth={2} />
                  Turunkan ke Member
                </button>
              ) : null}
            </div>
            {canAssignBendahara(viewerRole, viewerCgGroupId, member.role, group.id) ? (
              <button
                type="button"
                onClick={() => setBendaharaTarget(member)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                  member.isBendahara
                    ? "border-warning/40 bg-warning/10 text-warning-foreground hover:border-destructive hover:text-destructive dark:text-warning"
                    : "border-border text-muted-foreground hover:border-warning hover:text-warning-foreground dark:hover:text-warning",
                )}
              >
                <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
                {member.isBendahara ? "Cabut Bendahara" : "Jadikan Bendahara"}
              </button>
            ) : null}
          </div>
        )}
      />

      <Connector />

      <TreeTier
        label="Member"
        members={group.members}
        emptyLabel="Belum ada Member di CG ini"
        renderAction={(member) => (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {canPromoteMember(viewerRole, viewerCgGroupId, member.role, group.id) ? (
              <button
                type="button"
                onClick={() => setPromoteTarget(member)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
              >
                <ArrowUpCircle className="h-3.5 w-3.5" strokeWidth={2} />
                Jadikan Sponsor
              </button>
            ) : null}
            {canDemoteMember(viewerRole, viewerCgGroupId, member.role, group.id) ? (
              <button
                type="button"
                onClick={() => setDemoteTarget(member)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-destructive hover:text-destructive"
              >
                <ArrowDownCircle className="h-3.5 w-3.5" strokeWidth={2} />
                Turunkan ke Simpatisan
              </button>
            ) : null}
          </div>
        )}
      />

      <Connector />

      <TreeTier
        label="Simpatisan"
        members={group.simpatisans}
        emptyLabel="Belum ada Simpatisan di CG ini"
        renderAction={(member) =>
          canPromoteMember(viewerRole, viewerCgGroupId, member.role, group.id) ? (
            <button
              type="button"
              onClick={() => setPromoteTarget(member)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
            >
              <ArrowUpCircle className="h-3.5 w-3.5" strokeWidth={2} />
              Jadikan Member
            </button>
          ) : null
        }
      />

      <StructureActionDialog
        open={promoteTarget !== null}
        title={promoteTarget?.role === "sponsor" ? "Jadikan CGL" : promoteLabel}
        description={promoteDescription}
        confirmLabel={promoteTarget?.role === "sponsor" ? "Jadikan CGL" : promoteLabel}
        onClose={() => {
          setPromoteTarget(null);
          setPromoteEmail("");
        }}
        onConfirm={handlePromoteConfirm}
      >
        {promoteNeedsEmail ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="promote-email" className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="promote-email"
              type="email"
              value={promoteEmail}
              onChange={(event) => setPromoteEmail(event.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
          </div>
        ) : null}
      </StructureActionDialog>

      <StructureActionDialog
        open={demoteTarget !== null}
        title={demoteTarget?.role === "cgl" ? "Turunkan CGL" : demoteLabel}
        description={demoteDescription}
        confirmLabel={demoteTarget?.role === "cgl" ? "Turunkan" : demoteLabel}
        tone="destructive"
        onClose={() => setDemoteTarget(null)}
        onConfirm={handleDemoteConfirm}
      />

      <StructureActionDialog
        open={bendaharaTarget !== null}
        title={bendaharaTarget?.isBendahara ? "Cabut Bendahara" : "Jadikan Bendahara"}
        description={bendaharaDescription}
        confirmLabel={bendaharaTarget?.isBendahara ? "Cabut" : "Jadikan Bendahara"}
        tone={bendaharaTarget?.isBendahara ? "destructive" : "primary"}
        onClose={() => setBendaharaTarget(null)}
        onConfirm={handleBendaharaConfirm}
      />

      {promotedPasswordInfo ? (
        <PromotedPasswordDialog info={promotedPasswordInfo} onClose={() => setPromotedPasswordInfo(null)} />
      ) : null}
    </div>
  );
}

function promoteActionLabel(role: string): string {
  if (role === "simpatisan") return "Jadikan Member";
  if (role === "member") return "Jadikan Sponsor";
  if (role === "sponsor") return "Jadikan CGL";
  return "Naikkan";
}

function demoteActionLabel(role: string): string {
  if (role === "cgl") return "Turunkan ke Sponsor";
  if (role === "sponsor") return "Turunkan ke Member";
  if (role === "member") return "Turunkan ke Simpatisan";
  return "Turunkan";
}

function PromotedPasswordDialog({
  info,
  onClose,
}: {
  info: { fullName: string; password: string };
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(info.password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-2xl"
      >
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {info.fullName} Sekarang Member
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Akun login sudah dibuat. Teruskan password sementara ini, mereka akan diminta ganti password saat login
          pertama.
        </p>

        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-warning-foreground dark:text-warning">
            Password Sementara
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">{info.password}</span>
            <button
              type="button"
              onClick={copyPassword}
              className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
            >
              {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}

function Connector() {
  return <div aria-hidden="true" className="h-6 w-px bg-border" />;
}

function TreeNode({
  icon: Icon,
  label,
  name,
  tone,
}: {
  icon?: LucideIcon;
  label: string;
  name: string;
  tone: "primary" | "secondary" | "accent" | "empty";
}) {
  const toneClasses: Record<typeof tone, string> = {
    primary: "border-primary bg-primary text-primary-foreground",
    secondary: "border-border bg-card text-foreground",
    accent: "border-accent bg-accent text-accent-foreground",
    empty: "border-dashed border-border bg-muted/40 text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "flex min-w-40 flex-col items-center gap-1 rounded-2xl border-[1.5px] px-5 py-3 text-center shadow-sm",
        toneClasses[tone],
      )}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide opacity-80">
        {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2} /> : null}
        {label}
      </span>
      <span className="font-display text-sm font-bold tracking-tight">{name}</span>
    </div>
  );
}

function TreeTier({
  label,
  members,
  emptyLabel,
  renderAction,
}: {
  label: string;
  members: OrganizationTreeMember[];
  emptyLabel: string;
  renderAction?: (member: OrganizationTreeMember) => React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label} ({members.length})
      </span>

      {members.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap items-start justify-center gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-3 text-center shadow-sm"
            >
              <p className="text-sm font-medium text-foreground">{member.fullName}</p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {getRoleLabel(member.role)}
                </span>
                {member.isBendahara ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
                    <WalletCards className="h-3 w-3" strokeWidth={2} />
                    Bendahara
                  </span>
                ) : null}
              </div>
              {renderAction ? renderAction(member) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
