export function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeOptional(value: unknown): string | null {
  const text = toStringValue(value).trim();
  return text === "" ? null : text;
}
