"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, User, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComingSoon } from "@/components/common/coming-soon";
import { SecuritySection } from "@/components/settings/sections/security-section";

type SettingsSection = "profile" | "security";

const SECTIONS: { id: SettingsSection; label: string; title: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", title: "Profile", icon: User },
  { id: "security", label: "Keamanan", title: "Keamanan & Password", icon: KeyRound },
];

export function SettingsModal({
  isOpen,
  onClose,
  defaultSection = "security",
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultSection?: SettingsSection;
}) {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>(defaultSection);

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

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
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
            className="flex h-[600px] max-h-[calc(100vh-2rem)] w-[720px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            <div className="flex w-56 shrink-0 flex-col border-r border-border bg-muted/30 p-3">
              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pengaturan
              </p>
              <nav className="flex flex-col gap-1">
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
                        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200",
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
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
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

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {activeSection === "profile" ? (
                  <ComingSoon
                    icon={User}
                    title="Profile"
                    description="Edit foto profil dan lihat data diri kamu di sini."
                  />
                ) : (
                  <SecuritySection />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
