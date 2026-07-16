"use client";

import Image from "next/image";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProfileMenu } from "@/components/auth/profile-menu";

type TopbarUser = {
  email: string | null;
  role: string | null;
};

export function Topbar({
  title,
  user,
  showBrand = false,
}: {
  title?: string;
  user?: TopbarUser | null;
  showBrand?: boolean;
}) {
  const { isOpen, toggle, openMobileNav } = useSidebar();

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        type="button"
        onClick={openMobileNav}
        aria-label="Buka menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground lg:hidden"
      >
        <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"}
        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground lg:inline-flex"
      >
        {isOpen ? (
          <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={2} />
        ) : (
          <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={2} />
        )}
      </button>

      <div className="flex min-w-0 flex-1 items-center">
        {showBrand ? (
          <Image
            src="/logo-mark.png"
            alt="Coach Steve"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full"
          />
        ) : (
          <h1 className="truncate font-display text-base font-bold tracking-tight text-foreground">
            {title}
          </h1>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <ProfileMenu user={user} />
      </div>
    </header>
  );
}