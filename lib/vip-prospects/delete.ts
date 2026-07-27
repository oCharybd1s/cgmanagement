import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canDeleteVipProspect } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export type DeleteVipProspectResult =
  | { ok: true; prospectId: string }
  | { ok: false; status: number; error: string };

export async function deleteVipProspectForSession(
  session: SessionUser,
  prospectId: string,
): Promise<DeleteVipProspectResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedProspectId = prospectId.trim();
  if (!trimmedProspectId) {
    return { ok: false, status: 400, error: "Data VIP tidak valid" };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;

  const targetRef = adminDb
    .collection("organizations")
    .doc(session.orgId)
    .collection("vipProspects")
    .doc(trimmedProspectId);

  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    return { ok: false, status: 404, error: "Data VIP tidak ditemukan" };
  }

  const targetData = targetSnap.data() ?? {};
  const targetCgId = typeof targetData.cgId === "string" ? targetData.cgId : null;

  if (!canDeleteVipProspect(session.role, session.cgGroupId, targetCgId)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menghapus data VIP ini" };
  }

  try {
    await targetRef.delete();
  } catch {
    return { ok: false, status: 500, error: "Gagal menghapus data VIP" };
  }

  return { ok: true, prospectId: trimmedProspectId };
}
