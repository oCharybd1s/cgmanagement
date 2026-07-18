"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { useSidebar } from "./sidebar-context";

export function MobileNav() {
  const pathname = usePathname();
  const { isMobileNavOpen, closeMobileNav } = useSidebar();

  React.useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  React.useEffect(() => {
    if (!isMobileNavOpen) return;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobileNav();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen, closeMobileNav]);

  return (
    <AnimatePresence>
      {isMobileNavOpen ? (
        <React.Fragment>
          <motion.div
            key="mobile-nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={closeMobileNav}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            key="mobile-nav-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(288px,82vw)] flex-col border-r border-sidebar-border bg-sidebar lg:hidden"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex h-16 items-center justify-between gap-2.5 px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <Image
                    src="/logo-mark.png"
                    alt="CoachApp"
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-full"
                />
                <span className="truncate font-display text-base font-bold tracking-tight text-sidebar-foreground">
                    CoachApp
                </span>
                </div>
              <button
                type="button"
                onClick={closeMobileNav}
                aria-label="Tutup menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <X className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
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
                        layoutId="mobile-nav-active-pill"
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
          </motion.div>
        </React.Fragment>
      ) : null}
    </AnimatePresence>
  );
}