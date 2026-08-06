import { createHash } from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { FcmTokenDoc } from "@/lib/notifications/types";

function tokenDocId(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokensCollection(adminDb: Firestore, orgId: string, userId: string) {
  return adminDb
    .collection("organizations")
    .doc(orgId)
    .collection("users")
    .doc(userId)
    .collection("fcmTokens");
}

export async function saveFcmToken(
  adminDb: Firestore,
  orgId: string,
  userId: string,
  token: string,
  userAgent: string | null,
): Promise<void> {
  const docRef = tokensCollection(adminDb, orgId, userId).doc(tokenDocId(token));
  const existing = await docRef.get();
  await docRef.set(
    {
      token,
      userAgent,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
}

export async function deleteFcmToken(
  adminDb: Firestore,
  orgId: string,
  userId: string,
  token: string,
): Promise<void> {
  await tokensCollection(adminDb, orgId, userId).doc(tokenDocId(token)).delete();
}

export async function listFcmTokens(
  adminDb: Firestore,
  orgId: string,
  userId: string,
): Promise<FcmTokenDoc[]> {
  const snapshot = await tokensCollection(adminDb, orgId, userId).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      token: String(data.token ?? ""),
      userAgent: typeof data.userAgent === "string" ? data.userAgent : null,
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    };
  });
}

export async function deleteFcmTokensByValue(
  adminDb: Firestore,
  orgId: string,
  userId: string,
  tokens: string[],
): Promise<void> {
  if (tokens.length === 0) {
    return;
  }
  const batch = adminDb.batch();
  for (const token of tokens) {
    batch.delete(tokensCollection(adminDb, orgId, userId).doc(tokenDocId(token)));
  }
  await batch.commit();
}

export async function pruneStaleFcmTokensForUser(
  adminDb: Firestore,
  orgId: string,
  userId: string,
  maxAgeMs: number,
): Promise<number> {
  const snapshot = await tokensCollection(adminDb, orgId, userId).get();
  const cutoff = Date.now() - maxAgeMs;

  const staleDocs = snapshot.docs.filter((doc) => {
    const updatedAt = doc.data().updatedAt;
    const updatedAtMs =
      updatedAt && typeof updatedAt.toMillis === "function" ? updatedAt.toMillis() : null;
    return updatedAtMs === null || updatedAtMs < cutoff;
  });

  if (staleDocs.length === 0) {
    return 0;
  }

  const batch = adminDb.batch();
  for (const doc of staleDocs) {
    batch.delete(doc.ref);
  }
  await batch.commit();

  return staleDocs.length;
}
