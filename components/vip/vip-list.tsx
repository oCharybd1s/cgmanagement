"use client";

import * as React from "react";
import { Loader2, Pencil, Search, SearchX, Trash2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { canDeleteVipProspect, canManageVipProspect, isCoach } from "@/lib/auth/roles";
import { VIP_STATUS_LABELS, VIP_STATUS_OPTIONS } from "@/lib/vip-prospects/shared";
import { rankBySearch } from "@/lib/search/fuzzy-match";
import { AddVipProspectDialog } from "@/components/vip/add-vip-prospect-dialog";
import { EditVipProspectDialog } from "@/components/vip/edit-vip-prospect-dialog";
import { DeleteVipProspectDialog } from "@/components/vip/delete-vip-prospect-dialog";
import type { VipProspect, VipProspectStatus } from "@/lib/vip-prospects/types";
import type { CgGroup } from "@/lib/cg-groups/types";
import type { Member } from "@/lib/members/types";

const STATUS_LABELS = VIP_STATUS_LABELS;

const STATUS_TONES: Record<VipProspectStatus, "warning" | "secondary" | "success" | "destructive"> = {
  pending: "warning",
  berpotensi: "secondary",
  accept: "success",
  reject: "destructive",
};

export function VipList({
  initialProspects,
  cgGroups,
  members,
  viewerRole,
  viewerCgGroupId,
}: {
  initialProspects: VipProspect[];
  cgGroups: CgGroup[];
  members: Member[];
  viewerRole: string | null;
  viewerCgGroupId: string | null;
}) {
  const [prospects, setProspects] = React.useState(initialProspects);
  const [search, setSearch] = React.useState("");
  const [cgFilter, setCgFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [editingProspect, setEditingProspect] = React.useState<VipProspect | null>(null);
  const [deletingProspect, setDeletingProspect] = React.useState<VipProspect | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState<string | null>(null);

  const showCgColumn = isCoach(viewerRole) && cgGroups.length > 0;
  const hasProspects = prospects.length > 0;

  const cgLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const group of cgGroups) {
      map.set(group.id, group.groupCode);
    }
    return map;
  }, [cgGroups]);

  const memberNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members) {
      map.set(member.id, member.fullName || "Tanpa nama");
    }
    return map;
  }, [members]);

  const filteredProspects = React.useMemo(() => {
    const matchingFilters = prospects.filter((prospect) => {
      const matchesCg = cgFilter === "all" || prospect.cgId === cgFilter;
      const matchesStatus = statusFilter === "all" || prospect.status === statusFilter;
      return matchesCg && matchesStatus;
    });
    return rankBySearch(search, matchingFilters, (prospect) => [prospect.name]);
  }, [prospects, search, cgFilter, statusFilter]);

  function handleCreated(prospect: VipProspect) {
    setProspects((current) => [prospect, ...current]);
  }

  function handleUpdated(prospect: VipProspect) {
    setProspects((current) => current.map((item) => (item.id === prospect.id ? prospect : item)));
    setEditingProspect(null);
  }

  function handleDeleted(prospectId: string) {
    setProspects((current) => current.filter((item) => item.id !== prospectId));
    setDeletingProspect(null);
  }

  async function handleStatusChange(prospect: VipProspect, status: VipProspectStatus) {
    if (status === prospect.status) {
      return;
    }
    setStatusUpdatingId(prospect.id);
    try {
      const response = await fetch(`/api/vip-prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prospect.name,
          phone: prospect.phone ?? "",
          cgId: prospect.cgId ?? "",
          followUpByUserId: prospect.followUpByUserId ?? "",
          status,
          notes: prospect.notes ?? "",
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setProspects((current) => current.map((item) => (item.id === prospect.id ? data.prospect : item)));
      }
    } catch {
      // Diamkan, status akan tetap seperti semula karena data tidak diperbarui
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {hasProspects ? (
          <div className="relative w-full sm:max-w-xs">
            <label htmlFor="vip-search" className="sr-only">
              Cari nama calon anggota
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
            />
            <input
              id="vip-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama calon anggota"
              className="w-full rounded-full border-[1.5px] border-input bg-input/40 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
          </div>
        ) : (
          <p className="font-display text-lg font-bold tracking-tight text-foreground">List VIP</p>
        )}

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {hasProspects ? (
            <React.Fragment>
              {showCgColumn ? (
                <select
                  aria-label="Filter CG"
                  value={cgFilter}
                  onChange={(event) => setCgFilter(event.target.value)}
                  className="w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 sm:w-auto"
                >
                  <option value="all">Semua CG</option>
                  {cgGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.groupCode}
                    </option>
                  ))}
                </select>
              ) : null}

              <select
                aria-label="Filter status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 sm:w-auto"
              >
                <option value="all">Semua Status</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </React.Fragment>
          ) : null}

          <AddVipProspectDialog
            cgGroups={cgGroups}
            members={members}
            viewerRole={viewerRole}
            viewerCgGroupId={viewerCgGroupId}
            onCreated={handleCreated}
          />
        </div>
      </div>

      {hasProspects ? (
        <React.Fragment>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {filteredProspects.length} dari {prospects.length} calon anggota
          </p>

          {filteredProspects.length === 0 ? (
            <EmptySearchState />
          ) : (
            <React.Fragment>
              <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card/70 shadow-sm backdrop-blur-xl md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th scope="col" className="px-5 py-3.5 font-medium">
                        Nama
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-medium">
                        No WA
                      </th>
                      {showCgColumn ? (
                        <th scope="col" className="px-5 py-3.5 font-medium">
                          CG
                        </th>
                      ) : null}
                      <th scope="col" className="px-5 py-3.5 font-medium">
                        Follow-up Oleh
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-medium">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-medium">
                        Keterangan
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-medium">
                        <span className="sr-only">Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProspects.map((prospect) => (
                      <VipRow
                        key={prospect.id}
                        prospect={prospect}
                        cgLabel={prospect.cgId ? (cgLabelById.get(prospect.cgId) ?? null) : null}
                        followUpName={
                          prospect.followUpByUserId ? (memberNameById.get(prospect.followUpByUserId) ?? null) : null
                        }
                        showCgColumn={showCgColumn}
                        canEdit={canManageVipProspect(viewerRole, viewerCgGroupId, prospect.cgId)}
                        canDelete={canDeleteVipProspect(viewerRole, viewerCgGroupId, prospect.cgId)}
                        isUpdatingStatus={statusUpdatingId === prospect.id}
                        onStatusChange={(status) => handleStatusChange(prospect, status)}
                        onEdit={() => setEditingProspect(prospect)}
                        onDelete={() => setDeletingProspect(prospect)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 md:hidden">
                {filteredProspects.map((prospect) => (
                  <VipCard
                    key={prospect.id}
                    prospect={prospect}
                    cgLabel={prospect.cgId ? (cgLabelById.get(prospect.cgId) ?? null) : null}
                    followUpName={
                      prospect.followUpByUserId ? (memberNameById.get(prospect.followUpByUserId) ?? null) : null
                    }
                    showCg={showCgColumn}
                    canEdit={canManageVipProspect(viewerRole, viewerCgGroupId, prospect.cgId)}
                    canDelete={canDeleteVipProspect(viewerRole, viewerCgGroupId, prospect.cgId)}
                    isUpdatingStatus={statusUpdatingId === prospect.id}
                    onStatusChange={(status) => handleStatusChange(prospect, status)}
                    onEdit={() => setEditingProspect(prospect)}
                    onDelete={() => setDeletingProspect(prospect)}
                  />
                ))}
              </div>
            </React.Fragment>
          )}
        </React.Fragment>
      ) : (
        <EmptyVipState />
      )}

      {editingProspect ? (
        <EditVipProspectDialog
          prospect={editingProspect}
          cgGroups={cgGroups}
          members={members}
          cgLabel={editingProspect.cgId ? (cgLabelById.get(editingProspect.cgId) ?? null) : null}
          viewerRole={viewerRole}
          onClose={() => setEditingProspect(null)}
          onUpdated={handleUpdated}
        />
      ) : null}

      {deletingProspect ? (
        <DeleteVipProspectDialog
          prospect={deletingProspect}
          onClose={() => setDeletingProspect(null)}
          onDeleted={() => handleDeleted(deletingProspect.id)}
        />
      ) : null}
    </div>
  );
}

function VipRow({
  prospect,
  cgLabel,
  followUpName,
  showCgColumn,
  canEdit,
  canDelete,
  isUpdatingStatus,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  prospect: VipProspect;
  cgLabel: string | null;
  followUpName: string | null;
  showCgColumn: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isUpdatingStatus: boolean;
  onStatusChange: (status: VipProspectStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="transition-colors duration-200 hover:bg-muted/40">
      <td className="px-5 py-3.5 font-medium text-foreground">{prospect.name || "Tanpa nama"}</td>
      <td className="px-5 py-3.5 font-mono text-xs text-foreground">{prospect.phone ?? "-"}</td>
      {showCgColumn ? (
        <td className="px-5 py-3.5">
          <Badge tone="secondary">{cgLabel ?? "-"}</Badge>
        </td>
      ) : null}
      <td className="px-5 py-3.5 text-foreground">{followUpName ?? "-"}</td>
      <td className="px-5 py-3.5">
        <StatusControl
          status={prospect.status}
          canEdit={canEdit}
          isUpdating={isUpdatingStatus}
          onChange={onStatusChange}
        />
      </td>
      <td className="max-w-xs px-5 py-3.5 text-muted-foreground">
        <p className="truncate">{prospect.notes ?? "-"}</p>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-2">
          {canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Ubah data VIP"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Hapus data VIP"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function StatusControl({
  status,
  canEdit,
  isUpdating,
  onChange,
}: {
  status: VipProspectStatus;
  canEdit: boolean;
  isUpdating: boolean;
  onChange: (status: VipProspectStatus) => void;
}) {
  if (!canEdit) {
    return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label="Ubah status VIP"
        value={status}
        disabled={isUpdating}
        onChange={(event) => onChange(event.target.value as VipProspectStatus)}
        className={cn(
          "appearance-none rounded-full border-[1.5px] border-transparent py-1 pl-2.5 pr-7 text-xs font-medium outline-none transition-colors duration-200 hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60",
          STATUS_TONES[status] === "warning" && "bg-warning text-warning-foreground",
          STATUS_TONES[status] === "secondary" && "bg-secondary text-secondary-foreground",
          STATUS_TONES[status] === "success" && "bg-success text-success-foreground",
          STATUS_TONES[status] === "destructive" && "bg-destructive/15 text-destructive",
        )}
      >
        {VIP_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isUpdating ? (
        <Loader2 className="pointer-events-none absolute right-2 h-3 w-3 animate-spin" strokeWidth={2.5} />
      ) : null}
    </div>
  );
}

function VipCard({
  prospect,
  cgLabel,
  followUpName,
  showCg,
  canEdit,
  canDelete,
  isUpdatingStatus,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  prospect: VipProspect;
  cgLabel: string | null;
  followUpName: string | null;
  showCg: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isUpdatingStatus: boolean;
  onStatusChange: (status: VipProspectStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-foreground">{prospect.name || "Tanpa nama"}</p>
        <StatusControl
          status={prospect.status}
          canEdit={canEdit}
          isUpdating={isUpdatingStatus}
          onChange={onStatusChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {showCg ? <Badge tone="secondary">{cgLabel ?? "-"}</Badge> : null}
        <span className="font-mono">{prospect.phone ?? "-"}</span>
      </div>

      <div className="grid gap-1.5 border-t border-border pt-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Follow-up Oleh</span>
          <span className="text-foreground">{followUpName ?? "-"}</span>
        </div>
        {prospect.notes ? <p className="text-sm text-muted-foreground">{prospect.notes}</p> : null}
      </div>

      {canEdit || canDelete ? (
        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          {canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Ubah
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors duration-200 hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Hapus
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "secondary" | "muted" | "warning" | "success" | "destructive";
  children: React.ReactNode;
}) {
  const toneClasses: Record<typeof tone, string> = {
    secondary: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
    warning: "bg-warning text-warning-foreground",
    success: "bg-success text-success-foreground",
    destructive: "bg-destructive/15 text-destructive",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneClasses[tone])}>
      {children}
    </span>
  );
}

function EmptyVipState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UserPlus className="h-5 w-5" strokeWidth={2} />
      </span>
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">Belum ada data VIP</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tambahkan calon anggota pertama dengan tombol &quot;Tambah VIP&quot; di atas.
      </p>
    </div>
  );
}

function EmptySearchState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-4 w-4" strokeWidth={2} />
      </span>
      <p className="text-sm font-medium text-foreground">Tidak ada data yang cocok</p>
      <p className="text-xs text-muted-foreground">Coba kata kunci atau filter lain.</p>
    </div>
  );
}
