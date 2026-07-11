"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, SquarePlus, Download, Sparkles } from "lucide-react";
import { useStandaloneDisplay } from "@/hooks/use-standalone-display";
import { GrowthContours } from "@/components/ui/growth-contours";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function AndroidInstallStep() {
  const [installEvent, setInstallEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = React.useState(false);

  React.useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installEvent) return;
    setInstalling(true);
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstalling(false);
    setInstallEvent(null);
  }

  if (!installEvent) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Buka menu titik tiga di browser, lalu pilih{" "}
        <span className="font-medium text-foreground">&quot;Install app&quot;</span> atau{" "}
        <span className="font-medium text-foreground">&quot;Add to Home screen&quot;</span>.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      disabled={installing}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-200 active:scale-95 disabled:opacity-60"
    >
      <Download className="h-4 w-4" strokeWidth={2.5} />
      {installing ? "Memproses..." : "Install Aplikasi"}
    </button>
  );
}

function IOSInstallSteps() {
  const steps = [
    { icon: Share, text: "Tekan tombol Share di Safari" },
    { icon: SquarePlus, text: 'Pilih "Add to Home Screen"' },
  ];

  return (
    <ol className="flex flex-col gap-3 text-left">
      {steps.map((step, index) => (
        <li
          key={step.text}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            {index + 1}
          </span>
          <step.icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
          <span className="text-sm text-foreground">{step.text}</span>
        </li>
      ))}
    </ol>
  );
}

function InstallScreen({ isIOS }: { isIOS: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-hidden bg-background px-6 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <GrowthContours className="h-full w-full scale-125" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center gap-3"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="h-6 w-6" strokeWidth={2} />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Install dulu, yuk
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          South Youth Komsel berjalan sebagai aplikasi supaya lebih cepat dan bisa kirim notifikasi
          ulang tahun & event langsung ke HP kamu.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-xs"
      >
        {isIOS ? <IOSInstallSteps /> : <AndroidInstallStep />}
      </motion.div>
    </div>
  );
}

export function InstallGate({ children }: { children: React.ReactNode }) {
  const { isReady, isStandalone, isMobileDevice, isIOS } = useStandaloneDisplay();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!isReady ? (
        <motion.div key="checking" className={cn("min-h-dvh bg-background")} />
      ) : isMobileDevice && !isStandalone ? (
        <InstallScreen key="gate" isIOS={isIOS} />
      ) : (
        <React.Fragment key="app">{children}</React.Fragment>
      )}
    </AnimatePresence>
  );
}
