import { cn } from "@/lib/utils";
import { AGENDA_TYPE_LABELS } from "@/lib/meeting-reports/shared";
import type { MeetingAgendaType } from "@/lib/meeting-reports/types";

type AgendaTone = {
  dot: string;
  chip: string;
};

export const AGENDA_TYPE_TONES: Record<MeetingAgendaType, AgendaTone> = {
  one_on_one: { dot: "bg-chart-1", chip: "bg-chart-1/15 text-chart-1 border-chart-1/30" },
  sponsor_meeting: { dot: "bg-chart-4", chip: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
  others: { dot: "bg-secondary", chip: "bg-secondary/60 text-secondary-foreground border-secondary" },
};

export function AgendaTypeBadge({ type, className }: { type: MeetingAgendaType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        AGENDA_TYPE_TONES[type].chip,
        className,
      )}
    >
      <span className={cn("size-2 shrink-0 rounded-full", AGENDA_TYPE_TONES[type].dot)} />
      {AGENDA_TYPE_LABELS[type]}
    </span>
  );
}
