"use client";

import * as React from "react";
import { Search, SearchX, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/auth/roles";
import { rankBySearch } from "@/lib/search/fuzzy-match";
import type { FormerMember, FormerMemberReason } from "@/lib/former-members/types";
import type { CgGroup } from "@/lib/cg-groups/types";

const REASON_LABELS: Record<FormerMemberReason, string> = {
  graduated: "Lulus",
  moved: "Pindah Kota",
  unresponsive: "Tidak Merespon",
  other: "Lainnya",
};

const REASON_TONES: Record<FormerMemberReason, "success" | "secondary" | "warning" | "muted"> = {
  graduated: "success",
  moved: "secondary",
  unresponsive: "warning",
  other: "muted",
};

export function FormerMemberList({
  formerMembers,
  cgGroups,
  showCgColumn,
}: {
  formerMembers: FormerMember[];
  cgGroups: CgGroup[];
  showCgColumn: boolean;
}) {
  const [search, setSearch] = React.useState("");
  const [cgFilter, setCgFilter] = React.useState("all");
  const [reasonFilter, setReasonFilter] = React.useState("all");

  const hasFormerMembers = formerMembers.length > 0;

  const cgLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const group of cgGroups) {
      map.set(group.id, group.groupCode);
    }
    return map;
  }, [cgGroups]);

  const filteredFormerMembers = React.useMemo(() => {
    const matchingFilters = formerMembers.filter((formerMember) => {
      const matchesCg = cgFilter === "all" || formerMember.cgGroupId === cgFilter;
      const matchesReason = reasonFilter === "all" || formerMember.reason === reasonFilter;
      return matchesCg && matchesReason;
    });
    return rankBySearch(search, matchingFilters, (formerMember) => [formerMember.fullName]);
  }, [formerMembers, search, cgFilter, reasonFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {hasFormerMembers ? (
          <div className="relative w-full sm:max-w-xs">
            <label htmlFor="former-member-search" className="sr-only">
              Cari nama past member
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
            />
            <input
              id="former-member-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama past member"
              className="w-full rounded-full border-[1.5px] border-input bg-input/40 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
          </div>
        ) : (
          <p className="font-display text-lg font-bold tracking-tight text-foreground">Past Member</p>
        )}

        {hasFormerMembers ? (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {showCgColumn ? (
              <div className="w-full sm:w-auto">
                <label htmlFor="former-member-cg-filter" className="sr-only">
                  Filter CG
                </label>
                <select
                  id="former-member-cg-filter"
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

            <div className="w-full sm:w-auto">
              <label htmlFor="former-member-reason-filter" className="sr-only">
                Filter alasan
              </label>
              <select
                id="former-member-reason-filter"
                value={reasonFilter}
                onChange={(event) => setReasonFilter(event.target.value)}
                className="w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 sm:w-auto"
              >
                <option value="all">Semua Alasan</option>
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </div>

      {hasFormerMembers ? (
        filteredFormerMembers.length === 0 ? (
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
                      No HP
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Role Terakhir
                    </th>
                    {showCgColumn ? (
                      <th scope="col" className="px-5 py-3.5 font-medium">
                        CG
                      </th>
                    ) : null}
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Alasan
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Tanggal Keluar
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Catatan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFormerMembers.map((formerMember) => (
                    <FormerMemberRow
                      key={formerMember.id}
                      formerMember={formerMember}
                      cgLabel={formerMember.cgGroupId ? (cgLabelById.get(formerMember.cgGroupId) ?? null) : null}
                      showCgColumn={showCgColumn}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {filteredFormerMembers.map((formerMember) => (
                <FormerMemberCard
                  key={formerMember.id}
                  formerMember={formerMember}
                  cgLabel={formerMember.cgGroupId ? (cgLabelById.get(formerMember.cgGroupId) ?? null) : null}
                  showCg={showCgColumn}
                />
              ))}
            </div>
          </React.Fragment>
        )
      ) : (
        <EmptyFormerMemberState />
      )}
    </div>
  );
}

function FormerMemberRow({
  formerMember,
  cgLabel,
  showCgColumn,
}: {
  formerMember: FormerMember;
  cgLabel: string | null;
  showCgColumn: boolean;
}) {
  return (
    <tr className="transition-colors duration-200 hover:bg-muted/40">
      <td className="px-5 py-3.5 font-medium text-foreground">{formerMember.fullName || "Tanpa nama"}</td>
      <td className="px-5 py-3.5 font-mono text-xs text-foreground">{formerMember.phone ?? "-"}</td>
      <td className="px-5 py-3.5">
        <Badge tone="muted">{getRoleLabel(formerMember.lastRole)}</Badge>
      </td>
      {showCgColumn ? (
        <td className="px-5 py-3.5">
          <Badge tone="secondary">{cgLabel ?? "-"}</Badge>
        </td>
      ) : null}
      <td className="px-5 py-3.5">
        <Badge tone={REASON_TONES[formerMember.reason]}>{REASON_LABELS[formerMember.reason]}</Badge>
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-foreground">{formatLeftDate(formerMember.leftDate)}</td>
      <td className="max-w-xs px-5 py-3.5 text-muted-foreground">
        <p className="truncate">{formerMember.notes ?? "-"}</p>
      </td>
    </tr>
  );
}

function FormerMemberCard({
  formerMember,
  cgLabel,
  showCg,
}: {
  formerMember: FormerMember;
  cgLabel: string | null;
  showCg: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-foreground">{formerMember.fullName || "Tanpa nama"}</p>
        <Badge tone={REASON_TONES[formerMember.reason]}>{REASON_LABELS[formerMember.reason]}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge tone="muted">{getRoleLabel(formerMember.lastRole)}</Badge>
        {showCg ? <Badge tone="secondary">{cgLabel ?? "-"}</Badge> : null}
        <span className="font-mono">{formatLeftDate(formerMember.leftDate)}</span>
      </div>
      <p className="font-mono text-sm text-foreground">{formerMember.phone ?? "-"}</p>
      {formerMember.notes ? <p className="text-sm text-muted-foreground">{formerMember.notes}</p> : null}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "secondary" | "muted" | "warning" | "success";
  children: React.ReactNode;
}) {
  const toneClasses: Record<typeof tone, string> = {
    secondary: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
    warning: "bg-warning text-warning-foreground",
    success: "bg-success text-success-foreground",
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

function EmptyFormerMemberState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserMinus className="h-5 w-5" strokeWidth={2} />
      </span>
      <h3 className="font-display text-base font-bold tracking-tight text-foreground">Belum ada data</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Past member yang sudah lulus, tidak aktif, atau pindah kota akan muncul di sini.
      </p>
    </div>
  );
}

function EmptySearchState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-5 w-5" strokeWidth={2} />
      </span>
      <h3 className="font-display text-base font-bold tracking-tight text-foreground">Tidak ditemukan</h3>
      <p className="max-w-sm text-sm text-muted-foreground">Coba kata kunci atau filter lain.</p>
    </div>
  );
}

function formatLeftDate(value: string | null): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
