import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canDeleteEvent } from "@/lib/events/access";
import { EVENT_TYPES } from "@/lib/events/types";
import type { SessionUser } from "@/lib/auth/types";
import type { EventType } from "@/lib/events/types";

export type DeleteEventResult = { ok: true; eventId: string } | { ok: false; status: number; error: string };

export async function deleteEventForSession(session: SessionUser, eventId: string): Promise<DeleteEventResult> {
  if (!session.orgId) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const trimmedEventId = eventId.trim();
  if (!trimmedEventId) {
    return { ok: false, status: 400, error: "Event tidak valid" };
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
    .collection("events")
    .doc(trimmedEventId);

  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    return { ok: false, status: 404, error: "Event tidak ditemukan" };
  }

  const targetData = targetSnap.data() ?? {};
  const type = toEventType(targetData.type);
  const targetCgId = typeof targetData.targetCgId === "string" ? targetData.targetCgId : null;
  const createdBy = typeof targetData.createdBy === "string" ? targetData.createdBy : "";
  const createdByRole = typeof targetData.createdByRole === "string" ? targetData.createdByRole : "";

  const canDelete = canDeleteEvent(
    { uid: session.uid, role: session.role, cgGroupId: session.cgGroupId },
    { type, targetCgId, createdBy, createdByRole },
  );

  if (!canDelete) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk menghapus event ini" };
  }

  try {
    await targetRef.delete();
  } catch {
    return { ok: false, status: 500, error: "Gagal menghapus event" };
  }

  return { ok: true, eventId: trimmedEventId };
}

function toEventType(value: unknown): EventType {
  return (EVENT_TYPES as readonly string[]).includes(value as string) ? (value as EventType) : "all";
}
