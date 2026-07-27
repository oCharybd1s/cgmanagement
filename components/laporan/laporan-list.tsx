"use client";

import * as React from "react";
import { CalendarDays, NotebookPen, Pencil, Search, SearchX, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { canDeleteMeetingReport, canManageMeetingReport, isCoach } from "@/lib/auth/roles";
import { AddLaporanDialog } from "@/components/laporan/add-laporan-dialog";
import { EditLaporanDialog } from "@/components/laporan/edit-laporan-dialog";
import { DeleteLaporanDialog } from "@/components/laporan/delete-laporan-dialog";
import type { MeetingReport } from "@/lib/meeting-reports/types";
import type { CgGroup } from "@/lib/cg-groups/types";
import type { Member } from "@/lib/members/types";

export function LaporanList({
  initialReports,
  cgGroups,
  members,
  viewerRole,
}: {
  initialReports: MeetingReport[];
  cgGroups: CgGroup[];
  members: Member[];
  viewerRole: string | null;
}) {
  const [reports, setReports] = React.useState(initialReports);
  const [search, setSearch] = React.useState("");
  const [cgFilter, setCgFilter] = React.useState("all");
  const [editingReport, setEditingReport] = React.useState<MeetingReport | null>(null);
  const [deletingReport, setDeletingReport] = React.useState<MeetingReport | null>(null);

  const showCgFilter = isCoach(viewerRole) && cgGroups.length > 0;
  const canEdit = canManageMeetingReport(viewerRole);
  const canDelete = canDeleteMeetingReport(viewerRole);
  const hasReports = reports.length > 0;

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

  const filteredReports = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesQuery =
        query === "" ||
        report.agenda.toLowerCase().includes(query) ||
        report.result.toLowerCase().includes(query);
      const matchesCg = cgFilter === "all" || report.cgId === cgFilter;
      return matchesQuery && matchesCg;
    });
  }, [reports, search, cgFilter]);

  function handleCreated(report: MeetingReport) {
    setReports((current) => [report, ...current]);
  }

  function handleUpdated(report: MeetingReport) {
    setReports((current) => current.map((item) => (item.id === report.id ? report : item)));
    setEditingReport(null);
  }

  function handleDeleted(reportId: string) {
    setReports((current) => current.filter((item) => item.id !== reportId));
    setDeletingReport(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {hasReports ? (
          <div className="relative w-full sm:max-w-xs">
            <label htmlFor="laporan-search" className="sr-only">
              Cari agenda atau hasil pertemuan
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
            />
            <input
              id="laporan-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari agenda atau hasil pertemuan"
              className="w-full rounded-full border-[1.5px] border-input bg-input/40 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
          </div>
        ) : (
          <p className="font-display text-lg font-bold tracking-tight text-foreground">Laporan CG</p>
        )}

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {hasReports && showCgFilter ? (
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

          <AddLaporanDialog cgGroups={cgGroups} viewerRole={viewerRole} onCreated={handleCreated} />
        </div>
      </div>

      {hasReports ? (
        <React.Fragment>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {filteredReports.length} dari {reports.length} laporan
          </p>

          {filteredReports.length === 0 ? (
            <EmptySearchState />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredReports.map((report) => (
                <LaporanCard
                  key={report.id}
                  report={report}
                  cgLabel={report.cgId ? (cgLabelById.get(report.cgId) ?? null) : null}
                  submittedByName={report.submittedBy ? (memberNameById.get(report.submittedBy) ?? null) : null}
                  showCg={showCgFilter}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => setEditingReport(report)}
                  onDelete={() => setDeletingReport(report)}
                />
              ))}
            </div>
          )}
        </React.Fragment>
      ) : (
        <EmptyLaporanState />
      )}

      {editingReport ? (
        <EditLaporanDialog
          report={editingReport}
          cgGroups={cgGroups}
          onClose={() => setEditingReport(null)}
          onUpdated={handleUpdated}
        />
      ) : null}

      {deletingReport ? (
        <DeleteLaporanDialog
          report={deletingReport}
          onClose={() => setDeletingReport(null)}
          onDeleted={() => handleDeleted(deletingReport.id)}
        />
      ) : null}
    </div>
  );
}

function LaporanCard({
  report,
  cgLabel,
  submittedByName,
  showCg,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  report: MeetingReport;
  cgLabel: string | null;
  submittedByName: string | null;
  showCg: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarDays className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          {formatMeetingDate(report.meetingDate)}
        </div>
        <div className="flex items-center gap-2">
          {showCg ? <Badge>{cgLabel ?? "-"}</Badge> : null}
          {canEdit || canDelete ? (
            <div className="flex items-center gap-1">
              {canEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label="Ubah laporan"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Hapus laporan"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agenda</p>
          <p className="whitespace-pre-line text-sm text-foreground">{report.agenda}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hasil Pertemuan</p>
          <p className="whitespace-pre-line text-sm text-foreground">{report.result}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5" strokeWidth={2} />
        Disubmit oleh {submittedByName ?? "-"}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

function formatMeetingDate(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function EmptyLaporanState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <NotebookPen className="h-5 w-5" strokeWidth={2} />
      </span>
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">Belum ada Laporan CG</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Catat pertemuan CG pertama dengan tombol &quot;Tambah Laporan&quot; di atas.
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
      <p className="text-sm font-medium text-foreground">Tidak ada laporan yang cocok</p>
      <p className="text-xs text-muted-foreground">Coba kata kunci atau filter lain.</p>
    </div>
  );
}
