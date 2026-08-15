import { isCoach } from "@/lib/auth/roles";
import type { Member } from "@/lib/members/types";

export function getOneOnOneCandidates(
  members: Member[],
  viewerRole: string | null,
  viewerUid: string,
  viewerCgGroupId: string | null,
): Member[] {
  if (isCoach(viewerRole)) {
    return members.filter((member) => member.id !== viewerUid);
  }

  if (!viewerCgGroupId) {
    return [];
  }

  return members.filter((member) => member.cgGroupId === viewerCgGroupId && member.id !== viewerUid);
}
