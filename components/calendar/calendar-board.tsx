"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarRange, type CalendarMode } from "@/lib/calendar/use-calendar-range";
import { groupCalendarItemsByDate } from "@/lib/calendar/group";
import { toDateKey, todayCalendarDate, formatMonthLabel, formatWeekRangeLabel } from "@/lib/calendar/date-utils";
import { canCreateAnyEvent } from "@/lib/events/access";
import { WeekGrid } from "@/components/calendar/week-grid";
import { MonthGrid } from "@/components/calendar/month-grid";
import { DayDetailSheet } from "@/components/calendar/day-detail-sheet";
import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import { DeleteEventDialog } from "@/components/calendar/delete-event-dialog";
import type { CalendarDayItems } from "@/lib/calendar/group";
import type { EventRecord } from "@/lib/events/types";
import type { CgGroup } from "@/lib/cg-groups/types";
import type { Member } from "@/lib/members/types";

type FormTarget = { mode: "create"; date: string } | { mode: "edit"; event: EventRecord };

const EMPTY_DAY_ITEMS: CalendarDayItems = { events: [], birthdays: [] };

export function CalendarBoard({
  mode,
  viewerUid,
  viewerRole,
  viewerCgGroupId,
  members,
  cgGroups,
  className,
}: {
  mode: CalendarMode;
  viewerUid: string;
  viewerRole: string | null;
  viewerCgGroupId: string | null;
  members: Member[];
  cgGroups: CgGroup[];
  className?: string;
}) {
  const { anchor, range, events, birthdays, loading, error, goPrev, goNext, goToday, refresh } =
    useCalendarRange(mode, members);
  const [selectedDateKey, setSelectedDateKey] = React.useState<string | null>(null);
  const [formTarget, setFormTarget] = React.useState<FormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EventRecord | null>(null);

  const itemsByDate = React.useMemo(() => groupCalendarItemsByDate(events, birthdays), [events, birthdays]);
  const todayKey = toDateKey(todayCalendarDate());
  const rangeLabel = mode === "week" ? formatWeekRangeLabel(range.start, range.end) : formatMonthLabel(anchor);
  const selectedDayItems = selectedDateKey ? (itemsByDate.get(selectedDateKey) ?? EMPTY_DAY_ITEMS) : EMPTY_DAY_ITEMS;

  function handleAddEvent(dateKey?: string) {
    setFormTarget({ mode: "create", date: dateKey ?? toDateKey(todayCalendarDate()) });
  }

  function handleSaved() {
    setFormTarget(null);
    refresh();
  }

  function handleDeleted() {
    setDeleteTarget(null);
    setSelectedDateKey(null);
    refresh();
  }

  return (
    <div className={cn("flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl sm:p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {mode === "week" ? "Minggu Ini" : "Kalender"}
            </p>
            <p className="font-display text-base font-bold tracking-tight text-foreground">{rangeLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-full border border-border">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Sebelumnya"
              className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="h-9 border-x border-border px-3 text-xs font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Berikutnya"
              className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {canCreateAnyEvent(viewerRole) ? (
            <button
              type="button"
              onClick={() => handleAddEvent()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <CalendarPlus className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Tambah Event</span>
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {mode === "week" ? (
        <WeekGrid
          start={range.start}
          itemsByDate={itemsByDate}
          todayKey={todayKey}
          loading={loading}
          onSelectDay={setSelectedDateKey}
        />
      ) : (
        <MonthGrid
          start={range.start}
          end={range.end}
          currentMonth={anchor.month}
          itemsByDate={itemsByDate}
          todayKey={todayKey}
          loading={loading}
          onSelectDay={setSelectedDateKey}
        />
      )}

      {selectedDateKey ? (
        <DayDetailSheet
          dateKey={selectedDateKey}
          items={selectedDayItems}
          viewerUid={viewerUid}
          viewerRole={viewerRole}
          viewerCgGroupId={viewerCgGroupId}
          onClose={() => setSelectedDateKey(null)}
          onAddEvent={() => handleAddEvent(selectedDateKey)}
          onEditEvent={(event) => setFormTarget({ mode: "edit", event })}
          onDeleteEvent={(event) => setDeleteTarget(event)}
        />
      ) : null}

      {formTarget ? (
        <EventFormDialog
          mode={formTarget.mode}
          event={formTarget.mode === "edit" ? formTarget.event : undefined}
          defaultDate={formTarget.mode === "create" ? formTarget.date : undefined}
          viewerUid={viewerUid}
          viewerRole={viewerRole}
          viewerCgGroupId={viewerCgGroupId}
          members={members}
          cgGroups={cgGroups}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteEventDialog event={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      ) : null}
    </div>
  );
}
