export const EVENT_TYPES = [
  "meeting_one_on_one",
  "meeting_cg",
  "meeting_cgl",
  "all_leader",
  "all_cgl",
  "all",
  "all_ministry",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type EventRecord = {
  id: string;
  name: string;
  description: string | null;
  date: string;
  time: string | null;
  type: EventType;
  targetCgId: string | null;
  targetUserId: string | null;
  createdBy: string;
  createdByRole: string;
  createdAt: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
};
