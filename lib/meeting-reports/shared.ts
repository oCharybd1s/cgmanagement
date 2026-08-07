import { MEETING_AGENDA_TYPES } from "@/lib/meeting-reports/types";
import type { MeetingAgendaType } from "@/lib/meeting-reports/types";

export function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeOptional(value: unknown): string | null {
  const text = toStringValue(value).trim();
  return text === "" ? null : text;
}

export const AGENDA_TYPE_LABELS: Record<MeetingAgendaType, string> = {
  one_on_one: "1 On 1 Meeting",
  sponsor_meeting: "Meeting Sponsor",
  others: "Others",
};

export const AGENDA_TYPE_OPTIONS: { value: MeetingAgendaType; label: string }[] = MEETING_AGENDA_TYPES.map(
  (value) => ({
    value,
    label: AGENDA_TYPE_LABELS[value],
  }),
);

export function normalizeAgendaType(value: unknown): MeetingAgendaType | null {
  return typeof value === "string" && (MEETING_AGENDA_TYPES as readonly string[]).includes(value)
    ? (value as MeetingAgendaType)
    : null;
}
