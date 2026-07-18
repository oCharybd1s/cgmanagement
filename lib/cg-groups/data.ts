import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import type { CgGroup } from "@/lib/cg-groups/types";

const CG_CODE_PREFIX = "YS";

export async function getCgGroupsForOrg(orgId: string): Promise<CgGroup[]> {
  const { adminDb } = getAdminServices();
  const snapshot = await adminDb.collection("organizations").doc(orgId).collection("cgGroups").get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const cglId = typeof data.cglId === "string" ? data.cglId : null;

      return { id: doc.id, groupCode: doc.id, cglId };
    })
    .sort((a, b) => a.groupCode.localeCompare(b.groupCode, "id"));
}

export type CreateCgGroupInput = {
  code: string;
};

export type CreateCgGroupResult =
  | { ok: true; cgGroup: CgGroup }
  | { ok: false; error: string };

export async function createCgGroup(
  orgId: string,
  uid: string,
  input: CreateCgGroupInput,
): Promise<CreateCgGroupResult> {
  const digits = input.code.trim();

  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: "Kode CG harus berupa angka, contoh: 41" };
  }

  const groupCode = `${CG_CODE_PREFIX}${digits}`;
  const { adminDb } = getAdminServices();
  const docRef = adminDb.collection("organizations").doc(orgId).collection("cgGroups").doc(groupCode);

  const existing = await docRef.get();
  if (existing.exists) {
    return { ok: false, error: `Kode "${groupCode}" sudah dipakai` };
  }

  try {
    await docRef.create({
      groupCode,
      cglId: null,
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, error: `Kode "${groupCode}" sudah dipakai` };
  }

  return { ok: true, cgGroup: { id: groupCode, groupCode, cglId: null } };
}
