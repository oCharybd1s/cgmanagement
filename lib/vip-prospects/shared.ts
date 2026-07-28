import type { VipProspectStatus } from "@/lib/vip-prospects/types";

const STATUS_VALUES: VipProspectStatus[] = ["pending", "berpotensi", "accept", "reject"];

export const VIP_STATUS_LABELS: Record<VipProspectStatus, string> = {
  pending: "Pending",
  berpotensi: "Berpotensi",
  accept: "Accept",
  reject: "Reject",
};

export const VIP_STATUS_OPTIONS: { value: VipProspectStatus; label: string }[] = STATUS_VALUES.map((value) => ({
  value,
  label: VIP_STATUS_LABELS[value],
}));

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

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizePhoneDigits(value: string | null): string {
  if (!value) {
    return "";
  }
  return value.replace(/\D/g, "");
}
