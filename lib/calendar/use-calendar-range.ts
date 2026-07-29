"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  fromDateKey,
  getMonthGridRange,
  getWeekRange,
  toDateKey,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendar/date-utils";
import { computeBirthdaysInRange } from "@/lib/calendar/birthdays";
import type { EventRecord } from "@/lib/events/types";
import type { Member } from "@/lib/members/types";

export type CalendarMode = "week" | "month";

export function useCalendarRange(mode: CalendarMode, members: Member[], initialAnchorKey?: string) {
  const [anchor, setAnchor] = React.useState<CalendarDate>(() =>
    initialAnchorKey ? fromDateKey(initialAnchorKey) : todayCalendarDate(),
  );
  const [events, setEvents] = React.useState<EventRecord[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [refreshToken, setRefreshToken] = React.useState(0);

  const range = React.useMemo(
    () => (mode === "week" ? getWeekRange(anchor) : getMonthGridRange(anchor)),
    [mode, anchor],
  );

  const startKey = toDateKey(range.start);
  const endKey = toDateKey(range.end);

  const birthdays = React.useMemo(
    () => computeBirthdaysInRange(members, range),
    [members, range],
  );

  React.useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/calendar?start=${startKey}&end=${endKey}`);
        const data = await response.json().catch(() => null);

        if (cancelled) {
          return;
        }

        if (!response.ok || !data?.ok) {
          setError(typeof data?.error === "string" ? data.error : "Gagal memuat kalender");
          setEvents([]);
          return;
        }

        setError(null);
        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch {
        if (!cancelled) {
          setError("Gagal memuat kalender");
          setEvents([]);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [startKey, endKey, refreshToken]);

  const goPrev = React.useCallback(() => {
    setAnchor((current) => (mode === "week" ? addDays(current, -7) : addMonths(current, -1)));
  }, [mode]);

  const goNext = React.useCallback(() => {
    setAnchor((current) => (mode === "week" ? addDays(current, 7) : addMonths(current, 1)));
  }, [mode]);

  const goToday = React.useCallback(() => {
    setAnchor(todayCalendarDate());
  }, []);

  const refresh = React.useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  return { anchor, range, events, birthdays, loading: isPending, error, goPrev, goNext, goToday, refresh };
}
