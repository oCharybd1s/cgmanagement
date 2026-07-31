import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canCreateOrganization } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export async function resolveDefaultOrgId(): Promise<string | null> {
  const { adminDb } = getAdminServices();
  const snapshot = await adminDb.collection("organizations").limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}

export type OrganizationSummary = { id: string; name: string; createdAt: string | null };

export async function getOrganizationsForSession(session: SessionUser): Promise<OrganizationSummary[]> {
  if (!canCreateOrganization(session.role)) {
    return [];
  }

  const { adminDb } = getAdminServices();
  const snapshot = await adminDb.collection("organizations").orderBy("createdAt", "desc").get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: typeof data.name === "string" ? data.name : doc.id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
    };
  });
}

export type CreateOrganizationResult = { ok: true; orgId: string } | { ok: false; status: number; error: string };

export async function createOrganizationForSession(
  session: SessionUser,
  input: { orgId: string; name: string },
): Promise<CreateOrganizationResult> {
  if (!canCreateOrganization(session.role)) {
    return { ok: false, status: 403, error: "Hanya Administrator yang bisa membuat organisasi" };
  }

  const orgId = input.orgId.trim().toLowerCase();
  const name = input.name.trim();

  if (!/^[a-z0-9-]+$/.test(orgId)) {
    return { ok: false, status: 400, error: "Org ID hanya boleh huruf kecil, angka, dan tanda strip" };
  }

  if (!name) {
    return { ok: false, status: 400, error: "Nama organisasi wajib diisi" };
  }

  const { adminDb } = getAdminServices();
  const orgRef = adminDb.collection("organizations").doc(orgId);
  const existing = await orgRef.get();

  if (existing.exists) {
    return { ok: false, status: 409, error: "Org ID sudah dipakai" };
  }

  await orgRef.set({ name, createdAt: FieldValue.serverTimestamp() });

  return { ok: true, orgId };
}
