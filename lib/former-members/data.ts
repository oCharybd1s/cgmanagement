import { Timestamp } from "firebase-admin/firestore";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { isCoach, isCgl } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";
import type { FormerMember, FormerMemberReason } from "@/lib/former-members/types";

const REASON_VALUES: FormerMemberReason[] = ["graduated", "moved", "unresponsive", "other"];

export async function getFormerMembersForSession(session: SessionUser): Promise<FormerMember[]> {
  if (!session.orgId) {
    return [];
  }

  const { adminDb } = getAdminServices();
  const formerMembersRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("formerMembers");

  if (isCoach(session.role)) {
    const snapshot = await formerMembersRef.get();
    return finalizeFormerMembers(snapshot.docs);
  }

  if (isCgl(session.role) && session.cgGroupId) {
    const snapshot = await formerMembersRef.where("cgGroupId", "==", session.cgGroupId).get();
    return finalizeFormerMembers(snapshot.docs);
  }

  return [];
}

function finalizeFormerMembers(docs: QueryDocumentSnapshot[]): FormerMember[] {
  return docs.map(toFormerMember).sort(compareFormerMembers);
}

function compareFormerMembers(a: FormerMember, b: FormerMember): number {
  const dateA = a.leftDate ?? "";
  const dateB = b.leftDate ?? "";
  if (dateA !== dateB) {
    return dateB.localeCompare(dateA);
  }
  return a.fullName.localeCompare(b.fullName, "id");
}

function toFormerMember(doc: QueryDocumentSnapshot): FormerMember {
  const data = doc.data();

  return {
    id: doc.id,
    fullName: readString(data.fullName) ?? "",
    phone: readString(data.phone),
    lastRole: readString(data.lastRole),
    cgGroupId: readString(data.cgGroupId),
    reason: toReason(data.reason),
    notes: readString(data.notes),
    leftDate: toDateLabel(data.leftDate),
    originalMemberId: readString(data.originalMemberId),
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toReason(value: unknown): FormerMemberReason {
  return REASON_VALUES.includes(value as FormerMemberReason) ? (value as FormerMemberReason) : "other";
}

function toDateLabel(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return readString(value);
}
