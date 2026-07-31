export function isSuperAdminEmail(email: string | null): boolean {
  const allowed = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!allowed || !email) {
    return false;
  }
  return email.trim().toLowerCase() === allowed;
}
