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

export function canViewMemberDirectory(role: string | null) {
  return isCoach(role) || isCgl(role) || isSponsor(role) || isMember(role) || isSimpatisan(role);
}

export function memberDirectoryFieldScope(role: string | null): "full" | "basic" {
  return isMember(role) || isSimpatisan(role) ? "basic" : "full";
}
