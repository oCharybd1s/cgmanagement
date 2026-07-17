import type { SessionUser } from "@/lib/auth/types";

export const DEMO_SWITCHABLE_ROLES = ["coach", "cgl", "sponsor", "member", "simpatisan"] as const;

export type DemoSwitchableRole = (typeof DEMO_SWITCHABLE_ROLES)[number];

export function isDemoSwitchableRole(value: unknown): value is DemoSwitchableRole {
  return typeof value === "string" && (DEMO_SWITCHABLE_ROLES as readonly string[]).includes(value);
}

export function canUseDemoRoleSwitch(session: Pick<SessionUser, "email"> | null) {
  if (!session?.email || process.env.ALLOW_DEMO_ROLE_SWITCH !== "true") {
    return false;
  }

  const allowedEmail = process.env.DEMO_ROLE_SWITCH_EMAIL?.toLowerCase();
  if (!allowedEmail) {
    return false;
  }

  return session.email.toLowerCase() === allowedEmail;
}
