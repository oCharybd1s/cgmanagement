import type { BirthdayItem } from "@/lib/calendar/birthdays";
import type { EventRecord } from "@/lib/events/types";

export type CalendarDayItems = {
  events: EventRecord[];
  birthdays: BirthdayItem[];
};

export function groupCalendarItemsByDate(events: EventRecord[], birthdays: BirthdayItem[]): Map<string, CalendarDayItems> {
  const map = new Map<string, CalendarDayItems>();

  for (const event of events) {
    const bucket = getBucket(map, event.date);
    bucket.events.push(event);
  }

  for (const birthday of birthdays) {
    const bucket = getBucket(map, birthday.date);
    bucket.birthdays.push(birthday);
  }

  return map;
}

function getBucket(map: Map<string, CalendarDayItems>, dateKey: string): CalendarDayItems {
  const existing = map.get(dateKey);
  if (existing) {
    return existing;
  }
  const created: CalendarDayItems = { events: [], birthdays: [] };
  map.set(dateKey, created);
  return created;
}
