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
  primary?: boolean;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, primary: true },
  { label: "Data Anggota", href: "/anggota", icon: Users, primary: true },
  { label: "Struktur", href: "/struktur", icon: Network },
  { label: "Keuangan", href: "/keuangan", icon: Wallet, primary: true },
  { label: "Kalender", href: "/kalender", icon: CalendarDays, primary: true },
  { label: "List VIP", href: "/vip", icon: UserPlus },
  { label: "Laporan CG", href: "/laporan", icon: NotebookPen },
  { label: "Profil", href: "/profil", icon: UserCircle },
];

export const primaryNavItems = navItems.filter((item) => item.primary);
