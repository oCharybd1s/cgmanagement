export type SpiritualMilestone = "msj1" | "msj2" | "msj3" | "baptisSelam" | "baptisRohKudus";

export type MilestoneMember = {
  id: string;
  fullName: string;
  cgGroupId: string | null;
  cgLabel: string;
};

export type MilestoneProgress = {
  key: SpiritualMilestone;
  label: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
  pending: MilestoneMember[];
};

export type CgGroupStat = {
  cgId: string;
  cgLabel: string;
  cglName: string | null;
  totalPeople: number;
  averageAge: number | null;
  youngestAge: number | null;
  oldestAge: number | null;
  balance: number;
  lastMeetingDate: string | null;
  meetingCount90d: number;
};

export type VipReportItem = {
  id: string;
  name: string;
  phone: string | null;
  cgLabel: string;
  status: "pending" | "berpotensi" | "accept" | "reject";
  followUpByName: string | null;
  notes: string | null;
  createdAt: string | null;
};

export type KasReportAccount = {
  accountId: string;
  label: string;
  accountType: "coach" | "cg";
  balance: number;
};

export type OrgOverview = {
  totalPeople: number;
  totalCg: number;
  averageAge: number | null;
  totalBalance: number;
  nijMissingCount: number;
  roleDistribution: { role: string; label: string; count: number }[];
};

export type ComsulReport = {
  overview: OrgOverview;
  cgStats: CgGroupStat[];
  milestones: MilestoneProgress[];
  vipPotential: VipReportItem[];
  vipAllCount: number;
  kasAccounts: KasReportAccount[];
  generatedAt: string;
};
