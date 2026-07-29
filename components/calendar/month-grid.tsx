"use client";

import { cn } from "@/lib/utils";
import { addDays, getWeekdayLabel, toDateKey, type CalendarDate } from "@/lib/calendar/date-utils";
import { EventTypeDot, BirthdayDot } from "@/components/calendar/event-type-badge";
import type { CalendarDayItems } from "@/lib/calendar/group";

const MAX_VISIBLE_DOTS = 4;

export function MonthGrid({
  start,
  end,
  currentMonth,
  itemsByDate,
  todayKey,
  loading,
  onSelectDay,
}: {
  start: CalendarDate;
  end: CalendarDate;
  currentMonth: number;
  itemsByDate: Map<string, CalendarDayItems>;
  todayKey: string;
  loading: boolean;
  onSelectDay: (dateKey: string) => void;
}) {
  const days: CalendarDate[] = [];
  let cursor = start;
  while (toDateKey(cursor) <= toDateKey(end)) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const weekdayHeaders = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-7 gap-1.5">
        {weekdayHeaders.map((day) => (
          <p
            key={toDateKey(day)}
            className="px-1 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {getWeekdayLabel(day, true)}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const items = itemsByDate.get(dateKey);
          const isToday = dateKey === todayKey;
          const isCurrentMonth = day.month === currentMonth;
          const birthdays = items?.birthdays ?? [];
          const events = items?.events ?? [];
          const dots = [...birthdays.map(() => "birthday" as const), ...events.map((event) => event.type)];
          const visibleDots = dots.slice(0, MAX_VISIBLE_DOTS);
          const hiddenCount = dots.length - visibleDots.length;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDay(dateKey)}
              className={cn(
                "flex min-h-[68px] flex-col items-start gap-1 rounded-xl border border-border p-2 text-left transition-colors duration-200 hover:border-primary hover:bg-input/40 sm:min-h-[88px]",
                isCurrentMonth ? "bg-input/20" : "bg-transparent opacity-50",
                isToday && "border-primary bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-foreground",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.day}
              </span>

              {loading ? (
                <div className="h-2 w-1/2 animate-pulse rounded-full bg-muted" />
              ) : dots.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1">
                  {visibleDots.map((dot, index) =>
                    dot === "birthday" ? (
                      <BirthdayDot key={`birthday-${index}`} />
                    ) : (
                      <EventTypeDot key={`event-${index}`} type={dot} />
                    ),
                  )}
                  {hiddenCount > 0 ? (
                    <span className="text-[10px] font-medium text-muted-foreground">+{hiddenCount}</span>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
