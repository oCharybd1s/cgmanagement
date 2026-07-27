import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { isCoach, isCgl, isSponsor } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";
import type { VipProspect, VipProspectStatus } from "@/lib/vip-prospects/types";

const STATUS_VALUES: VipProspectStatus[] = ["pending", "accept", "reject"];
const STATUS_ORDER: Record<VipProspectStatus, number> = { pending: 0, accept: 1, reject: 2 };

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
  if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) {
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  }
  return a.name.localeCompare(b.name, "id");
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
    createdBy: readString(data.createdBy),
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toStatus(value: unknown): VipProspectStatus {
  return STATUS_VALUES.includes(value as VipProspectStatus) ? (value as VipProspectStatus) : "pending";
}
