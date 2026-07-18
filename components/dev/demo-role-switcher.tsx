"use client";

import * as React from "react";
import { FlaskConical } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { DEMO_SWITCHABLE_ROLES, type DemoSwitchableRole } from "@/lib/auth/demo-role-switch";
import { useDemoRoleSwitch } from "@/hooks/use-demo-role-switch";
import { SessionStatusPanel } from "@/components/dev/session-status-panel";

export function DemoRoleSwitcher({
  currentRole,
  currentOrgId,
  currentCgGroupId,
}: {
  currentRole: string | null;
  currentOrgId: string | null;
  currentCgGroupId: string | null;
}) {
  const { switchRole, loadCgGroups, cgGroups, isSwitching, isLoadingCgGroups, error } = useDemoRoleSwitch();
  const [role, setRole] = React.useState<DemoSwitchableRole>((currentRole as DemoSwitchableRole) ?? "coach");
  const [cgGroupId, setCgGroupId] = React.useState(currentCgGroupId ?? "");
  const needsCgGroup = role !== "coach";

  React.useEffect(() => {
    loadCgGroups();
  }, []);

  return (
    <>
      <SessionStatusPanel
        initialStatus={{ role: currentRole, orgId: currentOrgId, cgGroupId: currentCgGroupId }}
      />

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5" strokeWidth={2} />
          Demo Role Switch
        </div>

        <div className="flex flex-col gap-2 px-1">
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as DemoSwitchableRole)}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
          >
            {DEMO_SWITCHABLE_ROLES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>

          {needsCgGroup ? (
            <select
              value={cgGroupId}
              onChange={(event) => setCgGroupId(event.target.value)}
              disabled={isLoadingCgGroups}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
            >
              <option value="">Pilih CG</option>
              {cgGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.groupCode}
                </option>
              ))}
            </select>
          ) : null}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <button
            type="button"
            disabled={isSwitching || (needsCgGroup && !cgGroupId)}
            onClick={() => switchRole(role, needsCgGroup ? cgGroupId : null)}
            className="w-full rounded-lg bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSwitching ? "Mengganti..." : "Ganti Role"}
          </button>
        </div>
      </div>
    </>
  );
}
