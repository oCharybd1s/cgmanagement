"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

function subscribeNever() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

function useHasMounted() {
  return React.useSyncExternalStore(subscribeNever, getMountedSnapshot, getMountedServerSnapshot);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Ganti tema terang atau gelap"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-border bg-muted p-1 transition-colors duration-300",
        className,
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full shadow-sm",
          isDark ? "bg-primary text-primary-foreground ml-6" : "bg-brand-spark text-brand-spark-foreground ml-0",
        )}
      >
        {mounted ? (
          isDark ? (
            <Moon className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <Sun className="h-3.5 w-3.5" strokeWidth={2.5} />
          )
        ) : null}
      </motion.span>
    </button>
  );
}
