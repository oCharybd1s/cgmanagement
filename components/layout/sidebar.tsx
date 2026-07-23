"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { useSidebar } from "./sidebar-context";

const SIDEBAR_WIDTH_EXPANDED = 256;
const SIDEBAR_WIDTH_COLLAPSED = 80;

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();

  return (
    <motion.aside
      animate={{ width: isOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      className="hidden shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar lg:block"
    >
      <div className="flex h-full w-full flex-col">
        <Link
          href="/home"
          className={cn(
            "flex h-16 shrink-0 items-center gap-2.5",
            isOpen ? "px-6" : "justify-center",
          )}
        >
          <Image
            src="/logo-mark.png"
            alt="CoachApp"
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0 rounded-full"
          />
          <AnimatePresence initial={false}>
            {isOpen ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap font-display text-lg font-bold tracking-tight text-sidebar-foreground"
              >
                CoachApp
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isOpen ? undefined : item.label}
                aria-label={item.label}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors duration-200",
                  isOpen ? "px-3" : "justify-center px-0",
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
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10 whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}
