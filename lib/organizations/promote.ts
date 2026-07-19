import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canViewOrganizationTree, isCgl } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export type PromoteToCglInput = {
  cgGroupId: string;
  memberId: string;
};

export type PromoteToCglResult =
  | { ok: true; cgGroupId: string; newCglUserId: string; previousCglUserId: string | null }
  | { ok: false; status: number; error: string };

export type DemoteCglInput = {
  cgGroupId: string;
};

export type DemoteCglResult =
  | { ok: true; cgGroupId: string; demotedUserId: string }
  | { ok: false; status: number; error: string };

export async function promoteToCglForSession(
  session: SessionUser,
  input: PromoteToCglInput,
): Promise<PromoteToCglResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canViewOrganizationTree(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mengubah struktur organisasi" };
  }

  const cgGroupId = input.cgGroupId.trim();
  const newCglUserId = input.memberId.trim();

  if (!cgGroupId || !newCglUserId) {
    return { ok: false, status: 400, error: "CG dan calon CGL wajib dipilih" };
  }

  if (isCgl(session.role) && session.cgGroupId !== cgGroupId) {
    return { ok: false, status: 403, error: "Anda hanya bisa mengubah struktur CG Anda sendiri" };
  }

  const { adminDb, adminAuth } = getAdminServices();
  const orgRef = adminDb.collection("organizations").doc(session.orgId);
  const cgGroupRef = orgRef.collection("cgGroups").doc(cgGroupId);
  const newCglRef = orgRef.collection("users").doc(newCglUserId);

  const [cgGroupDoc, newCglDoc] = await Promise.all([cgGroupRef.get(), newCglRef.get()]);

  if (!cgGroupDoc.exists) {
    return { ok: false, status: 404, error: "CG tidak ditemukan" };
  }

  if (!newCglDoc.exists) {
    return { ok: false, status: 404, error: "Anggota yang dipilih tidak ditemukan" };
  }

  const newCglData = newCglDoc.data() ?? {};
  if (newCglData.cgGroupId !== cgGroupId) {
    return { ok: false, status: 400, error: "Anggota yang dipilih bukan bagian dari CG ini" };
  }

  if (newCglData.role !== "sponsor") {
    return { ok: false, status: 400, error: "Hanya Sponsor di CG ini yang bisa dijadikan CGL" };
  }

  const cgGroupData = cgGroupDoc.data() ?? {};
  const previousCglUserId = typeof cgGroupData.cglId === "string" && cgGroupData.cglId ? cgGroupData.cglId : null;

  if (previousCglUserId === newCglUserId) {
    return { ok: false, status: 400, error: "Anggota ini sudah menjadi CGL di CG tersebut" };
  }

  const now = FieldValue.serverTimestamp();
  const logRef = orgRef.collection("organizationLog").doc();
  const previousCglRef = previousCglUserId ? orgRef.collection("users").doc(previousCglUserId) : null;

  try {
    await adminDb.runTransaction(async (transaction) => {
      transaction.update(cgGroupRef, { cglId: newCglUserId });
      transaction.update(newCglRef, { role: "cgl", isBendahara: false, updatedBy: session.uid, updatedAt: now });

      if (previousCglRef) {
        transaction.update(previousCglRef, { role: "sponsor", isBendahara: false, updatedBy: session.uid, updatedAt: now });
      }

      transaction.set(logRef, {
        memberId: newCglUserId,
        actionType: previousCglUserId ? "replace_cgl" : "promote_to_cgl",
        oldRole: "sponsor",
        newRole: "cgl",
        cgGroupId,
        previousCglUserId,
        reason: null,
        changedBy: session.uid,
        createdAt: now,
      });
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan perubahan struktur. Coba lagi." };
  }

  const claimUpdates = [
    adminAuth.setCustomUserClaims(newCglUserId, { role: "cgl", orgId: session.orgId, cgGroupId, isBendahara: false }),
  ];

  if (previousCglUserId) {
    claimUpdates.push(
      adminAuth.setCustomUserClaims(previousCglUserId, {
        role: "sponsor",
        orgId: session.orgId,
        cgGroupId,
        isBendahara: false,
      }),
    );
  }

  await Promise.allSettled(claimUpdates);

  return { ok: true, cgGroupId, newCglUserId, previousCglUserId };
}

export async function demoteCglForSession(session: SessionUser, input: DemoteCglInput): Promise<DemoteCglResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canViewOrganizationTree(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mengubah struktur organisasi" };
  }

  const cgGroupId = input.cgGroupId.trim();
  if (!cgGroupId) {
    return { ok: false, status: 400, error: "CG wajib dipilih" };
  }

  if (isCgl(session.role) && session.cgGroupId !== cgGroupId) {
    return { ok: false, status: 403, error: "Anda hanya bisa mengubah struktur CG Anda sendiri" };
  }

  const { adminDb, adminAuth } = getAdminServices();
  const orgRef = adminDb.collection("organizations").doc(session.orgId);
  const cgGroupRef = orgRef.collection("cgGroups").doc(cgGroupId);

  const cgGroupDoc = await cgGroupRef.get();
  if (!cgGroupDoc.exists) {
    return { ok: false, status: 404, error: "CG tidak ditemukan" };
  }

  const cgGroupData = cgGroupDoc.data() ?? {};
  const currentCglId = typeof cgGroupData.cglId === "string" ? cgGroupData.cglId : "";

  if (!currentCglId) {
    return { ok: false, status: 400, error: "CG ini belum memiliki CGL" };
  }

  const cglRef = orgRef.collection("users").doc(currentCglId);
  const now = FieldValue.serverTimestamp();
  const logRef = orgRef.collection("organizationLog").doc();

  try {
    await adminDb.runTransaction(async (transaction) => {
      transaction.update(cgGroupRef, { cglId: null });
      transaction.update(cglRef, { role: "sponsor", isBendahara: false, updatedBy: session.uid, updatedAt: now });
      transaction.set(logRef, {
        memberId: currentCglId,
        actionType: "demote_cgl",
        oldRole: "cgl",
        newRole: "sponsor",
        cgGroupId,
        previousCglUserId: null,
        reason: null,
        changedBy: session.uid,
        createdAt: now,
      });
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan perubahan struktur. Coba lagi." };
  }

  await adminAuth
    .setCustomUserClaims(currentCglId, { role: "sponsor", orgId: session.orgId, cgGroupId, isBendahara: false })
    .catch(() => undefined);

  return { ok: true, cgGroupId, demotedUserId: currentCglId };
}
