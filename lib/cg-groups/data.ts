import { getAdminServices } from "@/lib/firebase/firebase-admin";
import type { CgGroup } from "@/lib/cg-groups/types";

export async function getCgGroupsForOrg(orgId: string): Promise<CgGroup[]> {
  const { adminDb } = getAdminServices();
  const snapshot = await adminDb.collection("organizations").doc(orgId).collection("cgGroups").get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const groupCode = typeof data.groupCode === "string" ? data.groupCode : doc.id;
      const groupName = typeof data.groupName === "string" ? data.groupName : "";

      return { id: doc.id, groupCode, groupName };
    })
    .sort((a, b) => a.groupCode.localeCompare(b.groupCode, "id"));
}
