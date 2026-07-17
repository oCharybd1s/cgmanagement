import type { SessionUser } from "@/lib/auth/types";
import { canUseDemoRoleSwitch } from "@/lib/auth/demo-role-switch";

export type ShellUser = Pick<SessionUser, "email" | "role" | "cgGroupId"> & {
  canSwitchRole: boolean;
};

export function toShellUser(session: SessionUser): ShellUser {
  return {
    email: session.email,
    role: session.role,
    cgGroupId: session.cgGroupId,
    canSwitchRole: canUseDemoRoleSwitch(session),
  };
}
