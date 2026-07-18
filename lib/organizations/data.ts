import { getAdminServices } from "@/lib/firebase/firebase-admin";

export async function resolveDefaultOrgId(): Promise<string | null> {
  const { adminDb } = getAdminServices();
  const snapshot = await adminDb.collection("organizations").limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}
