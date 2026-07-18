"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { useSidebar } from "./sidebar-context";

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();

  return (
    <motion.aside
      animate={{ width: isOpen ? 256 : 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      className="hidden shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar lg:block"
    >
      <div className="flex h-full w-64 flex-col">
        <Link href="/home" className="flex h-16 items-center gap-2.5 px-6">
          <Image
            src="/logo-mark.png"
            alt="CoachApp"
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0 rounded-full"
          />
          <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
            CoachApp
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
                <Icon className="relative z-10 h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}
