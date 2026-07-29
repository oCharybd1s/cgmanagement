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

export function canViewFormerMembers(role: string | null) {
  return isCoach(role) || isCgl(role);
}

export function canViewVipList(role: string | null) {
  return isCoach(role) || isCgl(role) || isSponsor(role);
}

export function canCreateVipProspect(role: string | null) {
  return canViewVipList(role);
}

export function canManageVipProspect(
  actorRole: string | null,
  actorCgGroupId: string | null,
  targetCgId: string | null,
) {
  if (isCoach(actorRole)) {
    return true;
  }
  if (isCgl(actorRole) || isSponsor(actorRole)) {
    return actorCgGroupId !== null && actorCgGroupId === targetCgId;
  }
  return false;
}

export function canDeleteVipProspect(
  actorRole: string | null,
  actorCgGroupId: string | null,
  targetCgId: string | null,
) {
  if (isCoach(actorRole)) {
    return true;
  }
  if (isCgl(actorRole)) {
    return actorCgGroupId !== null && actorCgGroupId === targetCgId;
  }
  return false;
}

export function canViewMeetingReports(role: string | null) {
  return isCoach(role) || isCgl(role) || isSponsor(role);
}

export function canCreateMeetingReport(role: string | null) {
  return isCoach(role) || isCgl(role) || isSponsor(role);
}

export function canManageMeetingReport(role: string | null) {
  return isCoach(role);
}

export function canDeleteMeetingReport(role: string | null) {
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

export function canQuickAddMember(role: string | null) {
  return isCoach(role) || isCgl(role) || isSponsor(role) || isSimpatisan(role);
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

export function isManagedRole(role: string | null) {
  return role === "sponsor" || role === "cgl";
}

export function canEditMember(
  actorRole: string | null,
  actorCgGroupId: string | null,
  targetRole: string | null,
  targetCgGroupId: string | null,
) {
  if (isCoach(actorRole)) {
    return true;
  }
  if (isCgl(actorRole)) {
    return actorCgGroupId !== null && actorCgGroupId === targetCgGroupId;
  }
  if (isSponsor(actorRole)) {
    return actorCgGroupId !== null && actorCgGroupId === targetCgGroupId && !isManagedRole(targetRole);
  }
  return false;
}

export function canDeleteMember(
  actorRole: string | null,
  actorCgGroupId: string | null,
  targetRole: string | null,
  targetCgGroupId: string | null,
) {
  return canEditMember(actorRole, actorCgGroupId, targetRole, targetCgGroupId);
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

export const PROMOTABLE_ROLE_ORDER = ["simpatisan", "member", "sponsor", "cgl"] as const;

function roleTierIndex(role: string | null): number {
  if (!role) {
    return -1;
  }
  return PROMOTABLE_ROLE_ORDER.indexOf(role as (typeof PROMOTABLE_ROLE_ORDER)[number]);
}

export function nextRoleUp(role: string | null): string | null {
  const index = roleTierIndex(role);
  if (index === -1 || index >= PROMOTABLE_ROLE_ORDER.length - 1) {
    return null;
  }
  return PROMOTABLE_ROLE_ORDER[index + 1];
}

export function nextRoleDown(role: string | null): string | null {
  const index = roleTierIndex(role);
  if (index <= 0) {
    return null;
  }
  return PROMOTABLE_ROLE_ORDER[index - 1];
}

export function canPromoteMember(
  actorRole: string | null,
  actorCgGroupId: string | null,
  targetRole: string | null,
  targetCgGroupId: string | null,
) {
  const promotedRole = nextRoleUp(targetRole);
  if (!promotedRole) {
    return false;
  }

  if (isCoach(actorRole)) {
    return true;
  }

  if (isCgl(actorRole)) {
    if (promotedRole === "cgl") {
      return false;
    }
    return actorCgGroupId !== null && actorCgGroupId === targetCgGroupId;
  }

  if (isSponsor(actorRole)) {
    return targetRole === "simpatisan" && actorCgGroupId !== null && actorCgGroupId === targetCgGroupId;
  }

  return false;
}

export function canDemoteMember(
  actorRole: string | null,
  actorCgGroupId: string | null,
  targetRole: string | null,
  targetCgGroupId: string | null,
) {
  const demotedRole = nextRoleDown(targetRole);
  if (!demotedRole) {
    return false;
  }

  if (isCoach(actorRole)) {
    return true;
  }

  if (isCgl(actorRole)) {
    if (targetRole === "cgl") {
      return false;
    }
    return actorCgGroupId !== null && actorCgGroupId === targetCgGroupId;
  }

  return false;
}

export function canViewOrganizationTree(role: string | null) {
  return isCoach(role) || isCgl(role) || isSponsor(role);
}

export function canBroadcastNotification(role: string | null) {
  return isCoach(role);
}

export function cgGroupDisplayLabel(role: string | null, cgLabel: string | null) {
  if (isCoach(role)) {
    return "Semua CG";
  }
  return cgLabel ?? "Belum ada CG";
}
