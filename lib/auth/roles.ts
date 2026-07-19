export const ROLE_LABELS: Record<string, string> = {
  coach: "Coach",
  cgl: "CGL",
  sponsor: "Sponsor",
  member: "Member",
  simpatisan: "Simpatisan",
};

export function getRoleLabel(role: string | null) {
  if (!role) {
    return "Belum ada role";
  }
  return ROLE_LABELS[role.toLowerCase()] ?? role;
}

export function isCoach(role: string | null) {
  return role === "coach";
}

export function isCgl(role: string | null) {
  return role === "cgl";
}

export function isSponsor(role: string | null) {
  return role === "sponsor";
}

export function isMember(role: string | null) {
  return role === "member";
}

export function isSimpatisan(role: string | null) {
  return role === "simpatisan";
}

export function hasFullMemberDirectoryAccess(role: string | null) {
  return isCoach(role) || isCgl(role);
}

export function canManageCgGroups(role: string | null) {
  return isCoach(role);
}

export function canViewMemberDirectory(role: string | null) {
  return isCoach(role) || isCgl(role) || isSponsor(role) || isMember(role) || isSimpatisan(role);
}

export function memberDirectoryFieldScope(role: string | null): "full" | "basic" {
  return isMember(role) || isSimpatisan(role) ? "basic" : "full";
}

export function canCreateMember(role: string | null) {
  return isCoach(role) || isCgl(role);
}

export function assignableRolesForCreator(role: string | null): string[] {
  if (isCoach(role)) {
    return ["coach", "cgl", "sponsor", "member", "simpatisan"];
  }
  if (isCgl(role)) {
    return ["cgl", "sponsor", "member", "simpatisan"];
  }
  return [];
}

export type BendaharaScope = "coach" | "cg";

export function bendaharaScopeForRole(role: string | null): BendaharaScope | null {
  if (isCgl(role)) {
    return "coach";
  }
  if (isSponsor(role)) {
    return "cg";
  }
  return null;
}

export function canAssignBendahara(
  actorRole: string | null,
  actorCgGroupId: string | null,
  targetRole: string | null,
  targetCgGroupId: string | null,
) {
  const scope = bendaharaScopeForRole(targetRole);
  if (!scope) {
    return false;
  }
  if (isCoach(actorRole)) {
    return true;
  }
  if (scope === "cg" && isCgl(actorRole)) {
    return actorCgGroupId !== null && actorCgGroupId === targetCgGroupId;
  }
  return false;
}