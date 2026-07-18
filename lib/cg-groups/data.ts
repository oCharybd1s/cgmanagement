import { FieldValue } from "firebase-admin/firestore";
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
      const cglId = typeof data.cglId === "string" ? data.cglId : null;

      return { id: doc.id, groupCode, groupName, cglId };
    })
    .sort((a, b) => a.groupCode.localeCompare(b.groupCode, "id"));
}

export type CreateCgGroupInput = {
  groupCode: string;
  groupName: string;
};

export type CreateCgGroupResult =
  | { ok: true; cgGroup: CgGroup }
  | { ok: false; error: string };

export async function createCgGroup(
  orgId: string,
  uid: string,
  input: CreateCgGroupInput,
): Promise<CreateCgGroupResult> {
  const groupCode = input.groupCode.trim().toUpperCase();
  const groupName = input.groupName.trim();

  if (!groupCode) {
    return { ok: false, error: "Kode CG wajib diisi" };
  }

  if (!groupName) {
    return { ok: false, error: "Nama CG wajib diisi" };
  }

  const { adminDb } = getAdminServices();
  const cgGroupsRef = adminDb.collection("organizations").doc(orgId).collection("cgGroups");

  const existing = await cgGroupsRef.where("groupCode", "==", groupCode).limit(1).get();
  if (!existing.empty) {
    return { ok: false, error: `Kode CG "${groupCode}" sudah dipakai` };
  }

  const docRef = await cgGroupsRef.add({
    groupCode,
    groupName,
    cglId: null,
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, cgGroup: { id: docRef.id, groupCode, groupName, cglId: null } };
}
