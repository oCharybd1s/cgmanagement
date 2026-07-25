import {
  LayoutDashboard,
  Users,
  Network,
  Wallet,
  CalendarDays,
  UserPlus,
  UserMinus,
  NotebookPen,
  UserCircle,
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
  { label: "Past Member", href: "/alumni", icon: UserMinus },
  { label: "Laporan CG", href: "/laporan", icon: NotebookPen },
  { label: "Profil", href: "/profil", icon: UserCircle },
];

const HIDDEN_ROLES_BY_HREF: Record<string, Set<string>> = {
  "/struktur": new Set(["member", "simpatisan"]),
  "/alumni": new Set(["sponsor", "member", "simpatisan"]),
};

export function getNavItemsForRole(role: string | null): NavItem[] {
  return ALL_NAV_ITEMS.filter((item) => {
    const hiddenRoles = HIDDEN_ROLES_BY_HREF[item.href];
    if (!hiddenRoles) {
      return true;
    }
    return role === null || !hiddenRoles.has(role);
  });
}