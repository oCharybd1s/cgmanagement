"use client";

import { cn } from "@/lib/utils";
import { addDays, getWeekdayLabel, toDateKey, type CalendarDate } from "@/lib/calendar/date-utils";
import { EventTypeDot } from "@/components/calendar/event-type-badge";
import type { CalendarDayItems } from "@/lib/calendar/group";

const MAX_VISIBLE_ITEMS = 3;

export function WeekGrid({
  start,
  itemsByDate,
  todayKey,
  loading,
  onSelectDay,
}: {
  start: CalendarDate;
  itemsByDate: Map<string, CalendarDayItems>;
  todayKey: string;
  loading: boolean;
  onSelectDay: (dateKey: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {days.map((day) => {
        const dateKey = toDateKey(day);
        const items = itemsByDate.get(dateKey);
        const isToday = dateKey === todayKey;
        const birthdayCount = items?.birthdays.length ?? 0;
        const eventCount = items?.events.length ?? 0;
        const totalCount = birthdayCount + eventCount;
        const visibleEvents = (items?.events ?? [])
          .slice()
          .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"))
          .slice(0, MAX_VISIBLE_ITEMS - birthdayCount > 0 ? MAX_VISIBLE_ITEMS - birthdayCount : 0);
        const hiddenCount = totalCount - birthdayCount - visibleEvents.length;

        return (
          <button
            key={dateKey}
            type="button"
            onClick={() => onSelectDay(dateKey)}
            className={cn(
              "flex min-h-[104px] flex-col gap-1.5 rounded-2xl border border-border bg-input/20 p-3 text-left transition-colors duration-200 hover:border-primary hover:bg-input/40",
              isToday && "border-primary bg-primary/10",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {getWeekdayLabel(day, true)}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-foreground",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.day}
              </span>
            </div>

            {loading ? (
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
            ) : (
              <div className="flex flex-col gap-1">
                {items?.birthdays.map((birthday) => (
                  <p key={birthday.memberId} className="truncate text-xs font-medium text-brand-spark-foreground">
                    🎂 {birthday.fullName}
                  </p>
                ))}
                {visibleEvents.map((event) => (
                  <p key={event.id} className="flex items-center gap-1.5 truncate text-xs text-foreground">
                    <EventTypeDot type={event.type} />
                    <span className="truncate">{event.name}</span>
                  </p>
                ))}
                {hiddenCount > 0 ? (
                  <p className="text-xs font-medium text-muted-foreground">+{hiddenCount} lainnya</p>
                ) : null}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
