import { getEventsForSession } from "@/lib/events/data";
import { computeBirthdaysInRange } from "@/lib/calendar/birthdays";
import { fromDateKey } from "@/lib/calendar/date-utils";
import { getMembersForSession } from "@/lib/members/data";
import type { SessionUser } from "@/lib/auth/types";
import type { EventRecord } from "@/lib/events/types";
import type { BirthdayItem } from "@/lib/calendar/birthdays";

export type CalendarRange = { start: string; end: string };

export type CalendarData = {
  events: EventRecord[];
  birthdays: BirthdayItem[];
};

export async function getCalendarDataForSession(session: SessionUser, range: CalendarRange): Promise<CalendarData> {
  const [events, members] = await Promise.all([
    getEventsForSession(session, range),
    getMembersForSession(session),
  ]);

  const birthdays = computeBirthdaysInRange(members, {
    start: fromDateKey(range.start),
    end: fromDateKey(range.end),
  });

  return { events, birthdays };
}
