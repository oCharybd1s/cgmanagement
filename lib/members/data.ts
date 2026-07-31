import { Timestamp } from "firebase-admin/firestore";
import type { QueryDocumentSnapshot, QuerySnapshot } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import {
  hasFullMemberDirectoryAccess,
  isSponsor,
  isMember,
  isSimpatisan,
  memberDirectoryFieldScope,
} from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";
import type { Member, SpiritualStatus } from "@/lib/members/types";
import { compareMembersForDirectory } from "@/lib/members/sort";

const FULL_FIELDS = [
  "fullName",
  "role",
  "cgGroupId",
  "nij",
  "address",
  "birthPlace",
  "birthDate",
  "email",
  "phone",
  "isBendahara",
  "mustChangePassword",
  "hasAccount",
  "spiritualStatus",
  "pelayanan",
] as const;

const BASIC_FIELDS = ["fullName", "phone"] as const;

export async function getMembersForSession(session: SessionUser): Promise<Member[]> {
  if (!session.orgId) {
    return [];
  }

  const { adminDb } = getAdminServices();
  const usersRef = adminDb.collection("organizations").doc(session.orgId).collection("users");
  const fields = memberDirectoryFieldScope(session.role) === "full" ? FULL_FIELDS : BASIC_FIELDS;

  if (hasFullMemberDirectoryAccess(session.role)) {
    const snapshot = await usersRef.select(...fields).get();
    return finalizeMembers(snapshot.docs);
  }

  if (!session.cgGroupId) {
    return [];
  }

  if (isSponsor(session.role) || isMember(session.role)) {
    const [ownCg, coach] = await Promise.all([
      usersRef.where("cgGroupId", "==", session.cgGroupId).select(...fields).get(),
      usersRef.where("role", "==", "coach").select(...fields).get(),
    ]);
    return finalizeMembers(mergeUnique(ownCg, coach));
  }

  if (isSimpatisan(session.role)) {
    const snapshot = await usersRef.where("cgGroupId", "==", session.cgGroupId).select(...fields).get();
    return finalizeMembers(snapshot.docs);
  }

  return [];
}

export async function listAllMembersForOrg(orgId: string): Promise<Member[]> {
  const { adminDb } = getAdminServices();
  const usersRef = adminDb.collection("organizations").doc(orgId).collection("users");
  const snapshot = await usersRef.select(...FULL_FIELDS).get();
  return finalizeMembers(snapshot.docs);
}

export async function getOwnMemberForSession(session: SessionUser): Promise<Member | null> {
  if (!session.orgId) {
    return null;
  }

  const { adminDb } = getAdminServices();
  const userRef = adminDb.collection("organizations").doc(session.orgId).collection("users").doc(session.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    return null;
  }

  return toMember(snapshot.id, snapshot.data() ?? {});
}

const DIRECTORY_ROLES = new Set(["coach", "cgl", "sponsor", "member", "simpatisan"]);

function finalizeMembers(docs: QueryDocumentSnapshot[]): Member[] {
  return docs
    .filter((doc) => isDirectoryRole(doc.data().role))
    .map((doc) => toMember(doc.id, doc.data()))
    .sort(compareMembersForDirectory);
}

function isDirectoryRole(value: unknown): boolean {
  return typeof value === "string" && DIRECTORY_ROLES.has(value);
}

function mergeUnique(...snapshots: QuerySnapshot[]): QueryDocumentSnapshot[] {
  const byId = new Map<string, QueryDocumentSnapshot>();
  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      byId.set(doc.id, doc);
    }
  }
  return Array.from(byId.values());
}

function toMember(id: string, data: FirebaseFirestore.DocumentData): Member {
  return {
    id,
    fullName: readString(data.fullName) ?? "",
    role: readString(data.role) ?? "",
    cgGroupId: readString(data.cgGroupId),
    nij: readString(data.nij),
    address: readString(data.address),
    birthPlace: readString(data.birthPlace),
    birthDate: toDateLabel(data.birthDate),
    email: readString(data.email),
    phone: readString(data.phone),
    isBendahara: data.isBendahara === true,
    mustChangePassword: data.mustChangePassword === true,
    hasAccount: data.hasAccount !== false,
    spiritualStatus: toSpiritualStatus(data.spiritualStatus),
    pelayanan: readString(data.pelayanan),
    avatarId: readString(data.avatarId),
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toDateLabel(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return readString(value);
}

function toSpiritualStatus(value: unknown): SpiritualStatus {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    baptisSelam: record.baptisSelam === true,
    baptisRohKudus: record.baptisRohKudus === true,
    msj1: record.msj1 === true,
    msj2: record.msj2 === true,
    msj3: record.msj3 === true,
    cgt1: record.cgt1 === true,
    cgt2: record.cgt2 === true,
    cgt3: record.cgt3 === true,
  };
}
