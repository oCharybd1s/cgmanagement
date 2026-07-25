import type { Member, SpiritualStatus } from "@/lib/members/types";

const ROLE_ORDER: Record<string, number> = {
  coach: 0,
  cgl: 1,
  sponsor: 2,
  member: 3,
  simpatisan: 4,
};

function roleRank(role: string): number {
  return ROLE_ORDER[role] ?? Object.keys(ROLE_ORDER).length;
}

function spiritualStatusCount(status: SpiritualStatus): number {
  return Object.values(status).filter(Boolean).length;
}

export function compareMembersForDirectory(a: Member, b: Member): number {
  const roleDiff = roleRank(a.role) - roleRank(b.role);
  if (roleDiff !== 0) {
    return roleDiff;
  }

  const statusDiff = spiritualStatusCount(b.spiritualStatus) - spiritualStatusCount(a.spiritualStatus);
  if (statusDiff !== 0) {
    return statusDiff;
  }

  return a.fullName.localeCompare(b.fullName, "id");
}
