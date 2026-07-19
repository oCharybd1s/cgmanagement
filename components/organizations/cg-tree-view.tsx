"use client";

import * as React from "react";
import { ShieldCheck, UserCog, ArrowUpCircle, ArrowDownCircle, Wallet, WalletCards, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel, canAssignBendahara } from "@/lib/auth/roles";
import { StructureActionDialog, type StructureActionOutcome } from "@/components/organizations/structure-action-dialog";
import type { OrganizationTreeCgGroup, OrganizationTreeMember } from "@/lib/organizations/tree";

export type PromoteResult = { cgGroupId: string; newCglUserId: string; previousCglUserId: string | null };
export type DemoteResult = { cgGroupId: string; demotedUserId: string };
export type BendaharaResult = { cgGroupId: string; memberId: string; isBendahara: boolean };

export function CgTreeView({
  coach,
  group,
  viewerRole,
  viewerCgGroupId,
  onPromoted,
  onDemoted,
  onBendaharaChanged,
}: {
  coach: OrganizationTreeMember | null;
  group: OrganizationTreeCgGroup;
  viewerRole: string | null;
  viewerCgGroupId: string | null;
  onPromoted: (result: PromoteResult) => void;
  onDemoted: (result: DemoteResult) => void;
  onBendaharaChanged: (result: BendaharaResult) => void;
}) {
  const [promoteTarget, setPromoteTarget] = React.useState<OrganizationTreeMember | null>(null);
  const [demoteOpen, setDemoteOpen] = React.useState(false);
  const [bendaharaTarget, setBendaharaTarget] = React.useState<OrganizationTreeMember | null>(null);

  async function handlePromoteConfirm(): Promise<StructureActionOutcome> {
    if (!promoteTarget) {
      return { ok: false, error: "Anggota belum dipilih" };
    }

    try {
      const response = await fetch("/api/struktur/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cgGroupId: group.id, memberId: promoteTarget.id }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        return { ok: false, error: result.error ?? "Gagal menjadikan CGL" };
      }

      onPromoted({
        cgGroupId: result.cgGroupId,
        newCglUserId: result.newCglUserId,
        previousCglUserId: result.previousCglUserId,
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menjadikan CGL. Periksa koneksi lalu coba lagi." };
    }
  }

  async function handleDemoteConfirm(): Promise<StructureActionOutcome> {
    try {
      const response = await fetch("/api/struktur/demote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cgGroupId: group.id }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        return { ok: false, error: result.error ?? "Gagal menurunkan CGL" };
      }

      onDemoted({ cgGroupId: result.cgGroupId, demotedUserId: result.demotedUserId });
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menurunkan CGL. Periksa koneksi lalu coba lagi." };
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

      onBendaharaChanged({
        cgGroupId: group.id,
        memberId: result.memberId,
        isBendahara: result.isBendahara,
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal mengubah status Bendahara. Periksa koneksi lalu coba lagi." };
    }
  }

  const promoteDescription = promoteTarget
    ? group.cgl
      ? `Jadikan ${promoteTarget.fullName} sebagai CGL baru untuk ${group.groupCode}? ${group.cgl.fullName} akan otomatis diturunkan menjadi Sponsor.`
      : `Jadikan ${promoteTarget.fullName} sebagai CGL untuk ${group.groupCode}?`
    : "";

  const demoteDescription = group.cgl
    ? `Turunkan ${group.cgl.fullName} dari CGL menjadi Sponsor untuk ${group.groupCode}? CG ini akan sementara tanpa CGL.`
    : "";

  const bendaharaDescription = bendaharaTarget
    ? bendaharaTarget.isBendahara
      ? `Cabut status Bendahara dari ${bendaharaTarget.fullName}?`
      : bendaharaTarget.role === "cgl"
        ? `Jadikan ${bendaharaTarget.fullName} sebagai Bendahara Kas Coach?`
        : `Jadikan ${bendaharaTarget.fullName} sebagai Bendahara Kas ${group.groupCode}?`
    : "";

  const canAssignCglBendahara =
    group.cgl !== null && canAssignBendahara(viewerRole, viewerCgGroupId, group.cgl.role, group.id);

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card/40 px-4 py-10 shadow-sm backdrop-blur-xl">
      <TreeNode icon={ShieldCheck} label="Coach" name={coach?.fullName || "Belum ada Coach"} tone="primary" />

      <Connector />

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
            <button
              type="button"
              onClick={() => setDemoteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-destructive hover:text-destructive"
            >
              <ArrowDownCircle className="h-3.5 w-3.5" strokeWidth={2} />
              Turunkan ke Sponsor
            </button>

            {canAssignCglBendahara ? (
              <button
                type="button"
                onClick={() => setBendaharaTarget(group.cgl)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                  group.cgl.isBendahara
                    ? "border-warning/40 bg-warning/10 text-warning-foreground hover:border-destructive hover:text-destructive"
                    : "border-border text-muted-foreground hover:border-warning hover:text-warning-foreground",
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
            <button
              type="button"
              onClick={() => setPromoteTarget(member)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
            >
              <ArrowUpCircle className="h-3.5 w-3.5" strokeWidth={2} />
              Jadikan CGL
            </button>
            {canAssignBendahara(viewerRole, viewerCgGroupId, member.role, group.id) ? (
              <button
                type="button"
                onClick={() => setBendaharaTarget(member)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                  member.isBendahara
                    ? "border-warning/40 bg-warning/10 text-warning-foreground hover:border-destructive hover:text-destructive"
                    : "border-border text-muted-foreground hover:border-warning hover:text-warning-foreground",
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
        label="Member & Simpatisan"
        members={[...group.members, ...group.simpatisans]}
        emptyLabel="Belum ada Member atau Simpatisan di CG ini"
      />

      <StructureActionDialog
        open={promoteTarget !== null}
        title="Jadikan CGL"
        description={promoteDescription}
        confirmLabel="Jadikan CGL"
        onClose={() => setPromoteTarget(null)}
        onConfirm={handlePromoteConfirm}
      />

      <StructureActionDialog
        open={demoteOpen}
        title="Turunkan CGL"
        description={demoteDescription}
        confirmLabel="Turunkan"
        tone="destructive"
        onClose={() => setDemoteOpen(false)}
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
