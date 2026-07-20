"use client";

import { ShieldCheck, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrganizationTreeCgGroup, OrganizationTreeMember } from "@/lib/organizations/tree";

export function CoachTreeOverview({
  coach,
  cgGroups,
  selectedCgId,
  onSelectCg,
}: {
  coach: OrganizationTreeMember | null;
  cgGroups: OrganizationTreeCgGroup[];
  selectedCgId: string | null;
  onSelectCg: (cgGroupId: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex min-w-40 flex-col items-center gap-1 rounded-2xl border-[1.5px] border-primary bg-primary px-5 py-3 text-center text-primary-foreground shadow-sm">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide opacity-80">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
          Coach
        </span>
        <span className="font-display text-sm font-bold tracking-tight">
          {coach?.fullName || "Belum ada Coach"}
        </span>
      </div>

      <div aria-hidden="true" className="h-6 w-px bg-border" />

      <div className="grid w-full gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cgGroups.map((group) => {
          const isSelected = group.id === selectedCgId;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelectCg(group.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border-[1.5px] px-4 py-4 text-center shadow-sm backdrop-blur-xl transition-colors duration-200",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/70 text-foreground hover:border-primary/60",
              )}
            >
              <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide opacity-80">
                <UserCog className="h-3.5 w-3.5" strokeWidth={2} />
                {group.groupCode}
              </span>
              <span className="font-display text-sm font-bold tracking-tight">
                {group.cgl?.fullName || "Belum ada CGL"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
