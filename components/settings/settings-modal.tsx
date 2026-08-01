"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, User, Bell, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { canBroadcastNotification } from "@/lib/auth/roles";
import { ProfileSection } from "@/components/settings/sections/profile-section";
import { SecuritySection } from "@/components/settings/sections/security-section";
import { NotificationSection } from "@/components/settings/sections/notification-section";

type SettingsSection = "profile" | "security" | "notifications";

const SECTIONS: { id: SettingsSection; label: string; title: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", title: "Profile", icon: User },
  { id: "security", label: "Keamanan", title: "Keamanan & Password", icon: KeyRound },
  { id: "notifications", label: "Notifikasi", title: "Notifikasi", icon: Bell },
];

export function SettingsModal({
  isOpen,
  onClose,
  defaultSection = "profile",
  onAvatarChange,
  viewerRole = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultSection?: SettingsSection;
  onAvatarChange?: (avatarId: string) => void;
  viewerRole?: string | null;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<SettingsSection>(defaultSection);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setActiveSection(defaultSection);
    }
  }, [isOpen, defaultSection]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const activeSectionData = SECTIONS.find((section) => section.id === activeSection) ?? SECTIONS[0];

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-0 backdrop-blur-sm sm:p-4"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="flex h-[100dvh] w-full flex-col overflow-hidden border-border bg-card shadow-2xl sm:h-[600px] sm:max-h-[calc(100dvh-2rem)] sm:w-[720px] sm:max-w-[calc(100vw-2rem)] sm:flex-row sm:rounded-3xl sm:border"
          >
            <div className="flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-border bg-muted/30 p-2 sm:w-56 sm:flex-col sm:items-stretch sm:gap-1 sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3">
              <p className="hidden px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:block">
                Pengaturan
              </p>
              <nav className="flex flex-row gap-1 sm:flex-col">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      aria-current={isActive}
                      className={cn(
                        "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                <h2
                  id="settings-modal-title"
                  className="font-display text-lg font-bold tracking-tight text-foreground"
                >
                  {activeSectionData.title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                {activeSection === "profile" ? (
                  <ProfileSection onAvatarChange={onAvatarChange} />
                ) : activeSection === "security" ? (
                  <SecuritySection />
                ) : (
                  <NotificationSection canBroadcast={canBroadcastNotification(viewerRole)} />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
