export type FormerMemberReason = "graduated" | "moved" | "unresponsive" | "other";

export type FormerMember = {
  id: string;
  fullName: string;
  phone: string | null;
  lastRole: string | null;
  cgGroupId: string | null;
  reason: FormerMemberReason;
  notes: string | null;
  leftDate: string | null;
  originalMemberId: string | null;
};
