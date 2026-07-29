import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { canCreateEventType } from "@/lib/events/access";
import { resolveEventScope } from "@/lib/events/resolve-scope";
import { validateEventInput, type EventFieldErrors } from "@/lib/events/validation";
import { normalizeOptional, toStringValue } from "@/lib/events/shared";
import { EVENT_TYPES } from "@/lib/events/types";
import type { SessionUser } from "@/lib/auth/types";
import type { EventRecord, EventType } from "@/lib/events/types";

export type CreateEventRequest = {
  name: unknown;
  description: unknown;
  date: unknown;
  time: unknown;
  type: unknown;
  cgId: unknown;
  targetUserId: unknown;
};

export type CreateEventResult =
  | { ok: true; event: EventRecord }
  | { ok: false; status: number; error: string; fieldErrors?: EventFieldErrors };

export async function createEventForSession(
  session: SessionUser,
  payload: Partial<CreateEventRequest>,
): Promise<CreateEventResult> {
  if (!session.orgId || !session.role) {
    return { ok: false, status: 403, error: "Sesi Anda belum terhubung ke organisasi" };
  }

  const type = toEventType(payload.type);

  if (!type) {
    return {
      ok: false,
      status: 400,
      error: "Tipe event wajib dipilih",
      fieldErrors: { type: "Tipe event wajib dipilih" },
    };
  }

  if (!canCreateEventType(session.role, type)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk membuat tipe event ini" };
  }

  const name = toStringValue(payload.name).trim();
  const date = toStringValue(payload.date).trim();
  const time = normalizeOptional(payload.time);
  const description = normalizeOptional(payload.description);

  const fieldErrors = validateEventInput({ name, date, time });

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, error: "Periksa kembali data yang diisi", fieldErrors };
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return { ok: false, status: 500, error: "Konfigurasi server belum lengkap" };
  }
  const { adminDb } = adminServices;
  const orgRef = adminDb.collection("organizations").doc(session.orgId);

  const scope = await resolveEventScope(orgRef, session, type, payload);

  if (!scope.ok) {
    return scope;
  }

  const docRef = orgRef.collection("events").doc();

  try {
    await docRef.set({
      name,
      description,
      date,
      time,
      type,
      targetCgId: scope.targetCgId,
      targetUserId: scope.targetUserId,
      createdBy: session.uid,
      createdByRole: session.role,
      createdAt: FieldValue.serverTimestamp(),
      updatedBy: null,
      updatedAt: null,
    });
  } catch {
    return { ok: false, status: 500, error: "Gagal menyimpan event" };
  }

  return {
    ok: true,
    event: {
      id: docRef.id,
      name,
      description,
      date,
      time,
      type,
      targetCgId: scope.targetCgId,
      targetUserId: scope.targetUserId,
      createdBy: session.uid,
      createdByRole: session.role,
      createdAt: null,
      updatedBy: null,
      updatedAt: null,
    },
  };
}

function toEventType(value: unknown): EventType | null {
  return typeof value === "string" && (EVENT_TYPES as readonly string[]).includes(value)
    ? (value as EventType)
    : null;
}
