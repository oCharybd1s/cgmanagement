export interface SessionUser {
  uid: string;
  email: string | null;
  role: string | null;
  isSuperAdmin: boolean;
  orgId: string | null;
  cgGroupId: string | null;
  isBendahara: boolean;
  mustChangePassword: boolean;
}
