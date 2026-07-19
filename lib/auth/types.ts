export interface SessionUser {
  uid: string;
  email: string | null;
  role: string | null;
  orgId: string | null;
  cgGroupId: string | null;
  isBendahara: boolean;
}
