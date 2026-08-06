"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/auth/roles";
import { useLogout } from "@/hooks/use-logout";
import { DemoRoleSwitcher } from "@/components/dev/demo-role-switcher";
import { SettingsModal } from "@/components/settings/settings-modal";
import { findAvatarEntry } from "@/components/settings/avatars/avatar-catalog";
import type { ShellUser } from "@/lib/auth/shell-user";

export function ProfileMenu({ user }: { user?: ShellUser | null }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [avatarId, setAvatarId] = React.useState<string | null>(null);
  const [fullName, setFullName] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { logout, isLoggingOut } = useLogout();

  React.useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/members/me", { cache: "no-store" });
        const data = await response.json();
        if (!isCancelled && response.ok && data.ok) {
          setAvatarId(data.member.avatarId ?? null);
          setFullName(data.member.fullName || null);
        }
      } catch {
        setAvatarId(null);
      }
    }

    loadProfile();
    return () => {
      isCancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const displayName = fullName ?? user?.email ?? "Pengguna";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : null;
  const avatarEntry = findAvatarEntry(avatarId);

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors duration-200 hover:bg-muted"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {avatarEntry ? <avatarEntry.Component /> : (initial ?? <User className="h-4 w-4" strokeWidth={2} />)}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen ? "rotate-180" : "",
            )}
            strokeWidth={2}
          />
        </button>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {avatarEntry ? <avatarEntry.Component /> : (initial ?? <User className="h-4 w-4" strokeWidth={2} />)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(user?.role ?? null)}</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors duration-200 hover:bg-muted"
                >
                  <Settings className="h-4 w-4" strokeWidth={2} />
                  Pengaturan
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  {isLoggingOut ? "Keluar..." : "Keluar"}
                </button>
              </div>

              {user?.canSwitchRole ? (
                <DemoRoleSwitcher currentRole={user.role} currentOrgId={user.orgId} currentCgGroupId={user.cgGroupId} />
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onAvatarChange={setAvatarId}
      />
    </>
  );
}
