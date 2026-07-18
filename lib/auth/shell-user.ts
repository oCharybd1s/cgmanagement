import type { SessionUser } from "@/lib/auth/types";
import { canUseDemoRoleSwitch } from "@/lib/auth/demo-role-switch";

export type ShellUser = Pick<SessionUser, "email" | "role" | "orgId" | "cgGroupId"> & {
  canSwitchRole: boolean;
};

export function toShellUser(session: SessionUser): ShellUser {
  return {
    email: session.email,
    role: session.role,
    orgId: session.orgId,
    cgGroupId: session.cgGroupId,
    canSwitchRole: canUseDemoRoleSwitch(session),
  };
}
