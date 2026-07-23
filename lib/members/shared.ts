import type { SpiritualStatus } from "@/lib/members/types";

export function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeOptional(value: unknown): string | null {
  const text = toStringValue(value).trim();
  return text === "" ? null : text;
}

export function normalizeSpiritualStatus(value: unknown): SpiritualStatus {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return {
    baptisSelam: record.baptisSelam === true,
    baptisRohKudus: record.baptisRohKudus === true,
    msj1: record.msj1 === true,
    msj2: record.msj2 === true,
    msj3: record.msj3 === true,
    cgt1: record.cgt1 === true,
    cgt2: record.cgt2 === true,
    cgt3: record.cgt3 === true,
  };
}

export function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}
