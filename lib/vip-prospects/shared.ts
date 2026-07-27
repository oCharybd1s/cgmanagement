import type { VipProspectStatus } from "@/lib/vip-prospects/types";

const STATUS_VALUES: VipProspectStatus[] = ["pending", "accept", "reject"];

export function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeOptional(value: unknown): string | null {
  const text = toStringValue(value).trim();
  return text === "" ? null : text;
}

export function normalizeStatus(value: unknown): VipProspectStatus {
  const text = toStringValue(value).trim().toLowerCase();
  return STATUS_VALUES.includes(text as VipProspectStatus) ? (text as VipProspectStatus) : "pending";
}
