import {
  LayoutDashboard,
  Users,
  Network,
  Wallet,
  CalendarDays,
  UserPlus,
  UserMinus,
  NotebookPen,
  ShieldCheck,
  Building2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/home", icon: LayoutDashboard },
  { label: "Data Anggota", href: "/anggota", icon: Users },
  { label: "Struktur", href: "/struktur", icon: Network },
  { label: "Keuangan", href: "/keuangan", icon: Wallet },
  { label: "Kalender", href: "/kalender", icon: CalendarDays },
  { label: "List VIP", href: "/vip", icon: UserPlus },
  { label: "Laporan CG", href: "/laporan", icon: NotebookPen },
  { label: "Past Member", href: "/alumni", icon: UserMinus },
  { label: "Audit Trail", href: "/audit-trail", icon: ShieldCheck },
  { label: "Organisasi", href: "/admin/organizations", icon: Building2 },
];

const STRUKTUR_HIDDEN_ROLES = new Set(["member", "simpatisan"]);
const ALUMNI_HIDDEN_ROLES = new Set(["sponsor", "member", "simpatisan"]);
const ADMIN_ONLY_HREFS = new Set(["/audit-trail", "/admin/organizations"]);

export function getNavItemsForRole(role: string | null): NavItem[] {
  return ALL_NAV_ITEMS.filter((item) => {
    if (item.href === "/struktur" && role !== null && STRUKTUR_HIDDEN_ROLES.has(role)) {
      return false;
    }
    if (item.href === "/alumni" && role !== null && ALUMNI_HIDDEN_ROLES.has(role)) {
      return false;
    }
    if (ADMIN_ONLY_HREFS.has(item.href) && role !== "admin") {
      return false;
    }
    return true;
  });
}
