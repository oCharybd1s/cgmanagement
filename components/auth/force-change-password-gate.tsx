"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, Lock, Eye, EyeOff, ArrowRight, Loader2, LogOut } from "lucide-react";
import { useLogout } from "@/hooks/use-logout";

const MIN_PASSWORD_LENGTH = 6;

export function ForceChangePasswordGate() {
  const router = useRouter();
  const { logout, isLoggingOut } = useLogout();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak sama");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrorMessage(data.error ?? "Gagal mengganti password");
        setIsSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-[min(360px,100%)] flex-col items-center rounded-4xl border border-border bg-card/70 p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-9"
      >
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" strokeWidth={2} />
        </span>

        <h1 className="mb-2 font-display text-[clamp(1.3rem,4vw,1.6rem)] font-bold tracking-tight text-foreground">
          Ganti Password
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Akun kamu masih pakai password sementara. Buat password baru sebelum melanjutkan.
        </p>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
          <div className="relative w-full">
            <span className="pointer-events-none absolute left-4.5 top-1/2 flex h-4.5 w-4.5 -translate-y-1/2 items-center justify-center text-muted-foreground">
              <Lock className="h-full w-full" strokeWidth={2} />
            </span>
            <label htmlFor="newPassword" className="sr-only">
              Password Baru
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Password baru"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              className="w-full rounded-full border-[1.5px] border-input bg-input/40 py-3 pl-11 pr-11 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={isSubmitting}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute right-2.5 top-1/2 flex h-7.5 w-7.5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>

          <div className="relative w-full">
            <span className="pointer-events-none absolute left-4.5 top-1/2 flex h-4.5 w-4.5 -translate-y-1/2 items-center justify-center text-muted-foreground">
              <Lock className="h-full w-full" strokeWidth={2} />
            </span>
            <label htmlFor="confirmPassword" className="sr-only">
              Ulangi Password Baru
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Ulangi password baru"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              className="w-full rounded-full border-[1.5px] border-input bg-input/40 py-3 pl-11 pr-5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {errorMessage ? (
            <p role="alert" className="text-center text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-deep))",
              boxShadow: "0 10px 26px -8px var(--primary)",
            }}
            className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full py-3.5 text-[15px] font-semibold tracking-[0.2px] text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="relative h-4 w-4 animate-spin" strokeWidth={2.5} />
                <span className="relative">Menyimpan...</span>
              </>
            ) : (
              <>
                <span className="relative">Simpan Password Baru</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors duration-200 hover:text-destructive disabled:cursor-not-allowed"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
          {isLoggingOut ? "Keluar..." : "Keluar dari akun"}
        </button>
      </motion.div>
    </div>
  );
}
