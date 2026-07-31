import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canDeleteCgGroup } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export type CgGroupMemberSummary = {
  id: string;
  fullName: string;
  role: string | null;
};

export async function getCgGroupMembersForSession(
  session: SessionUser,
  cgGroupId: string,
): Promise<CgGroupMemberSummary[]> {
  if (!session.orgId || !canDeleteCgGroup(session.role)) {
    return [];
  }

  const { adminDb } = getAdminServices();
  const snapshot = await adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("users")
    .where("cgGroupId", "==", cgGroupId)
    .select("fullName", "role")
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: typeof data.fullName === "string" ? data.fullName : "",
        role: typeof data.role === "string" ? data.role : null,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "id"));
}
