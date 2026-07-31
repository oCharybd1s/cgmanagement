import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canDeleteCgGroup } from "@/lib/auth/roles";
import { buildOrganizationLogEntry } from "@/lib/organizations/log";
import { COACH_KAS_ACCOUNT_ID } from "@/lib/kas-accounts/ensure";
import type { FormerMemberReason } from "@/lib/former-members/types";
import type { SessionUser } from "@/lib/auth/types";

export type MemberDisposition =
  | { memberId: string; action: "move"; targetCgGroupId: string }
  | { memberId: string; action: "remove"; formerMemberReason: FormerMemberReason; notes: string | null };

export type DeleteCgGroupInput = {
  reason: string;
  dispositions: MemberDisposition[];
};

export type DeleteCgGroupResult =
  | { ok: true; cgGroupId: string; movedCount: number; removedCount: number; kasBalanceMoved: number }
  | { ok: false; status: number; error: string };

export async function deleteCgGroupForSession(
  session: SessionUser,
  cgGroupId: string,
  input: DeleteCgGroupInput,
): Promise<DeleteCgGroupResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  if (!canDeleteCgGroup(session.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menghapus CG" };
  }

  const trimmedCgGroupId = cgGroupId.trim();
  const reason = input.reason.trim();

  if (!trimmedCgGroupId) {
    return { ok: false, status: 400, error: "CG tidak valid" };
  }

  if (!reason) {
    return { ok: false, status: 400, error: "Alasan penghapusan wajib diisi" };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb, adminAuth } = adminServices;
  const orgRef = adminDb.collection("organizations").doc(session.orgId);
  const cgGroupRef = orgRef.collection("cgGroups").doc(trimmedCgGroupId);

  const cgGroupDoc = await cgGroupRef.get();
  if (!cgGroupDoc.exists) {
    return { ok: false, status: 404, error: "CG tidak ditemukan" };
  }

  const membersSnapshot = await orgRef.collection("users").where("cgGroupId", "==", trimmedCgGroupId).get();
  const memberIds = new Set(membersSnapshot.docs.map((doc) => doc.id));
  const dispositionByMemberId = new Map(input.dispositions.map((item) => [item.memberId, item]));

  if (dispositionByMemberId.size !== memberIds.size) {
    return { ok: false, status: 400, error: "Jumlah keputusan member tidak cocok dengan jumlah member di CG ini" };
  }

  for (const memberId of memberIds) {
    if (!dispositionByMemberId.has(memberId)) {
      return { ok: false, status: 400, error: "Ada member yang belum ditentukan keputusannya" };
    }
  }

  const targetCgGroupIds = new Set(
    input.dispositions
      .filter((item): item is Extract<MemberDisposition, { action: "move" }> => item.action === "move")
      .map((item) => item.targetCgGroupId),
  );

  for (const targetCgGroupId of targetCgGroupIds) {
    if (targetCgGroupId === trimmedCgGroupId) {
      return { ok: false, status: 400, error: "Tidak bisa memindahkan member ke CG yang sedang dihapus" };
    }
    const targetDoc = await orgRef.collection("cgGroups").doc(targetCgGroupId).get();
    if (!targetDoc.exists) {
      return { ok: false, status: 400, error: `CG tujuan "${targetCgGroupId}" tidak ditemukan` };
    }
  }

  const cgGroupData = cgGroupDoc.data() ?? {};
  const cglId = typeof cgGroupData.cglId === "string" ? cgGroupData.cglId : null;

  const kasAccountRef = orgRef.collection("kasAccounts").doc(trimmedCgGroupId);
  const coachKasAccountRef = orgRef.collection("kasAccounts").doc(COACH_KAS_ACCOUNT_ID);
  const kasAccountDoc = await kasAccountRef.get();
  const kasBalance = kasAccountDoc.exists ? Number(kasAccountDoc.data()?.balance ?? 0) : 0;

  const transactionsSnapshot = await orgRef
    .collection("transactions")
    .where("kasAccountId", "==", trimmedCgGroupId)
    .get();

  const formerMemberRefs = new Map<string, FirebaseFirestore.DocumentReference>();
  for (const [memberId, disposition] of dispositionByMemberId) {
    if (disposition.action === "remove") {
      formerMemberRefs.set(memberId, orgRef.collection("formerMembers").doc());
    }
  }

  const logRef = orgRef.collection("organizationLog").doc();
  const now = FieldValue.serverTimestamp();
  let movedCount = 0;
  let removedCount = 0;

  try {
    await adminDb.runTransaction(async (transaction) => {
      for (const doc of membersSnapshot.docs) {
        const memberId = doc.id;
        const disposition = dispositionByMemberId.get(memberId);
        if (!disposition) {
          continue;
        }
        const memberData = doc.data();
        const currentRole = typeof memberData.role === "string" ? memberData.role : null;
        const memberRef = doc.ref;

        if (disposition.action === "move") {
          const isCglBeingMoved = cglId === memberId;
          transaction.update(memberRef, {
            cgGroupId: disposition.targetCgGroupId,
            role: isCglBeingMoved ? "sponsor" : currentRole,
            isBendahara: false,
            updatedBy: session.uid,
            updatedAt: now,
          });
          movedCount += 1;
        } else {
          const formerRef = formerMemberRefs.get(memberId);
          if (!formerRef) {
            continue;
          }
          transaction.set(formerRef, {
            fullName: typeof memberData.fullName === "string" ? memberData.fullName : "",
            phone: typeof memberData.phone === "string" ? memberData.phone : null,
            lastRole: currentRole,
            cgGroupId: trimmedCgGroupId,
            reason: disposition.formerMemberReason,
            notes: disposition.notes,
            leftDate: now,
            originalMemberId: memberId,
          });
          transaction.delete(memberRef);
          removedCount += 1;
        }
      }

      for (const doc of transactionsSnapshot.docs) {
        transaction.delete(doc.ref);
      }

      if (kasAccountDoc.exists) {
        transaction.delete(kasAccountRef);
      }

      if (kasBalance !== 0) {
        transaction.set(
          coachKasAccountRef,
          { balance: FieldValue.increment(kasBalance), updatedAt: now },
          { merge: true },
        );
      }

      transaction.delete(cgGroupRef);

      transaction.set(
        logRef,
        buildOrganizationLogEntry({
          actionType: "delete_cg",
          cgGroupId: trimmedCgGroupId,
          reason,
          changedBy: session.uid,
          metadata: {
            groupCode: typeof cgGroupData.groupCode === "string" ? cgGroupData.groupCode : trimmedCgGroupId,
            memberCount: memberIds.size,
            movedCount,
            removedCount,
            kasBalanceMovedToCoach: kasBalance,
            transactionsDeleted: transactionsSnapshot.size,
            movedTo: input.dispositions
              .filter((item): item is Extract<MemberDisposition, { action: "move" }> => item.action === "move")
              .map((item) => ({ memberId: item.memberId, targetCgGroupId: item.targetCgGroupId })),
          },
        }),
      );
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menghapus CG. Coba lagi." };
  }

  const claimUpdates: Promise<unknown>[] = [];
  for (const [memberId, disposition] of dispositionByMemberId) {
    const memberDoc = membersSnapshot.docs.find((doc) => doc.id === memberId);
    const memberData = memberDoc?.data();

    if (disposition.action === "move") {
      const hasAccount = memberData?.hasAccount !== false;
      if (hasAccount) {
        const isCglBeingMoved = cglId === memberId;
        const currentRole = typeof memberData?.role === "string" ? memberData.role : null;
        claimUpdates.push(
          adminAuth
            .setCustomUserClaims(memberId, {
              role: isCglBeingMoved ? "sponsor" : currentRole,
              orgId: session.orgId,
              cgGroupId: disposition.targetCgGroupId,
              isBendahara: false,
            })
            .catch(() => undefined),
        );
      }
    } else {
      claimUpdates.push(adminAuth.deleteUser(memberId).catch(() => undefined));
    }
  }
  await Promise.allSettled(claimUpdates);

  return { ok: true, cgGroupId: trimmedCgGroupId, movedCount, removedCount, kasBalanceMoved: kasBalance };
}
