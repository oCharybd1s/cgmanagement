"use client";

import * as React from "react";

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      isOpen,
      toggle: () => setIsOpen((previous) => !previous),
      isMobileNavOpen,
      openMobileNav: () => setIsMobileNavOpen(true),
      closeMobileNav: () => setIsMobileNavOpen(false),
    }),
    [isOpen, isMobileNavOpen],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar harus dipakai di dalam SidebarProvider");
  }
  return context;
}