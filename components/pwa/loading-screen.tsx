    "use client";

import { motion } from "framer-motion";

const dots = [0, 1, 2];

export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-3"
      >
        <span className="relative flex h-14 w-14 items-center justify-center">
            <img src="/logo-mark-black.svg" alt="CoachApp" className="h-full w-full dark:hidden" />
            <img src="/logo-mark-white.svg" alt="CoachApp" className="hidden h-full w-full dark:block" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
            CoachApp
        </span>
      </motion.div>

      <div className="flex items-center gap-1.5">
        {dots.map((index) => (
          <motion.span
            key={index}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 }}
            className="h-1.5 w-1.5 rounded-full bg-primary"
          />
        ))}
      </div>
    </div>
  );
}