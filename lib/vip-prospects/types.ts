export type VipProspectStatus = "pending" | "accept" | "reject";

export type VipProspect = {
  id: string;
  name: string;
  phone: string | null;
  cgId: string | null;
  followUpByUserId: string | null;
  status: VipProspectStatus;
  notes: string | null;
  createdBy: string | null;
};
