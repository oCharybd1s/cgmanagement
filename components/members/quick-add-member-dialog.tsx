"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Loader2 } from "lucide-react";
import type { CgGroup } from "@/lib/cg-groups/types";
import type { Member } from "@/lib/members/types";

export function QuickAddMemberDialog({
  cgGroups,
  viewerRole,
  onCreated,
}: {
  cgGroups: CgGroup[];
  viewerRole: string | null;
  onCreated?: (member: Member) => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const isCoach = viewerRole === "coach";

  React.useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const cgGroupId = String(formData.get("cgGroupId") ?? "").trim();

    if (fullName === "") {
      setError("Nama wajib diisi");
      return;
    }
    if (isCoach && cgGroupId === "") {
      setError("CG wajib dipilih");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/members/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, cgGroupId: isCoach ? cgGroupId : undefined }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal menambah anggota");
        setIsSubmitting(false);
        return;
      }

      onCreated?.(data.member);
      formRef.current?.reset();
      setIsSubmitting(false);
      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi");
      setIsSubmitting(false);
    }
  }

  return (
    <React.Fragment>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        <UserPlus className="h-4 w-4" strokeWidth={2} />
        Tambah Simpatisan
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isSubmitting) setIsOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="quick-add-dialog-title"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2
                  id="quick-add-dialog-title"
                  className="font-display text-lg font-bold tracking-tight text-foreground"
                >
                  Tambah Simpatisan
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  aria-label="Tutup"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
                <p className="text-sm text-muted-foreground">
                  Cukup nama dan No HP. Data ini bisa dinaikkan menjadi Member nanti lewat halaman Struktur.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="quick-add-fullName" className="text-xs font-medium text-muted-foreground">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="quick-add-fullName"
                    name="fullName"
                    type="text"
                    disabled={isSubmitting}
                    className="w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="quick-add-phone" className="text-xs font-medium text-muted-foreground">
                    No HP
                  </label>
                  <input
                    id="quick-add-phone"
                    name="phone"
                    type="tel"
                    disabled={isSubmitting}
                    className="w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 font-mono text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Kalau nama dan No HP cocok dengan data di List VIP, statusnya otomatis diubah jadi Berpotensi.
                  </p>
                </div>

                {isCoach ? (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="quick-add-cgGroupId" className="text-xs font-medium text-muted-foreground">
                      CG <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="quick-add-cgGroupId"
                      name="cgGroupId"
                      disabled={isSubmitting}
                      defaultValue=""
                      className="w-full rounded-full border-[1.5px] border-input bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Pilih CG
                      </option>
                      {cgGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.groupCode}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                <div className="mt-1 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                    className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </React.Fragment>
  );
}
