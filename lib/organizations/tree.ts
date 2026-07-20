import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { isCoach, isCgl } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export type OrganizationTreeMember = {
  id: string;
  fullName: string;
  role: string;
  isBendahara: boolean;
};

export type OrganizationTreeCgGroup = {
  id: string;
  groupCode: string;
  cgl: OrganizationTreeMember | null;
  sponsors: OrganizationTreeMember[];
  members: OrganizationTreeMember[];
  simpatisans: OrganizationTreeMember[];
};

export type OrganizationTree = {
  coach: OrganizationTreeMember | null;
  cgGroups: OrganizationTreeCgGroup[];
};

const TREE_FIELDS = ["fullName", "role", "cgGroupId", "isBendahara"] as const;

export async function getOrganizationTreeForSession(session: SessionUser): Promise<OrganizationTree> {
  if (!session.orgId) {
    return { coach: null, cgGroups: [] };
  }

  if (isCoach(session.role)) {
    return buildFullOrganizationTree(session.orgId);
  }

  if (isCgl(session.role) && session.cgGroupId) {
    return buildSingleCgOrganizationTree(session.orgId, session.cgGroupId);
  }

  return { coach: null, cgGroups: [] };
}

async function buildFullOrganizationTree(orgId: string): Promise<OrganizationTree> {
  const { adminDb } = getAdminServices();
  const orgRef = adminDb.collection("organizations").doc(orgId);

  const [cgGroupsSnapshot, usersSnapshot] = await Promise.all([
    orgRef.collection("cgGroups").get(),
    orgRef.collection("users").select(...TREE_FIELDS).get(),
  ]);

  const cgGroups = cgGroupsSnapshot.docs.map(createEmptyGroup).sort(compareGroups);
  const cgGroupById = new Map(cgGroups.map((group) => [group.id, group]));
  let coach: OrganizationTreeMember | null = null;

  for (const doc of usersSnapshot.docs) {
    const member = toMember(doc);

    if (member.role === "coach") {
      coach = coach ?? member;
      continue;
    }

    const cgGroupId = readString(doc.data().cgGroupId);
    const group = cgGroupId ? cgGroupById.get(cgGroupId) : undefined;
    if (!group) continue;

    assignMemberToGroup(group, member);
  }

  for (const group of cgGroups) {
    sortGroupMembers(group);
  }

  return { coach, cgGroups };
}

async function buildSingleCgOrganizationTree(orgId: string, cgGroupId: string): Promise<OrganizationTree> {
  const { adminDb } = getAdminServices();
  const orgRef = adminDb.collection("organizations").doc(orgId);

  const [cgGroupDoc, cgUsersSnapshot] = await Promise.all([
    orgRef.collection("cgGroups").doc(cgGroupId).get(),
    orgRef.collection("users").where("cgGroupId", "==", cgGroupId).select(...TREE_FIELDS).get(),
  ]);

  if (!cgGroupDoc.exists) {
    return { coach: null, cgGroups: [] };
  }

  const group = createEmptyGroup(cgGroupDoc);

  for (const doc of cgUsersSnapshot.docs) {
    const member = toMember(doc);
    if (member.role === "coach") continue;
    assignMemberToGroup(group, member);
  }

  sortGroupMembers(group);

  return { coach: null, cgGroups: [group] };
}

function createEmptyGroup(doc: FirebaseFirestore.DocumentSnapshot): OrganizationTreeCgGroup {
  return {
    id: doc.id,
    groupCode: readString(doc.data()?.groupCode) ?? doc.id,
    cgl: null,
    sponsors: [],
    members: [],
    simpatisans: [],
  };
}

function compareGroups(a: OrganizationTreeCgGroup, b: OrganizationTreeCgGroup): number {
  return a.groupCode.localeCompare(b.groupCode, "id");
}

function assignMemberToGroup(group: OrganizationTreeCgGroup, member: OrganizationTreeMember): void {
  if (member.role === "cgl") {
    group.cgl = member;
  } else if (member.role === "sponsor") {
    group.sponsors.push(member);
  } else if (member.role === "member") {
    group.members.push(member);
  } else if (member.role === "simpatisan") {
    group.simpatisans.push(member);
  }
}

function sortGroupMembers(group: OrganizationTreeCgGroup): void {
  group.sponsors.sort((a, b) => a.fullName.localeCompare(b.fullName, "id"));
  group.members.sort((a, b) => a.fullName.localeCompare(b.fullName, "id"));
  group.simpatisans.sort((a, b) => a.fullName.localeCompare(b.fullName, "id"));
}

function toMember(doc: FirebaseFirestore.DocumentSnapshot): OrganizationTreeMember {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    fullName: readString(data.fullName) ?? "",
    role: readString(data.role) ?? "",
    isBendahara: data.isBendahara === true,
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
