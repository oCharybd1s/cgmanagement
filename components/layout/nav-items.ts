import {
  LayoutDashboard,
  Users,
  Network,
  Wallet,
  CalendarDays,
  UserPlus,
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
  { label: "Laporan CG", href: "/laporan", icon: NotebookPen },
  { label: "Profil", href: "/profil", icon: UserCircle },
];

const STRUKTUR_HIDDEN_ROLES = new Set(["member", "simpatisan"]);

export function getNavItemsForRole(role: string | null): NavItem[] {
  if (role !== null && STRUKTUR_HIDDEN_ROLES.has(role)) {
    return ALL_NAV_ITEMS.filter((item) => item.href !== "/struktur");
  }
  return ALL_NAV_ITEMS;
}