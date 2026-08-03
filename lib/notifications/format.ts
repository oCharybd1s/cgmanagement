import type { NotificationCategory } from "@/lib/notifications/types";

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  birthday: "Ulang Tahun",
  event: "Event",
  vip: "List VIP",
  general: "Umum",
};

export function getCategoryLabel(category: NotificationCategory): string {
  return CATEGORY_LABELS[category];
}

export function formatNotificationTime(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 1) {
    return "Baru saja";
  }
  if (Math.abs(diffMinutes) < 60) {
    return RELATIVE_TIME_FORMATTER.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_TIME_FORMATTER.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return RELATIVE_TIME_FORMATTER.format(diffDays, "day");
  }

  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}
