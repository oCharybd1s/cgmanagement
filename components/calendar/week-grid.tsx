"use client";

import { cn } from "@/lib/utils";
import { addDays, getWeekdayLabel, toDateKey, type CalendarDate } from "@/lib/calendar/date-utils";
import { EventTypeDot, BirthdayDot } from "@/components/calendar/event-type-badge";
import type { CalendarDayItems } from "@/lib/calendar/group";

const MAX_VISIBLE_DOTS = 3;

export function WeekGrid({
  start,
  itemsByDate,
  todayKey,
  selectedDateKey,
  loading,
  onSelectDay,
}: {
  start: CalendarDate;
  itemsByDate: Map<string, CalendarDayItems>;
  todayKey: string;
  selectedDateKey?: string | null;
  loading: boolean;
  onSelectDay: (dateKey: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day) => {
        const dateKey = toDateKey(day);
        const items = itemsByDate.get(dateKey);
        const isToday = dateKey === todayKey;
        const isSelected = dateKey === selectedDateKey;
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
              "flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 text-center transition-colors duration-200 hover:bg-input/40",
              isSelected
                ? "bg-primary text-primary-foreground"
                : isToday
                  ? "bg-primary/10 text-foreground"
                  : "text-foreground",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              {getWeekdayLabel(day, true)}
            </span>

            <span className="text-lg font-bold tracking-tight">{day.day}</span>

            {loading ? (
              <div
                className={cn(
                  "h-1.5 w-1.5 animate-pulse rounded-full",
                  isSelected ? "bg-primary-foreground/50" : "bg-muted",
                )}
              />
            ) : dots.length > 0 ? (
              <div className="flex items-center gap-0.5">
                {visibleDots.map((dot, index) =>
                  dot === "birthday" ? (
                    <BirthdayDot
                      key={`birthday-${index}`}
                      className={isSelected ? "ring-1 ring-primary-foreground/60" : undefined}
                    />
                  ) : (
                    <EventTypeDot
                      key={`event-${index}`}
                      type={dot}
                      className={isSelected ? "ring-1 ring-primary-foreground/60" : undefined}
                    />
                  ),
                )}
                {hiddenCount > 0 ? (
                  <span
                    className={cn(
                      "text-[9px] font-medium",
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    +{hiddenCount}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="h-1.5 w-1.5" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}