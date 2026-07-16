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

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/home", icon: LayoutDashboard },
  { label: "Data Anggota", href: "/anggota", icon: Users },
  { label: "Struktur", href: "/struktur", icon: Network },
  { label: "Keuangan", href: "/keuangan", icon: Wallet },
  { label: "Kalender", href: "/kalender", icon: CalendarDays },
  { label: "List VIP", href: "/vip", icon: UserPlus },
  { label: "Laporan CG", href: "/laporan", icon: NotebookPen },
  { label: "Profil", href: "/profil", icon: UserCircle },
];