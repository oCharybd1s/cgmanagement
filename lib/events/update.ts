import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canUpdateEvent } from "@/lib/events/access";
import { validateEventInput, type EventFieldErrors } from "@/lib/events/validation";
import { normalizeOptional, toStringValue } from "@/lib/events/shared";
import { EVENT_TYPES } from "@/lib/events/types";
import type { SessionUser } from "@/lib/auth/types";
import type { EventRecord, EventType } from "@/lib/events/types";

export type UpdateEventRequest = {
  name: unknown;
  description: unknown;
  date: unknown;
  time: unknown;
};

export type UpdateEventResult =
  | { ok: true; event: EventRecord }
  | { ok: false; status: number; error: string; fieldErrors?: EventFieldErrors };

export async function updateEventForSession(
  session: SessionUser,
  eventId: string,
  payload: Partial<UpdateEventRequest>,
): Promise<UpdateEventResult> {
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
  const targetUserId = typeof targetData.targetUserId === "string" ? targetData.targetUserId : null;
  const createdBy = typeof targetData.createdBy === "string" ? targetData.createdBy : "";
  const createdByRole = typeof targetData.createdByRole === "string" ? targetData.createdByRole : "";

  const canUpdate = canUpdateEvent(
    { uid: session.uid, role: session.role, cgGroupId: session.cgGroupId },
    { type, targetCgId, createdBy, createdByRole },
  );

  if (!canUpdate) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk mengubah event ini" };
  }

  const name = toStringValue(payload.name).trim();
  const date = toStringValue(payload.date).trim();
  const time = normalizeOptional(payload.time);
  const description = normalizeOptional(payload.description);

  const fieldErrors = validateEventInput({ name, date, time });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, error: "Periksa kembali data yang diisi", fieldErrors };
  }

  try {
    await targetRef.update({
      name,
      description,
      date,
      time,
      updatedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan perubahan event" };
  }

  return {
    ok: true,
    event: {
      id: trimmedEventId,
      name,
      description,
      date,
      time,
      type,
      targetCgId,
      targetUserId,
      createdBy,
      createdByRole,
      createdAt: toDateLabel(targetData.createdAt),
      updatedBy: session.uid,
      updatedAt: new Date().toISOString(),
    },
  };
}

function toEventType(value: unknown): EventType {
  return (EVENT_TYPES as readonly string[]).includes(value as string) ? (value as EventType) : "all";
}

function toDateLabel(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return typeof value === "string" && value.trim() !== "" ? value : null;
}
