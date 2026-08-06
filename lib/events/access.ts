import { isCoach, isCgl, isSponsor } from "@/lib/auth/roles";
import { EVENT_TYPES } from "@/lib/events/types";
import type { EventType } from "@/lib/events/types";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting_one_on_one: "Meeting 1 on 1",
  meeting_cg: "Meeting CG",
  meeting_cgl: "Meeting CGL",
  all_leader: "All Leader",
  all_cgl: "All CGL",
  all: "ALL",
  all_ministry: "All Ministry",
  only_me: "Hanya Saya",
};

const ORG_WIDE_EVENT_TYPES: EventType[] = ["all_leader", "all_cgl", "all"];
const SPONSOR_CREATABLE_TYPES: EventType[] = ["meeting_one_on_one", "meeting_cg", "all_ministry", "only_me"];
const CGL_ONLY_CREATABLE_TYPES: EventType[] = ["meeting_cgl", "all_leader", "all_cgl", "all"];

export function isOrgWideEventType(type: EventType): boolean {
  return ORG_WIDE_EVENT_TYPES.includes(type);
}

export function isCgScopedEventType(type: EventType): boolean {
  return type === "meeting_cg" || type === "all_ministry";
}

export function creatableEventTypesForRole(role: string | null): EventType[] {
  if (isCoach(role)) {
    return [...EVENT_TYPES];
  }
  if (isCgl(role)) {
    return [...SPONSOR_CREATABLE_TYPES, ...CGL_ONLY_CREATABLE_TYPES];
  }
  if (isSponsor(role)) {
    return [...SPONSOR_CREATABLE_TYPES];
  }
  return [];
}

export function canCreateEventType(role: string | null, type: EventType): boolean {
  return creatableEventTypesForRole(role).includes(type);
}

export function canCreateAnyEvent(role: string | null): boolean {
  return creatableEventTypesForRole(role).length > 0;
}

export type EventViewerContext = {
  uid: string;
  role: string | null;
  cgGroupId: string | null;
  hasMinistry: boolean;
};

export type EventAccessRecord = {
  type: EventType;
  targetCgId: string | null;
  targetUserId: string | null;
};

export function canViewEvent(viewer: EventViewerContext, event: EventAccessRecord): boolean {
  if (event.type === "only_me") {
    return viewer.uid === event.targetUserId;
  }

  if (isCoach(viewer.role)) {
    return true;
  }

  switch (event.type) {
    case "meeting_one_on_one":
      if (viewer.uid === event.targetUserId) {
        return true;
      }
      return (
        (isSponsor(viewer.role) || isCgl(viewer.role)) &&
        viewer.cgGroupId !== null &&
        viewer.cgGroupId === event.targetCgId
      );
    case "meeting_cg":
      return (
        (isSponsor(viewer.role) || isCgl(viewer.role)) &&
        viewer.cgGroupId !== null &&
        viewer.cgGroupId === event.targetCgId
      );
    case "meeting_cgl":
      return isCgl(viewer.role) && viewer.uid === event.targetUserId;
    case "all_leader":
      return isSponsor(viewer.role) || isCgl(viewer.role);
    case "all_cgl":
      return isCgl(viewer.role);
    case "all":
      return true;
    case "all_ministry":
      if (!viewer.hasMinistry) {
        return false;
      }
      if (event.targetCgId === null) {
        return true;
      }
      return viewer.cgGroupId !== null && viewer.cgGroupId === event.targetCgId;
    default:
      return false;
  }
}

export type EventActorContext = {
  uid: string;
  role: string | null;
  cgGroupId: string | null;
};

export type EventOwnershipRecord = {
  type: EventType;
  targetCgId: string | null;
  createdBy: string;
  createdByRole: string;
};

export function canUpdateEvent(actor: EventActorContext, event: EventOwnershipRecord): boolean {
  if (event.type === "only_me") {
    return actor.uid === event.createdBy;
  }
  if (isCoach(actor.role)) {
    return true;
  }
  if (actor.uid === event.createdBy) {
    return true;
  }
  if (event.createdByRole === "sponsor") {
    return isCgl(actor.role) && actor.cgGroupId !== null && actor.cgGroupId === event.targetCgId;
  }
  if (event.createdByRole === "cgl" && isOrgWideEventType(event.type)) {
    return isCgl(actor.role);
  }
  return false;
}

export function canDeleteEvent(actor: EventActorContext, event: EventOwnershipRecord): boolean {
  if (event.type === "only_me") {
    return actor.uid === event.createdBy;
  }
  if (isCoach(actor.role)) {
    return true;
  }
  if (actor.uid === event.createdBy) {
    return true;
  }
  if (event.createdByRole === "sponsor") {
    return isCgl(actor.role) && actor.cgGroupId !== null && actor.cgGroupId === event.targetCgId;
  }
  return false;
}
