import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";

export const COACH_KAS_ACCOUNT_ID = "coach";

export async function ensureCoachKasAccount(orgId: string): Promise<void> {
  const { adminDb } = getAdminServices();
  const ref = adminDb
    .collection("organizations")
    .doc(orgId)
    .collection("kasAccounts")
    .doc(COACH_KAS_ACCOUNT_ID);

  const snapshot = await ref.get();
  if (snapshot.exists) {
    return;
  }

  try {
    await ref.create({
      accountType: "coach",
      refId: null,
      balance: 0,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return;
  }
}

export async function ensureCgKasAccount(orgId: string, cgId: string): Promise<void> {
  const { adminDb } = getAdminServices();
  const ref = adminDb.collection("organizations").doc(orgId).collection("kasAccounts").doc(cgId);

  const snapshot = await ref.get();
  if (snapshot.exists) {
    return;
  }

  try {
    await ref.create({
      accountType: "cg",
      refId: cgId,
      balance: 0,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return;
  }
}
