"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrorMessage(data.error ?? "Login gagal. Coba lagi");
        setIsSubmitting(false);
        return;
      }

      const rawNext = searchParams.get("next");
      const nextPath = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";
      router.replace(nextPath);
      router.refresh();
    } catch {
      setErrorMessage("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex w-[min(320px,80%)] flex-col items-center rounded-[2rem] border border-border bg-card/70 p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-9"
    >
      <h1 className="mb-6 font-display text-[clamp(1.4rem,4vw,1.75rem)] font-bold tracking-tight text-foreground">
        Masuk
      </h1>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
        <div className="relative w-full">
          <span className="pointer-events-none absolute left-[18px] top-1/2 flex h-[18px] w-[18px] -translate-y-1/2 items-center justify-center text-muted-foreground">
            <Mail className="h-full w-full" strokeWidth={2} />
          </span>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="username"
            required
            disabled={isSubmitting}
            className="w-full rounded-full border-[1.5px] border-input bg-input/40 py-3 pl-11 pr-5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="relative w-full">
          <span className="pointer-events-none absolute left-[18px] top-1/2 flex h-[18px] w-[18px] -translate-y-1/2 items-center justify-center text-muted-foreground">
            <Lock className="h-full w-full" strokeWidth={2} />
          </span>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            className="w-full rounded-full border-[1.5px] border-input bg-input/40 py-3 pl-11 pr-11 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            disabled={isSubmitting}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-2.5 top-1/2 flex h-[30px] w-[30px] -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
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
          <span
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(120deg, transparent, color-mix(in oklch, white 35%, transparent), transparent)",
            }}
            className="absolute inset-y-0 left-[-60%] w-2/5 -skew-x-[20deg] transition-[left] duration-500 ease-out group-hover:left-[130%]"
          />
          {isSubmitting ? (
            <>
              <Loader2 className="relative h-4 w-4 animate-spin" strokeWidth={2.5} />
              <span className="relative">Memproses...</span>
            </>
          ) : (
            <>
              <span className="relative">Masuk</span>
              <ArrowRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 flex w-full items-center justify-between text-[12.5px]">
        <a href="#" className="text-muted-foreground underline-offset-2 transition-colors duration-200 hover:text-primary hover:underline">
          Lupa password?
        </a>
        <span className="text-muted-foreground/70">Akun dibuat oleh Coach/CGL</span>
      </div>
    </motion.div>
  );
}