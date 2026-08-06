import type { DocumentReference } from "firebase-admin/firestore";
import { isCoach, isCgl, isSponsor } from "@/lib/auth/roles";
import { toStringValue } from "@/lib/events/shared";
import type { SessionUser } from "@/lib/auth/types";
import type { EventType } from "@/lib/events/types";
import type { EventFieldErrors } from "@/lib/events/validation";

export type EventScopeResult =
  | { ok: true; targetCgId: string | null; targetUserId: string | null }
  | { ok: false; status: number; error: string; fieldErrors?: EventFieldErrors };

export type EventScopePayload = {
  cgId?: unknown;
  targetUserId?: unknown;
};

export async function resolveEventScope(
  orgRef: DocumentReference,
  session: SessionUser,
  type: EventType,
  payload: EventScopePayload,
): Promise<EventScopeResult> {
  switch (type) {
    case "meeting_one_on_one":
      return resolveOneOnOneScope(orgRef, session, payload);
    case "meeting_cg":
      return resolveCgScopedScope(session, payload, false);
    case "all_ministry":
      return resolveCgScopedScope(session, payload, true);
    case "meeting_cgl":
      return resolveMeetingCglScope(orgRef, session, payload);
    case "all_leader":
    case "all_cgl":
    case "all":
      return { ok: true, targetCgId: null, targetUserId: null };
    case "only_me":
      return { ok: true, targetCgId: null, targetUserId: session.uid };
    default:
      return { ok: false, status: 400, error: "Tipe event tidak dikenali" };
  }
}

async function resolveOneOnOneScope(
  orgRef: DocumentReference,
  session: SessionUser,
  payload: EventScopePayload,
): Promise<EventScopeResult> {
  const targetUserId = toStringValue(payload.targetUserId).trim();

  if (targetUserId === "") {
    return {
      ok: false,
      status: 400,
      error: "Peserta meeting wajib dipilih",
      fieldErrors: { targetUserId: "Peserta meeting wajib dipilih" },
    };
  }

  if (targetUserId === session.uid) {
    return {
      ok: false,
      status: 400,
      error: "Tidak bisa membuat meeting 1 on 1 dengan diri sendiri",
      fieldErrors: { targetUserId: "Tidak bisa membuat meeting 1 on 1 dengan diri sendiri" },
    };
  }

  const targetSnapshot = await orgRef.collection("users").doc(targetUserId).get();

  if (!targetSnapshot.exists) {
    return { ok: false, status: 404, error: "Anggota tujuan tidak ditemukan" };
  }

  const targetData = targetSnapshot.data() ?? {};
  const targetRole = typeof targetData.role === "string" ? targetData.role : null;
  const targetCgId = typeof targetData.cgGroupId === "string" ? targetData.cgGroupId : null;

  if (isCoach(session.role)) {
    return { ok: true, targetCgId, targetUserId };
  }

  if ((isCgl(session.role) || isSponsor(session.role)) && session.cgGroupId) {
    const isAllowedTargetRole = targetRole === "member" || targetRole === "simpatisan";

    if (!isAllowedTargetRole || targetCgId !== session.cgGroupId) {
      return {
        ok: false,
        status: 403,
        error: "Meeting 1 on 1 hanya bisa dibuat dengan member di CG Anda sendiri",
        fieldErrors: { targetUserId: "Pilih member di CG Anda sendiri" },
      };
    }

    return { ok: true, targetCgId, targetUserId };
  }

  return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk membuat meeting 1 on 1" };
}

async function resolveCgScopedScope(
  session: SessionUser,
  payload: EventScopePayload,
  allowOrgWide: boolean,
): Promise<EventScopeResult> {
  if (isCoach(session.role)) {
    const cgId = toStringValue(payload.cgId).trim();

    if (cgId === "") {
      if (allowOrgWide) {
        return { ok: true, targetCgId: null, targetUserId: null };
      }
      return { ok: false, status: 400, error: "CG wajib dipilih", fieldErrors: { cgId: "CG wajib dipilih" } };
    }

    return { ok: true, targetCgId: cgId, targetUserId: null };
  }

  if ((isCgl(session.role) || isSponsor(session.role)) && session.cgGroupId) {
    return { ok: true, targetCgId: session.cgGroupId, targetUserId: null };
  }

  return { ok: false, status: 403, error: "Akun Anda belum terhubung ke CG" };
}

async function resolveMeetingCglScope(
  orgRef: DocumentReference,
  session: SessionUser,
  payload: EventScopePayload,
): Promise<EventScopeResult> {
  if (isCgl(session.role) && session.cgGroupId) {
    return { ok: true, targetCgId: session.cgGroupId, targetUserId: session.uid };
  }

  if (isCoach(session.role)) {
    const targetUserId = toStringValue(payload.targetUserId).trim();

    if (targetUserId === "") {
      return {
        ok: false,
        status: 400,
        error: "CGL wajib dipilih",
        fieldErrors: { targetUserId: "CGL wajib dipilih" },
      };
    }

    const targetSnapshot = await orgRef.collection("users").doc(targetUserId).get();

    if (!targetSnapshot.exists) {
      return { ok: false, status: 404, error: "CGL tidak ditemukan" };
    }

    const targetData = targetSnapshot.data() ?? {};

    if (targetData.role !== "cgl") {
      return {
        ok: false,
        status: 400,
        error: "Target harus seorang CGL",
        fieldErrors: { targetUserId: "Target harus seorang CGL" },
      };
    }

    const targetCgId = typeof targetData.cgGroupId === "string" ? targetData.cgGroupId : null;
    return { ok: true, targetCgId, targetUserId };
  }

  return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk membuat Meeting CGL" };
}
