import { FieldValue } from "firebase-admin/firestore";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { normalizeName, normalizePhoneDigits } from "@/lib/vip-prospects/shared";
import type { VipProspectStatus } from "@/lib/vip-prospects/types";

type MatchedProspect = {
  id: string;
  data: FirebaseFirestore.DocumentData;
};

async function findProspectByCgNamePhone(
  adminDb: Firestore,
  orgId: string,
  cgGroupId: string,
  name: string,
  phone: string,
  allowedStatuses: VipProspectStatus[],
): Promise<MatchedProspect | null> {
  const phoneDigits = normalizePhoneDigits(phone);
  const normalizedName = normalizeName(name);
  if (!phoneDigits || !normalizedName) {
    return null;
  }

  const snapshot = await adminDb
    .collection("organizations")
    .doc(orgId)
    .collection("vipProspects")
    .where("cgId", "==", cgGroupId)
    .get();

  for (const doc of snapshot.docs as QueryDocumentSnapshot[]) {
    const data = doc.data();
    const status = typeof data.status === "string" ? (data.status as VipProspectStatus) : "pending";
    if (!allowedStatuses.includes(status)) {
      continue;
    }
    const docName = typeof data.name === "string" ? data.name : "";
    const docPhone = typeof data.phone === "string" ? data.phone : "";
    if (normalizeName(docName) === normalizedName && normalizePhoneDigits(docPhone) === phoneDigits) {
      return { id: doc.id, data };
    }
  }

  return null;
}

async function findProspectByLinkedMemberId(
  adminDb: Firestore,
  orgId: string,
  memberId: string,
): Promise<MatchedProspect | null> {
  const snapshot = await adminDb
    .collection("organizations")
    .doc(orgId)
    .collection("vipProspects")
    .where("linkedMemberId", "==", memberId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, data: doc.data() };
}

export async function linkVipProspectToNewSimpatisan(
  adminDb: Firestore,
  orgId: string,
  cgGroupId: string,
  fullName: string,
  phone: string | null,
  memberId: string,
): Promise<void> {
  if (!phone) {
    return;
  }

  const matched = await findProspectByCgNamePhone(adminDb, orgId, cgGroupId, fullName, phone, ["pending"]);
  if (!matched) {
    return;
  }

  await adminDb
    .collection("organizations")
    .doc(orgId)
    .collection("vipProspects")
    .doc(matched.id)
    .update({
      status: "berpotensi",
      linkedMemberId: memberId,
      updatedAt: FieldValue.serverTimestamp(),
    })
    .catch(() => undefined);
}

export async function createLinkedSimpatisanFromProspect(
  adminDb: Firestore,
  orgId: string,
  actorUid: string,
  cgGroupId: string,
  fullName: string,
  phone: string | null,
): Promise<string> {
  const memberRef = adminDb.collection("organizations").doc(orgId).collection("users").doc();
  const now = FieldValue.serverTimestamp();

  await memberRef.set({
    fullName,
    role: "simpatisan",
    cgGroupId,
    nij: null,
    address: null,
    birthPlace: null,
    birthDate: null,
    email: null,
    phone,
    isBendahara: false,
    mustChangePassword: false,
    hasAccount: false,
    spiritualStatus: {
      baptisSelam: false,
      baptisRohKudus: false,
      msj1: false,
      msj2: false,
      msj3: false,
      cgt1: false,
      cgt2: false,
      cgt3: false,
    },
    pelayanan: null,
    avatarId: null,
    createdBy: actorUid,
    createdAt: now,
    updatedBy: actorUid,
    updatedAt: now,
  });

  return memberRef.id;
}

export async function markLinkedVipProspectAsAccepted(
  adminDb: Firestore,
  orgId: string,
  memberId: string,
  cgGroupId: string,
  fullName: string,
  phone: string | null,
): Promise<void> {
  let matched = await findProspectByLinkedMemberId(adminDb, orgId, memberId);

  if (!matched && phone) {
    matched = await findProspectByCgNamePhone(adminDb, orgId, cgGroupId, fullName, phone, ["pending", "berpotensi"]);
  }

  if (!matched) {
    return;
  }
  if (matched.data.status === "accept") {
    return;
  }

  await adminDb
    .collection("organizations")
    .doc(orgId)
    .collection("vipProspects")
    .doc(matched.id)
    .update({
      status: "accept",
      linkedMemberId: memberId,
      updatedAt: FieldValue.serverTimestamp(),
    })
    .catch(() => undefined);
}
