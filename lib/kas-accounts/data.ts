import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { isCoach, isCgl, isSponsor, isMember, isSimpatisan } from "@/lib/auth/roles";
import { ensureCoachKasAccount, ensureCgKasAccount, COACH_KAS_ACCOUNT_ID } from "@/lib/kas-accounts/ensure";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import type { SessionUser } from "@/lib/auth/types";
import type { KasAccount } from "@/lib/kas-accounts/types";
import type { CgGroup } from "@/lib/cg-groups/types";

export async function getKasAccountsForSession(
  session: SessionUser,
  cgGroups?: CgGroup[],
): Promise<KasAccount[]> {
  if (!session.orgId) {
    return [];
  }

  const orgId = session.orgId;
  const { adminDb } = getAdminServices();
  const accountsRef = adminDb.collection("organizations").doc(orgId).collection("kasAccounts");

  if (isCoach(session.role)) {
    const groups = cgGroups ?? (await getCgGroupsForOrg(orgId));
    await Promise.all([
      ensureCoachKasAccount(orgId),
      ...groups.map((group) => ensureCgKasAccount(orgId, group.id)),
    ]);
    const snapshot = await accountsRef.get();
    return finalizeKasAccounts(snapshot.docs);
  }

  if (isCgl(session.role) || isMember(session.role)) {
    await ensureCoachKasAccount(orgId);
    const accountIds = [COACH_KAS_ACCOUNT_ID];
    if (session.cgGroupId) {
      await ensureCgKasAccount(orgId, session.cgGroupId);
      accountIds.push(session.cgGroupId);
    }
    const snapshots = await Promise.all(accountIds.map((id) => accountsRef.doc(id).get()));
    return finalizeKasAccounts(snapshots.filter((doc) => doc.exists));
  }

  if (isSponsor(session.role) || isSimpatisan(session.role)) {
    if (!session.cgGroupId) {
      return [];
    }
    await ensureCgKasAccount(orgId, session.cgGroupId);
    const snapshot = await accountsRef.doc(session.cgGroupId).get();
    return snapshot.exists ? finalizeKasAccounts([snapshot]) : [];
  }

  return [];
}

function finalizeKasAccounts(docs: DocumentSnapshot[]): KasAccount[] {
  return docs.map(toKasAccount).sort(compareKasAccounts);
}

function compareKasAccounts(a: KasAccount, b: KasAccount): number {
  if (a.accountType !== b.accountType) {
    return a.accountType === "coach" ? -1 : 1;
  }
  return (a.refId ?? "").localeCompare(b.refId ?? "", "id");
}

function toKasAccount(doc: DocumentSnapshot): KasAccount {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    accountType: data.accountType === "coach" ? "coach" : "cg",
    refId: typeof data.refId === "string" ? data.refId : null,
    balance: typeof data.balance === "number" ? data.balance : 0,
    active: data.active !== false,
  };
}
