import { cn } from "@/lib/utils";
import { EVENT_TYPE_LABELS } from "@/lib/events/access";
import type { EventType } from "@/lib/events/types";

type EventTone = {
  dot: string;
  chip: string;
};

export const EVENT_TYPE_TONES: Record<EventType, EventTone> = {
  meeting_one_on_one: { dot: "bg-chart-1", chip: "bg-chart-1/15 text-chart-1 border-chart-1/30" },
  meeting_cg: { dot: "bg-chart-3", chip: "bg-chart-3/15 text-chart-3 border-chart-3/30" },
  meeting_cgl: { dot: "bg-chart-4", chip: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
  all_leader: { dot: "bg-chart-5", chip: "bg-chart-5/15 text-chart-5 border-chart-5/30" },
  all_cgl: { dot: "bg-secondary", chip: "bg-secondary/60 text-secondary-foreground border-secondary" },
  all: { dot: "bg-accent", chip: "bg-accent/70 text-accent-foreground border-accent" },
  all_ministry: { dot: "bg-success", chip: "bg-success/15 text-success border-success/30" },
};

export const BIRTHDAY_TONE: EventTone = {
  dot: "bg-brand-spark",
  chip: "bg-brand-spark/25 text-brand-spark-foreground border-brand-spark/40",
};

export function EventTypeDot({ type, className }: { type: EventType; className?: string }) {
  return <span className={cn("size-2 shrink-0 rounded-full", EVENT_TYPE_TONES[type].dot, className)} />;
}

export function EventTypeBadge({ type, className }: { type: EventType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        EVENT_TYPE_TONES[type].chip,
        className,
      )}
    >
      <EventTypeDot type={type} />
      {EVENT_TYPE_LABELS[type]}
    </span>
  );
}

export function BirthdayDot({ className }: { className?: string }) {
  return <span className={cn("size-2 shrink-0 rounded-full", BIRTHDAY_TONE.dot, className)} />;
}

export function BirthdayBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        BIRTHDAY_TONE.chip,
        className,
      )}
    >
      <BirthdayDot />
      {label}
    </span>
  );
}
