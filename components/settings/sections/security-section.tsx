"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, LogOut, ShieldCheck } from "lucide-react";
import { useLogout } from "@/hooks/use-logout";

const MIN_PASSWORD_LENGTH = 6;

export function SecuritySection() {
  const router = useRouter();
  const { logout, isLoggingOut } = useLogout();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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

      setSuccessMessage("Password berhasil diganti");
      formRef.current?.reset();
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setErrorMessage("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ganti Password</h3>
            <p className="text-xs text-muted-foreground">Gunakan password baru untuk masuk ke akun kamu</p>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
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
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p role="status" className="text-sm text-success">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                Menyimpan...
              </>
            ) : (
              "Simpan Password Baru"
            )}
          </button>
        </form>
      </section>

      <div className="h-px bg-border" />

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Keluar dari Akun</h3>
          <p className="text-xs text-muted-foreground">Kamu perlu login ulang untuk masuk lagi ke akun ini</p>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="flex w-fit items-center gap-2 rounded-full border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          {isLoggingOut ? "Keluar..." : "Keluar"}
        </button>
      </section>
    </div>
  );
}
