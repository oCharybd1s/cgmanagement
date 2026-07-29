import type { Member } from "@/lib/members/types";
import { toDateKey, type CalendarDate } from "@/lib/calendar/date-utils";

export type BirthdayItem = {
  memberId: string;
  fullName: string;
  cgGroupId: string | null;
  date: string;
  age: number | null;
};

const BIRTH_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

export function computeBirthdaysInRange(
  members: Member[],
  range: { start: CalendarDate; end: CalendarDate },
): BirthdayItem[] {
  const startKey = toDateKey(range.start);
  const endKey = toDateKey(range.end);
  const years = new Set<number>([range.start.year, range.end.year]);
  const items: BirthdayItem[] = [];

  for (const member of members) {
    const parsed = parseBirthMonthDay(member.birthDate);
    if (!parsed) {
      continue;
    }

    for (const year of years) {
      const day = clampDay(year, parsed.month, parsed.day);
      const candidateKey = toDateKey({ year, month: parsed.month, day });

      if (candidateKey < startKey || candidateKey > endKey) {
        continue;
      }

      items.push({
        memberId: member.id,
        fullName: member.fullName,
        cgGroupId: member.cgGroupId,
        date: candidateKey,
        age: parsed.year !== null ? year - parsed.year : null,
      });
    }
  }

  return items.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? -1 : 1;
    }
    return a.fullName.localeCompare(b.fullName);
  });
}

function parseBirthMonthDay(value: string | null): { year: number | null; month: number; day: number } | null {
  if (!value) {
    return null;
  }

  const match = BIRTH_DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { year, month, day };
}

function clampDay(year: number, month: number, day: number): number {
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return 28;
  }
  return day;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
