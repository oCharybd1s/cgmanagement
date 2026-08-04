import { Timestamp } from "firebase-admin/firestore";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { isCoach, isCgl, isSponsor } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";
import type { VipProspect, VipProspectStatus } from "@/lib/vip-prospects/types";

const STATUS_VALUES: VipProspectStatus[] = ["pending", "berpotensi", "accept", "reject"];

export async function getVipProspectsForSession(session: SessionUser): Promise<VipProspect[]> {
  if (!session.orgId) {
    return [];
  }

  const { adminDb } = getAdminServices();
  const prospectsRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("vipProspects");

  if (isCoach(session.role)) {
    const snapshot = await prospectsRef.get();
    return finalizeVipProspects(snapshot.docs);
  }

  if ((isCgl(session.role) || isSponsor(session.role)) && session.cgGroupId) {
    const snapshot = await prospectsRef.where("cgId", "==", session.cgGroupId).get();
    return finalizeVipProspects(snapshot.docs);
  }

  return [];
}

function finalizeVipProspects(docs: QueryDocumentSnapshot[]): VipProspect[] {
  return docs.map(toVipProspect).sort(compareVipProspects);
}

function compareVipProspects(a: VipProspect, b: VipProspect): number {
  const createdA = a.createdAt ?? "";
  const createdB = b.createdAt ?? "";
  return createdA < createdB ? 1 : createdA > createdB ? -1 : 0;
}

function toVipProspect(doc: QueryDocumentSnapshot): VipProspect {
  const data = doc.data();

  return {
    id: doc.id,
    name: readString(data.name) ?? "",
    phone: readString(data.phone),
    cgId: readString(data.cgId),
    followUpByUserId: readString(data.followUpByUserId),
    status: toStatus(data.status),
    notes: readString(data.notes),
    linkedMemberId: readString(data.linkedMemberId),
    createdBy: readString(data.createdBy),
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

function toStatus(value: unknown): VipProspectStatus {
  return STATUS_VALUES.includes(value as VipProspectStatus) ? (value as VipProspectStatus) : "pending";
}
