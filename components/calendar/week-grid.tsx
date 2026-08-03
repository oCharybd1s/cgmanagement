"use client";

import { cn } from "@/lib/utils";
import { addDays, getWeekdayLabel, toDateKey, type CalendarDate } from "@/lib/calendar/date-utils";
import type { CalendarDayItems } from "@/lib/calendar/group";

function getDotClassName(hasBirthday: boolean, hasEvent: boolean, isToday: boolean): string {
  if (!hasBirthday && !hasEvent) {
    return "bg-transparent";
  }
  if (isToday) {
    return "bg-primary-foreground";
  }
  return hasBirthday ? "bg-brand-spark" : "bg-primary";
}

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
    <div className="flex items-stretch justify-between gap-1 sm:gap-2">
      {days.map((day) => {
        const dateKey = toDateKey(day);
        const items = itemsByDate.get(dateKey);
        const isToday = dateKey === todayKey;
        const hasBirthday = (items?.birthdays.length ?? 0) > 0;
        const hasEvent = (items?.events.length ?? 0) > 0;

        return (
          <button
            key={dateKey}
            type="button"
            onClick={() => onSelectDay(dateKey)}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 rounded-2xl px-1 py-3 transition-colors duration-200",
              isToday ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide sm:text-xs",
                isToday ? "text-primary-foreground/75" : "text-muted-foreground",
              )}
            >
              {getWeekdayLabel(day, true)}
            </span>
            <span className="font-tabular text-lg font-bold sm:text-xl">{day.day}</span>
            {loading ? (
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/40" />
            ) : (
              <span className={cn("size-1.5 rounded-full", getDotClassName(hasBirthday, hasEvent, isToday))} />
            )}
          </button>
        );
      })}
    </div>
  );
}
