import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canPromoteMember, canDemoteMember, nextRoleUp, nextRoleDown } from "@/lib/auth/roles";
import { EMAIL_REGEX } from "@/lib/members/validation";
import { generateTemporaryPassword, getErrorCode } from "@/lib/members/shared";
import { markLinkedVipProspectAsAccepted } from "@/lib/vip-prospects/auto-link";
import type { SessionUser } from "@/lib/auth/types";

export type PromoteMemberResult =
  | {
      ok: true;
      memberId: string;
      cgGroupId: string;
      oldRole: string;
      newRole: string;
      swappedCglUserId: string | null;
      temporaryPassword: string | null;
    }
  | { ok: false; status: number; error: string; fieldErrors?: { email?: string } };

export type DemoteMemberResult =
  | { ok: true; memberId: string; cgGroupId: string; oldRole: string; newRole: string }
  | { ok: false; status: number; error: string };

export async function promoteMemberForSession(
  session: SessionUser,
  memberId: string,
  email?: string,
): Promise<PromoteMemberResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedMemberId = memberId.trim();
  if (!trimmedMemberId) {
    return { ok: false, status: 400, error: "Anggota belum dipilih" };
  }

  const { adminDb, adminAuth } = getAdminServices();
  const orgRef = adminDb.collection("organizations").doc(session.orgId);
  const memberRef = orgRef.collection("users").doc(trimmedMemberId);
  const memberDoc = await memberRef.get();

  if (!memberDoc.exists) {
    return { ok: false, status: 404, error: "Anggota tidak ditemukan" };
  }

  const memberData = memberDoc.data() ?? {};
  const oldRole = typeof memberData.role === "string" ? memberData.role : null;
  const cgGroupId = typeof memberData.cgGroupId === "string" ? memberData.cgGroupId : null;
  const hasAccount = memberData.hasAccount !== false;

  if (!cgGroupId) {
    return { ok: false, status: 400, error: "Anggota ini belum tergabung di CG mana pun" };
  }

  if (!canPromoteMember(session.role, session.cgGroupId, oldRole, cgGroupId)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menaikkan anggota ini" };
  }

  const newRole = nextRoleUp(oldRole);
  if (!newRole) {
    return { ok: false, status: 400, error: "Anggota ini sudah di tingkatan tertinggi" };
  }

  const now = FieldValue.serverTimestamp();
  const logRef = orgRef.collection("organizationLog").doc();

  if (newRole === "member" && !hasAccount) {
    const trimmedEmail = (email ?? "").trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return {
        ok: false,
        status: 400,
        error: "Email wajib diisi untuk menjadikan anggota ini Member",
        fieldErrors: { email: "Email wajib diisi dengan format yang valid" },
      };
    }

    const temporaryPassword = generateTemporaryPassword();

    try {
      await adminAuth.createUser({ uid: trimmedMemberId, email: trimmedEmail, password: temporaryPassword });
    } catch (error) {
      const code = getErrorCode(error);
      const message = code === "auth/email-already-exists" ? "Email sudah dipakai akun lain" : "Gagal membuat akun anggota";
      return { ok: false, status: 409, error: message, fieldErrors: { email: message } };
    }

    try {
      await adminAuth.setCustomUserClaims(trimmedMemberId, {
        role: newRole,
        orgId: session.orgId,
        cgGroupId,
        isBendahara: false,
        mustChangePassword: true,
      });

      await adminDb.runTransaction(async (transaction) => {
        transaction.update(memberRef, {
          role: newRole,
          email: trimmedEmail,
          hasAccount: true,
          mustChangePassword: true,
          temporaryPasswordPending: temporaryPassword,
          updatedBy: session.uid,
          updatedAt: now,
        });
        transaction.set(logRef, {
          memberId: trimmedMemberId,
          actionType: "promote",
          oldRole,
          newRole,
          cgGroupId,
          previousCglUserId: null,
          reason: null,
          changedBy: session.uid,
          createdAt: now,
        });
      });
    } catch {
      await adminAuth.deleteUser(trimmedMemberId).catch(() => undefined);
      return { ok: false, status: 500, error: "Gagal menyimpan perubahan struktur. Coba lagi." };
    }

    const fullName = typeof memberData.fullName === "string" ? memberData.fullName : "";
    const phone = typeof memberData.phone === "string" ? memberData.phone : null;
    await markLinkedVipProspectAsAccepted(adminDb, session.orgId, trimmedMemberId, cgGroupId, fullName, phone).catch(
      () => undefined,
    );

    return {
      ok: true,
      memberId: trimmedMemberId,
      cgGroupId,
      oldRole: oldRole ?? "",
      newRole,
      swappedCglUserId: null,
      temporaryPassword,
    };
  }

  if (newRole === "cgl") {
    const cgGroupRef = orgRef.collection("cgGroups").doc(cgGroupId);
    const cgGroupDoc = await cgGroupRef.get();
    if (!cgGroupDoc.exists) {
      return { ok: false, status: 404, error: "CG tidak ditemukan" };
    }

    const cgGroupData = cgGroupDoc.data() ?? {};
    const previousCglUserId =
      typeof cgGroupData.cglId === "string" && cgGroupData.cglId ? cgGroupData.cglId : null;
    const previousCglRef = previousCglUserId ? orgRef.collection("users").doc(previousCglUserId) : null;

    try {
      await adminDb.runTransaction(async (transaction) => {
        transaction.update(cgGroupRef, { cglId: trimmedMemberId });
        transaction.update(memberRef, {
          role: newRole,
          isBendahara: false,
          updatedBy: session.uid,
          updatedAt: now,
        });
        if (previousCglRef) {
          transaction.update(previousCglRef, {
            role: "sponsor",
            isBendahara: false,
            updatedBy: session.uid,
            updatedAt: now,
          });
        }
        transaction.set(logRef, {
          memberId: trimmedMemberId,
          actionType: previousCglUserId ? "replace_cgl" : "promote_to_cgl",
          oldRole,
          newRole,
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
      adminAuth.setCustomUserClaims(trimmedMemberId, {
        role: newRole,
        orgId: session.orgId,
        cgGroupId,
        isBendahara: false,
      }),
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

    return {
      ok: true,
      memberId: trimmedMemberId,
      cgGroupId,
      oldRole: oldRole ?? "",
      newRole,
      swappedCglUserId: previousCglUserId,
      temporaryPassword: null,
    };
  }

  try {
    await adminDb.runTransaction(async (transaction) => {
      transaction.update(memberRef, { role: newRole, updatedBy: session.uid, updatedAt: now });
      transaction.set(logRef, {
        memberId: trimmedMemberId,
        actionType: "promote",
        oldRole,
        newRole,
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

  if (hasAccount) {
    await adminAuth
      .setCustomUserClaims(trimmedMemberId, {
        role: newRole,
        orgId: session.orgId,
        cgGroupId,
        isBendahara: memberData.isBendahara === true,
      })
      .catch(() => undefined);
  }

  return {
    ok: true,
    memberId: trimmedMemberId,
    cgGroupId,
    oldRole: oldRole ?? "",
    newRole,
    swappedCglUserId: null,
    temporaryPassword: null,
  };
}

export async function demoteMemberForSession(session: SessionUser, memberId: string): Promise<DemoteMemberResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedMemberId = memberId.trim();
  if (!trimmedMemberId) {
    return { ok: false, status: 400, error: "Anggota belum dipilih" };
  }

  const { adminDb, adminAuth } = getAdminServices();
  const orgRef = adminDb.collection("organizations").doc(session.orgId);
  const memberRef = orgRef.collection("users").doc(trimmedMemberId);
  const memberDoc = await memberRef.get();

  if (!memberDoc.exists) {
    return { ok: false, status: 404, error: "Anggota tidak ditemukan" };
  }

  const memberData = memberDoc.data() ?? {};
  const oldRole = typeof memberData.role === "string" ? memberData.role : null;
  const cgGroupId = typeof memberData.cgGroupId === "string" ? memberData.cgGroupId : null;
  const hasAccount = memberData.hasAccount !== false;

  if (!cgGroupId) {
    return { ok: false, status: 400, error: "Anggota ini belum tergabung di CG mana pun" };
  }

  if (!canDemoteMember(session.role, session.cgGroupId, oldRole, cgGroupId)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menurunkan anggota ini" };
  }

  const newRole = nextRoleDown(oldRole);
  if (!newRole) {
    return { ok: false, status: 400, error: "Anggota ini sudah di tingkatan terendah" };
  }

  const now = FieldValue.serverTimestamp();
  const logRef = orgRef.collection("organizationLog").doc();

  if (oldRole === "cgl") {
    const cgGroupRef = orgRef.collection("cgGroups").doc(cgGroupId);

    try {
      await adminDb.runTransaction(async (transaction) => {
        transaction.update(cgGroupRef, { cglId: null });
        transaction.update(memberRef, { role: newRole, isBendahara: false, updatedBy: session.uid, updatedAt: now });
        transaction.set(logRef, {
          memberId: trimmedMemberId,
          actionType: "demote_cgl",
          oldRole,
          newRole,
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
      .setCustomUserClaims(trimmedMemberId, { role: newRole, orgId: session.orgId, cgGroupId, isBendahara: false })
      .catch(() => undefined);

    return { ok: true, memberId: trimmedMemberId, cgGroupId, oldRole, newRole };
  }

  try {
    await adminDb.runTransaction(async (transaction) => {
      transaction.update(memberRef, { role: newRole, updatedBy: session.uid, updatedAt: now });
      transaction.set(logRef, {
        memberId: trimmedMemberId,
        actionType: "demote",
        oldRole,
        newRole,
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

  if (hasAccount) {
    await adminAuth
      .setCustomUserClaims(trimmedMemberId, {
        role: newRole,
        orgId: session.orgId,
        cgGroupId,
        isBendahara: memberData.isBendahara === true,
      })
      .catch(() => undefined);
  }

  return { ok: true, memberId: trimmedMemberId, cgGroupId, oldRole: oldRole ?? "", newRole };
}
