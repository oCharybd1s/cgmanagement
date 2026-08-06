import { getRoleLabel, isCoach } from "@/lib/auth/roles";
import { listAllMembersForOrg } from "@/lib/members/data";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { getKasAccountsForSession } from "@/lib/kas-accounts/data";
import { getVipProspectsForSession } from "@/lib/vip-prospects/data";
import { getMeetingReportsForSession } from "@/lib/meeting-reports/data";
import { listAllFormerMembersForOrg } from "@/lib/former-members/data";
import type { SessionUser } from "@/lib/auth/types";
import type { Member, SpiritualStatus } from "@/lib/members/types";
import type { CgGroup } from "@/lib/cg-groups/types";
import type { KasAccount } from "@/lib/kas-accounts/types";
import type { VipProspect } from "@/lib/vip-prospects/types";
import type { MeetingReport } from "@/lib/meeting-reports/types";
import type { FormerMember, FormerMemberReason } from "@/lib/former-members/types";
import type {
  ComsulReport,
  CgGroupStat,
  MilestoneMember,
  MilestoneProgress,
  MilestoneGroup,
  SpiritualMilestone,
  VipReportItem,
  KasReportAccount,
  OrgOverview,
  RetentionReport,
  FormerMemberReasonStat,
  BirthdayThisMonthItem,
} from "@/lib/reports/types";

const COACH_CG_LABEL = "Coach";
const UNASSIGNED_CG_LABEL = "Belum ada CG";

const MILESTONE_LABELS: Record<SpiritualMilestone, string> = {
  msj1: "MSJ 1",
  msj2: "MSJ 2",
  msj3: "MSJ 3",
  cgt1: "CGT 1",
  cgt2: "CGT 2",
  cgt3: "CGT 3",
  baptisSelam: "Baptis Selam",
  baptisRohKudus: "Baptis Roh Kudus",
};

const FORMER_MEMBER_REASON_LABELS: Record<FormerMemberReason, string> = {
  graduated: "Lulus",
  moved: "Pindah Kota",
  unresponsive: "Tidak Merespon",
  other: "Lainnya",
};

export async function getComsulReportForSession(session: SessionUser): Promise<ComsulReport | null> {
  if (!session.orgId || !isCoach(session.role)) {
    return null;
  }

  const orgId = session.orgId;
  const cgGroups = await getCgGroupsForOrg(orgId);
  const [members, kasAccounts, vipProspects, meetingReports, formerMembers] = await Promise.all([
    listAllMembersForOrg(orgId),
    getKasAccountsForSession(session, cgGroups),
    getVipProspectsForSession(session),
    getMeetingReportsForSession(session),
    listAllFormerMembersForOrg(orgId),
  ]);

  return buildComsulReport(members, cgGroups, kasAccounts, vipProspects, meetingReports, formerMembers);
}

export function buildComsulReport(
  members: Member[],
  cgGroups: CgGroup[],
  kasAccounts: KasAccount[],
  vipProspects: VipProspect[],
  meetingReports: MeetingReport[],
  formerMembers: FormerMember[],
): ComsulReport {
  const cgLabelById = new Map<string, string>();
  for (const group of cgGroups) {
    cgLabelById.set(group.id, `CG ${group.groupCode}`);
  }

  const cgLabelFor = (cgGroupId: string | null, role?: string) => {
    if (role === "coach") {
      return COACH_CG_LABEL;
    }
    if (!cgGroupId) {
      return UNASSIGNED_CG_LABEL;
    }
    return cgLabelById.get(cgGroupId) ?? UNASSIGNED_CG_LABEL;
  };

  const overview = buildOverview(members, cgGroups, kasAccounts);
  const cgStats = buildCgStats(members, cgGroups, kasAccounts, meetingReports, cgLabelFor);
  const milestones = buildMilestones(members, cgLabelFor);
  const { potential, allCount } = buildVipReport(vipProspects, members, cgLabelFor);
  const kasReportAccounts = buildKasAccounts(kasAccounts, cgLabelFor);
  const retention = buildRetentionReport(members, formerMembers, cgLabelFor);
  const birthdaysThisMonth = buildBirthdaysThisMonth(members, cgLabelFor);

  return {
    overview,
    cgStats,
    milestones,
    vipPotential: potential,
    vipAllCount: allCount,
    kasAccounts: kasReportAccounts,
    retention,
    birthdaysThisMonth,
    generatedAt: new Date().toISOString(),
  };
}

function buildOverview(members: Member[], cgGroups: CgGroup[], kasAccounts: KasAccount[]): OrgOverview {
  const ages = members.map((member) => computeAge(member.birthDate)).filter(isNumber);
  const totalBalance = kasAccounts.reduce((sum, account) => sum + account.balance, 0);
  const nijMissingCount = members.filter((member) => !member.nij).length;

  const roleCounts = new Map<string, number>();
  for (const member of members) {
    roleCounts.set(member.role, (roleCounts.get(member.role) ?? 0) + 1);
  }
  const roleDistribution = Array.from(roleCounts.entries())
    .map(([role, count]) => ({ role, label: getRoleLabel(role), count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalPeople: members.length,
    totalCg: cgGroups.length,
    averageAge: average(ages),
    totalBalance,
    nijMissingCount,
    roleDistribution,
  };
}

function buildCgStats(
  members: Member[],
  cgGroups: CgGroup[],
  kasAccounts: KasAccount[],
  meetingReports: MeetingReport[],
  cgLabelFor: (cgGroupId: string | null, role?: string) => string,
): CgGroupStat[] {
  const balanceByCg = new Map<string, number>();
  for (const account of kasAccounts) {
    if (account.accountType === "cg" && account.refId) {
      balanceByCg.set(account.refId, account.balance);
    }
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoKey = ninetyDaysAgo.toISOString().slice(0, 10);

  return cgGroups
    .map((group) => {
      const cgMembers = members.filter((member) => member.cgGroupId === group.id);
      const ages = cgMembers.map((member) => computeAge(member.birthDate)).filter(isNumber);
      const cgReports = meetingReports.filter((report) => report.cgId === group.id);
      const lastMeetingDate = cgReports.reduce<string | null>((latest, report) => {
        if (!report.meetingDate) {
          return latest;
        }
        if (!latest || report.meetingDate > latest) {
          return report.meetingDate;
        }
        return latest;
      }, null);
      const meetingCount90d = cgReports.filter(
        (report) => report.meetingDate !== null && report.meetingDate >= ninetyDaysAgoKey,
      ).length;
      const cgl = members.find((member) => member.id === group.cglId);

      return {
        cgId: group.id,
        cgLabel: cgLabelFor(group.id),
        cglName: cgl?.fullName ?? null,
        totalPeople: cgMembers.length,
        averageAge: average(ages),
        youngestAge: ages.length > 0 ? Math.min(...ages) : null,
        oldestAge: ages.length > 0 ? Math.max(...ages) : null,
        balance: balanceByCg.get(group.id) ?? 0,
        lastMeetingDate,
        meetingCount90d,
      };
    })
    .sort((a, b) => a.cgLabel.localeCompare(b.cgLabel, "id"));
}

function buildMilestones(
  members: Member[],
  cgLabelFor: (cgGroupId: string | null, role?: string) => string,
): MilestoneProgress[] {
  const eligible = members.filter((member) => member.role !== "coach");

  const msj1Base = eligible;
  const msj2Base = msj1Base.filter((member) => member.spiritualStatus.msj1);
  const msj3Base = msj2Base.filter((member) => member.spiritualStatus.msj2);

  const cgt1Base = eligible;
  const cgt2Base = cgt1Base.filter((member) => member.spiritualStatus.cgt1);
  const cgt3Base = cgt2Base.filter((member) => member.spiritualStatus.cgt2);

  return [
    milestoneProgress("msj1", "msj", msj1Base, "dari total anggota", cgLabelFor),
    milestoneProgress("msj2", "msj", msj2Base, "dari yang sudah MSJ 1", cgLabelFor),
    milestoneProgress("msj3", "msj", msj3Base, "dari yang sudah MSJ 1 & 2", cgLabelFor),
    milestoneProgress("cgt1", "cgt", cgt1Base, "dari total anggota", cgLabelFor),
    milestoneProgress("cgt2", "cgt", cgt2Base, "dari yang sudah CGT 1", cgLabelFor),
    milestoneProgress("cgt3", "cgt", cgt3Base, "dari yang sudah CGT 1 & 2", cgLabelFor),
    milestoneProgress("baptisSelam", "baptis", eligible, "dari total anggota", cgLabelFor),
    milestoneProgress("baptisRohKudus", "baptis", eligible, "dari total anggota", cgLabelFor),
  ];
}

function milestoneProgress(
  key: SpiritualMilestone,
  group: MilestoneGroup,
  base: Member[],
  baseLabel: string,
  cgLabelFor: (cgGroupId: string | null, role?: string) => string,
): MilestoneProgress {
  const statusKey = toStatusKey(key);
  const completed = base.filter((member) => member.spiritualStatus[statusKey]);
  const pending: MilestoneMember[] = base
    .filter((member) => !member.spiritualStatus[statusKey])
    .map((member) => ({
      id: member.id,
      fullName: member.fullName,
      cgGroupId: member.cgGroupId,
      cgLabel: cgLabelFor(member.cgGroupId, member.role),
    }))
    .sort((a, b) => a.cgLabel.localeCompare(b.cgLabel, "id") || a.fullName.localeCompare(b.fullName, "id"));

  return {
    key,
    group,
    label: MILESTONE_LABELS[key],
    baseLabel,
    completedCount: completed.length,
    totalCount: base.length,
    percentage: base.length > 0 ? Math.round((completed.length / base.length) * 100) : 0,
    pending,
  };
}

function toStatusKey(key: SpiritualMilestone): keyof SpiritualStatus {
  return key;
}

function buildVipReport(
  vipProspects: VipProspect[],
  members: Member[],
  cgLabelFor: (cgGroupId: string | null, role?: string) => string,
): { potential: VipReportItem[]; allCount: number } {
  const memberNameById = new Map(members.map((member) => [member.id, member.fullName]));

  const potential = vipProspects
    .filter((prospect) => prospect.status === "pending" || prospect.status === "berpotensi")
    .map((prospect) => ({
      id: prospect.id,
      name: prospect.name,
      phone: prospect.phone,
      cgLabel: cgLabelFor(prospect.cgId),
      status: prospect.status,
      followUpByName: prospect.followUpByUserId
        ? (memberNameById.get(prospect.followUpByUserId) ?? null)
        : null,
      notes: prospect.notes,
      createdAt: prospect.createdAt,
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return { potential, allCount: vipProspects.length };
}

function buildKasAccounts(
  kasAccounts: KasAccount[],
  cgLabelFor: (cgGroupId: string | null, role?: string) => string,
): KasReportAccount[] {
  return kasAccounts
    .filter((account) => account.active)
    .map((account) => ({
      accountId: account.id,
      label: account.accountType === "coach" ? COACH_CG_LABEL : cgLabelFor(account.refId),
      accountType: account.accountType,
      balance: account.balance,
    }))
    .sort((a, b) => {
      if (a.accountType !== b.accountType) {
        return a.accountType === "coach" ? -1 : 1;
      }
      return a.label.localeCompare(b.label, "id");
    });
}

const BIRTH_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

function buildRetentionReport(
  members: Member[],
  formerMembers: FormerMember[],
  cgLabelFor: (cgGroupId: string | null, role?: string) => string,
): RetentionReport {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoKey = ninetyDaysAgo.toISOString().slice(0, 10);

  const leftLast90d = formerMembers.filter(
    (formerMember) => formerMember.leftDate !== null && formerMember.leftDate >= ninetyDaysAgoKey,
  ).length;

  const reasonCounts = new Map<FormerMemberReason, number>();
  for (const formerMember of formerMembers) {
    reasonCounts.set(formerMember.reason, (reasonCounts.get(formerMember.reason) ?? 0) + 1);
  }
  const reasonBreakdown: FormerMemberReasonStat[] = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, label: FORMER_MEMBER_REASON_LABELS[reason], count }))
    .sort((a, b) => b.count - a.count);

  const recentLeavers = formerMembers.slice(0, 8).map((formerMember) => ({
    id: formerMember.id,
    fullName: formerMember.fullName,
    cgLabel: cgLabelFor(formerMember.cgGroupId),
    reasonLabel: FORMER_MEMBER_REASON_LABELS[formerMember.reason],
    leftDate: formerMember.leftDate,
  }));

  return {
    totalActive: members.length,
    totalFormer: formerMembers.length,
    leftLast90d,
    reasonBreakdown,
    recentLeavers,
  };
}

function buildBirthdaysThisMonth(
  members: Member[],
  cgLabelFor: (cgGroupId: string | null, role?: string) => string,
): BirthdayThisMonthItem[] {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;

  return members
    .map((member) => {
      const match = member.birthDate ? BIRTH_DATE_PATTERN.exec(member.birthDate) : null;
      if (!match) {
        return null;
      }
      const month = Number(match[2]);
      if (month !== currentMonth) {
        return null;
      }
      return {
        id: member.id,
        fullName: member.fullName,
        cgLabel: cgLabelFor(member.cgGroupId, member.role),
        day: Number(match[3]),
        age: computeAge(member.birthDate),
      };
    })
    .filter((item): item is BirthdayThisMonthItem => item !== null)
    .sort((a, b) => a.day - b.day);
}

function computeAge(birthDate: string | null): number | null {
  if (!birthDate) {
    return null;
  }
  const match = BIRTH_DATE_PATTERN.exec(birthDate);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const today = new Date();

  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 && age < 130 ? age : null;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function isNumber(value: number | null): value is number {
  return value !== null;
}
