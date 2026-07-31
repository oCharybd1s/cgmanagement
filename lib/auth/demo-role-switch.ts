import type { SessionUser } from "@/lib/auth/types";

export const DEMO_SWITCHABLE_ROLES = ["admin", "coach", "cgl", "sponsor", "member", "simpatisan"] as const;

export type DemoSwitchableRole = (typeof DEMO_SWITCHABLE_ROLES)[number];

export function isDemoSwitchableRole(value: unknown): value is DemoSwitchableRole {
  return typeof value === "string" && (DEMO_SWITCHABLE_ROLES as readonly string[]).includes(value);
}

export function canUseDemoRoleSwitch(session: Pick<SessionUser, "isSuperAdmin"> | null) {
  return process.env.ALLOW_DEMO_ROLE_SWITCH === "true" && session?.isSuperAdmin === true;
}
