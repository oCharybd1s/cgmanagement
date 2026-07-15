"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <Link href="/home" className="flex h-16 items-center gap-2.5 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-display font-bold">
          S
        </span>
        <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
          South Youth
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="sidebar-active-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-sidebar-primary"
                />
              ) : null}
              <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-sidebar-border px-6 py-4">
        <span className="text-xs text-sidebar-foreground/60">Tema</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}