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
