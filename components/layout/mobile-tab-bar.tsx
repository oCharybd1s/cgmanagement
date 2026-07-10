"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { primaryNavItems } from "./nav-items";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={2}
              />
              <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
              {isActive ? (
                <motion.span
                  layoutId="mobile-active-dot"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute top-1 h-1 w-1 rounded-full bg-primary"
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
