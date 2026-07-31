import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canViewAuditTrail } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export type OrganizationLogEntry = {
  id: string;
  actionType: string;
  memberId: string | null;
  oldRole: string | null;
  newRole: string | null;
  cgGroupId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  changedBy: string | null;
  createdAt: string | null;
};

export function buildOrganizationLogEntry(input: {
  actionType: string;
  memberId?: string | null;
  oldRole?: string | null;
  newRole?: string | null;
  cgGroupId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  changedBy: string;
}) {
  return {
    actionType: input.actionType,
    memberId: input.memberId ?? null,
    oldRole: input.oldRole ?? null,
    newRole: input.newRole ?? null,
    cgGroupId: input.cgGroupId ?? null,
    reason: input.reason ?? null,
    metadata: input.metadata ?? null,
    changedBy: input.changedBy,
    createdAt: FieldValue.serverTimestamp(),
  };
}

export async function getOrganizationLogForSession(session: SessionUser): Promise<OrganizationLogEntry[]> {
  if (!session.orgId || !canViewAuditTrail(session.role)) {
    return [];
  }

  const { adminDb } = getAdminServices();
  const snapshot = await adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("organizationLog")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  return snapshot.docs.map(toLogEntry);
}

function toLogEntry(doc: QueryDocumentSnapshot): OrganizationLogEntry {
  const data = doc.data();
  return {
    id: doc.id,
    actionType: typeof data.actionType === "string" ? data.actionType : "unknown",
    memberId: readString(data.memberId),
    oldRole: readString(data.oldRole),
    newRole: readString(data.newRole),
    cgGroupId: readString(data.cgGroupId),
    reason: readString(data.reason),
    metadata:
      typeof data.metadata === "object" && data.metadata !== null
        ? (data.metadata as Record<string, unknown>)
        : null,
    changedBy: readString(data.changedBy),
    createdAt: toDateLabel(data.createdAt),
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toDateLabel(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return readString(value);
}
