export type CalendarDate = { year: number; month: number; day: number };

export function toCalendarDate(date: Date): CalendarDate {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

export function todayCalendarDate(): CalendarDate {
  return toCalendarDate(new Date());
}

export function toDateKey(date: CalendarDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

export function fromDateKey(key: string): CalendarDate {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

function toJsDate(date: CalendarDate): Date {
  return new Date(date.year, date.month - 1, date.day);
}

export function addDays(date: CalendarDate, amount: number): CalendarDate {
  const next = toJsDate(date);
  next.setDate(next.getDate() + amount);
  return toCalendarDate(next);
}

export function addMonths(date: CalendarDate, amount: number): CalendarDate {
  const next = toJsDate(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  return toCalendarDate(next);
}

export function getWeekday(date: CalendarDate): number {
  return toJsDate(date).getDay();
}

export function getWeekRange(date: CalendarDate): { start: CalendarDate; end: CalendarDate } {
  const weekday = getWeekday(date);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = addDays(date, mondayOffset);
  const end = addDays(start, 6);
  return { start, end };
}

export function getMonthGridRange(date: CalendarDate): { start: CalendarDate; end: CalendarDate } {
  const firstOfMonth: CalendarDate = { year: date.year, month: date.month, day: 1 };
  const lastOfMonth = addDays(addMonths(firstOfMonth, 1), -1);
  const start = getWeekRange(firstOfMonth).start;
  const end = getWeekRange(lastOfMonth).end;
  return { start, end };
}

export function isSameDate(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function isDateInRange(date: CalendarDate, start: CalendarDate, end: CalendarDate): boolean {
  const key = toDateKey(date);
  return key >= toDateKey(start) && key <= toDateKey(end);
}

const WEEKDAY_LABELS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const WEEKDAY_SHORT_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function getWeekdayLabel(date: CalendarDate, short = false): string {
  const index = getWeekday(date);
  return short ? WEEKDAY_SHORT_LABELS[index] : WEEKDAY_LABELS[index];
}

export function getMonthLabel(month: number): string {
  return MONTH_LABELS[month - 1] ?? "";
}

export function formatDayLabel(date: CalendarDate): string {
  return `${date.day} ${getMonthLabel(date.month)}`;
}

export function formatFullLabel(date: CalendarDate): string {
  return `${getWeekdayLabel(date)}, ${date.day} ${getMonthLabel(date.month)} ${date.year}`;
}

export function formatWeekRangeLabel(start: CalendarDate, end: CalendarDate): string {
  if (start.year !== end.year) {
    return `${formatDayLabel(start)} ${start.year} - ${formatDayLabel(end)} ${end.year}`;
  }
  if (start.month !== end.month) {
    return `${formatDayLabel(start)} - ${formatDayLabel(end)} ${end.year}`;
  }
  return `${start.day} - ${end.day} ${getMonthLabel(start.month)} ${start.year}`;
}

export function formatMonthLabel(date: CalendarDate): string {
  return `${getMonthLabel(date.month)} ${date.year}`;
}
