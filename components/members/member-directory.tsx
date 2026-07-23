"use client";

import * as React from "react";
import { Eye, Search, SearchX, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { cgGroupDisplayLabel, getRoleLabel } from "@/lib/auth/roles";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
import { MemberDetailDialog } from "@/components/members/member-detail-dialog";
import type { Member, SpiritualStatus } from "@/lib/members/types";
import type { CgGroup } from "@/lib/cg-groups/types";

const SPIRITUAL_STATUS_TOTAL = 8;

export function MemberDirectory({
  members,
  cgGroups,
  fields,
  canCreateMember,
  viewerRole,
  viewerCgGroupId,
  viewerUserId,
}: {
  members: Member[];
  cgGroups: CgGroup[];
  fields: "full" | "basic";
  canCreateMember: boolean;
  viewerRole: string | null;
  viewerCgGroupId: string | null;
  viewerUserId: string | null;
}) {
  const [search, setSearch] = React.useState("");
  const [cgFilter, setCgFilter] = React.useState("all");
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);

  const showCgColumn = fields === "full" && cgGroups.length > 0;
  const hasMembers = members.length > 0;
  const showDetail = fields === "full";

  const cgLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const group of cgGroups) {
      map.set(group.id, group.groupCode);
    }
    return map;
  }, [cgGroups]);

  const filteredMembers = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery = query === "" || member.fullName.toLowerCase().includes(query);
      const matchesCg = cgFilter === "all" || member.cgGroupId === cgFilter;
      return matchesQuery && matchesCg;
    });
  }, [members, search, cgFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {hasMembers ? (
          <div className="relative w-full sm:max-w-xs">
            <label htmlFor="member-search" className="sr-only">
              Cari nama anggota
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
            />
            <input
              id="member-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama anggota"
              className="w-full rounded-full border-[1.5px] border-input bg-input/40 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
          </div>
        ) : (
          <p className="font-display text-lg font-bold tracking-tight text-foreground">Data Anggota</p>
        )}

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {hasMembers && showCgColumn ? (
            <div className="w-full sm:w-auto">
              <label htmlFor="member-cg-filter" className="sr-only">
                Filter CG
              </label>
              <select
                id="member-cg-filter"
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
            </div>
          ) : null}

          {canCreateMember ? (
            <AddMemberDialog cgGroups={cgGroups} viewerRole={viewerRole} viewerCgGroupId={viewerCgGroupId} />
          ) : null}
        </div>
      </div>

      {hasMembers ? (
        <React.Fragment>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {filteredMembers.length} dari {members.length} anggota
          </p>

          {filteredMembers.length === 0 ? (
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
                      {fields === "full" ? (
                        <React.Fragment>
                          {showCgColumn ? (
                            <th scope="col" className="px-5 py-3.5 font-medium">
                              CG
                            </th>
                          ) : null}
                          <th scope="col" className="px-5 py-3.5 font-medium">
                            Role
                          </th>
                          <th scope="col" className="px-5 py-3.5 font-medium">
                            NIJ
                          </th>
                          <th scope="col" className="px-5 py-3.5 font-medium">
                            Kontak
                          </th>
                          <th scope="col" className="px-5 py-3.5 font-medium">
                            Status Rohani
                          </th>
                          <th scope="col" className="px-5 py-3.5 font-medium">
                            <span className="sr-only">Detail</span>
                          </th>
                        </React.Fragment>
                      ) : (
                        <th scope="col" className="px-5 py-3.5 font-medium">
                          No HP
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredMembers.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        cgLabel={member.cgGroupId ? (cgLabelById.get(member.cgGroupId) ?? null) : null}
                        showCgColumn={showCgColumn}
                        fields={fields}
                        onSelect={showDetail ? setSelectedMember : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 md:hidden">
                {filteredMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    cgLabel={member.cgGroupId ? (cgLabelById.get(member.cgGroupId) ?? null) : null}
                    showCg={showCgColumn}
                    fields={fields}
                    onSelect={showDetail ? setSelectedMember : undefined}
                  />
                ))}
              </div>
            </React.Fragment>
          )}
        </React.Fragment>
      ) : (
        <EmptyDirectoryState canCreate={canCreateMember} />
      )}

      <MemberDetailDialog
        member={selectedMember}
        cgLabel={selectedMember?.cgGroupId ? (cgLabelById.get(selectedMember.cgGroupId) ?? null) : null}
        viewerRole={viewerRole}
        viewerCgGroupId={viewerCgGroupId}
        viewerUserId={viewerUserId}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}

function MemberRow({
  member,
  cgLabel,
  showCgColumn,
  fields,
  onSelect,
}: {
  member: Member;
  cgLabel: string | null;
  showCgColumn: boolean;
  fields: "full" | "basic";
  onSelect?: (member: Member) => void;
}) {
  if (fields === "basic") {
    return (
      <tr className="transition-colors duration-200 hover:bg-muted/40">
        <td className="px-5 py-3.5 font-medium text-foreground">{member.fullName || "Tanpa nama"}</td>
        <td className="px-5 py-3.5 font-mono text-xs text-foreground">{member.phone ?? "-"}</td>
      </tr>
    );
  }

  return (
    <tr className="transition-colors duration-200 hover:bg-muted/40">
      <td className="px-5 py-3.5">
        <p className="font-medium text-foreground">{member.fullName || "Tanpa nama"}</p>
        {member.pelayanan ? <p className="text-xs text-muted-foreground">{member.pelayanan}</p> : null}
      </td>
      {showCgColumn ? (
        <td className="px-5 py-3.5">
          <Badge tone="secondary">{cgGroupDisplayLabel(member.role, cgLabel)}</Badge>
        </td>
      ) : null}
      <td className="px-5 py-3.5">
        <Badge tone="muted">{getRoleLabel(member.role)}</Badge>
      </td>
      <td className="px-5 py-3.5">
        <NijValue value={member.nij} />
      </td>
      <td className="px-5 py-3.5">
        <p className="truncate text-foreground">{member.email ?? "-"}</p>
        <p className="font-mono text-xs text-muted-foreground">{member.phone ?? "-"}</p>
      </td>
      <td className="px-5 py-3.5">
        <SpiritualStatusBadge status={member.spiritualStatus} />
      </td>
      <td className="px-5 py-3.5 text-right">
        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(member)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={2} />
            Detail
          </button>
        ) : null}
      </td>
    </tr>
  );
}

function MemberCard({
  member,
  cgLabel,
  showCg,
  fields,
  onSelect,
}: {
  member: Member;
  cgLabel: string | null;
  showCg: boolean;
  fields: "full" | "basic";
  onSelect?: (member: Member) => void;
}) {
  if (fields === "basic") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl">
        <p className="truncate font-medium text-foreground">{member.fullName || "Tanpa nama"}</p>
        <p className="font-mono text-sm text-foreground">{member.phone ?? "-"}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(member)}
      className="w-full rounded-2xl border border-border bg-card/70 p-4 text-left shadow-sm backdrop-blur-xl transition-colors duration-200 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{member.fullName || "Tanpa nama"}</p>
          {member.pelayanan ? <p className="text-xs text-muted-foreground">{member.pelayanan}</p> : null}
        </div>
        <SpiritualStatusBadge status={member.spiritualStatus} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="muted">{getRoleLabel(member.role)}</Badge>
        {showCg ? <Badge tone="secondary">{cgGroupDisplayLabel(member.role, cgLabel)}</Badge> : null}
      </div>

      <div className="mt-3 grid gap-1.5 border-t border-border pt-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Email</span>
          <span className="truncate text-foreground">{member.email ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">No HP</span>
          <span className="font-mono text-foreground">{member.phone ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">NIJ</span>
          <NijValue value={member.nij} />
        </div>
      </div>
    </button>
  );
}

function NijValue({ value }: { value: string | null }) {
  if (!value) {
    return <Badge tone="warning">Belum diisi</Badge>;
  }
  return <span className="font-mono font-tabular text-xs text-foreground">{value}</span>;
}

function SpiritualStatusBadge({ status }: { status: SpiritualStatus }) {
  const completed = Object.values(status).filter(Boolean).length;
  const isComplete = completed === SPIRITUAL_STATUS_TOTAL;

  return (
    <Badge tone={isComplete ? "spark" : "muted"}>
      <span className="font-tabular">
        {completed}/{SPIRITUAL_STATUS_TOTAL}
      </span>
    </Badge>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "secondary" | "muted" | "warning" | "spark";
  children: React.ReactNode;
}) {
  const toneClasses: Record<typeof tone, string> = {
    secondary: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
    warning: "bg-warning text-warning-foreground",
    spark: "bg-brand-spark text-brand-spark-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

function EmptyDirectoryState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Users className="h-5 w-5" strokeWidth={2} />
      </span>
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
        Belum ada data anggota
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {canCreate
          ? "Tambahkan anggota pertama dengan tombol \"Tambah Anggota\" di atas, atau tunggu proses migrasi data dari Google Sheets."
          : "Data anggota akan muncul di sini setelah data dari Google Sheets berhasil dimigrasi."}
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
      <p className="text-sm font-medium text-foreground">Tidak ada anggota yang cocok</p>
      <p className="text-xs text-muted-foreground">Coba kata kunci lain atau ganti filter CG.</p>
    </div>
  );
}
