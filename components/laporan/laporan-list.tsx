"use client";

import * as React from "react";
import { ArrowLeft, CalendarDays, ChevronRight, NotebookPen, Pencil, Search, SearchX, Trash2, User, Users2 } from "lucide-react";
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
  const [selectedCgId, setSelectedCgId] = React.useState<string | null>(null);
  const [editingReport, setEditingReport] = React.useState<MeetingReport | null>(null);
  const [deletingReport, setDeletingReport] = React.useState<MeetingReport | null>(null);

  const requiresCgPicker = isCoach(viewerRole);
  const canEdit = canManageMeetingReport(viewerRole);
  const canDelete = canDeleteMeetingReport(viewerRole);

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

  const reportCountByCg = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const report of reports) {
      if (!report.cgId) {
        continue;
      }
      map.set(report.cgId, (map.get(report.cgId) ?? 0) + 1);
    }
    return map;
  }, [reports]);

  const scopedReports = React.useMemo(() => {
    if (!requiresCgPicker) {
      return reports;
    }
    return reports.filter((report) => report.cgId === selectedCgId);
  }, [reports, requiresCgPicker, selectedCgId]);

  const filteredReports = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === "") {
      return scopedReports;
    }
    return scopedReports.filter(
      (report) => report.agenda.toLowerCase().includes(query) || report.result.toLowerCase().includes(query),
    );
  }, [scopedReports, search]);

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

  if (requiresCgPicker && selectedCgId === null) {
    return (
      <CgPicker
        cgGroups={cgGroups}
        reportCountByCg={reportCountByCg}
        onSelect={(cgId) => {
          setSearch("");
          setSelectedCgId(cgId);
        }}
      />
    );
  }

  const selectedCgLabel = selectedCgId ? (cgLabelById.get(selectedCgId) ?? "-") : null;
  const hasReports = scopedReports.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {requiresCgPicker ? (
        <button
          type="button"
          onClick={() => setSelectedCgId(null)}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Ganti CG
        </button>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <p className="font-display text-lg font-bold tracking-tight text-foreground">
            {requiresCgPicker ? `Laporan CG ${selectedCgLabel}` : "Laporan CG"}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {hasReports ? (
            <div className="relative w-full sm:w-64">
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
          ) : null}

          <AddLaporanDialog
            cgGroups={cgGroups}
            viewerRole={viewerRole}
            defaultCgId={selectedCgId ?? undefined}
            onCreated={handleCreated}
          />
        </div>
      </div>

      {hasReports ? (
        <React.Fragment>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {filteredReports.length} dari {scopedReports.length} laporan
          </p>

          {filteredReports.length === 0 ? (
            <EmptySearchState />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredReports.map((report) => (
                <LaporanCard
                  key={report.id}
                  report={report}
                  submittedByName={report.submittedBy ? (memberNameById.get(report.submittedBy) ?? null) : null}
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

function CgPicker({
  cgGroups,
  reportCountByCg,
  onSelect,
}: {
  cgGroups: CgGroup[];
  reportCountByCg: Map<string, number>;
  onSelect: (cgId: string) => void;
}) {
  if (cgGroups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Users2 className="h-5 w-5" strokeWidth={2} />
        </span>
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">Belum ada CG</h2>
        <p className="max-w-sm text-sm text-muted-foreground">Buat CG terlebih dahulu untuk mulai mencatat Laporan CG.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-lg font-bold tracking-tight text-foreground">Pilih CG</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cgGroups.map((group) => {
          const count = reportCountByCg.get(group.id) ?? 0;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(group.id)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 px-5 py-4 text-left shadow-sm backdrop-blur-xl transition-colors duration-200 hover:border-primary"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Users2 className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-display text-base font-bold tracking-tight text-foreground">{group.groupCode}</p>
                  <p className="text-xs text-muted-foreground">{count} laporan</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LaporanCard({
  report,
  submittedByName,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  report: MeetingReport;
  submittedByName: string | null;
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
