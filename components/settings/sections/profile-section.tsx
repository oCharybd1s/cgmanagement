"use client";

import * as React from "react";
import { Loader2, Wallet } from "lucide-react";
import { AvatarPicker } from "@/components/settings/avatar-picker";
import { BadgeTooltip } from "@/components/settings/badge-tooltip";
import { getRoleLabel, cgGroupDisplayLabel } from "@/lib/auth/roles";
import type { AvatarId } from "@/components/settings/avatars/avatar-catalog";
import type { Member } from "@/lib/members/types";

function formatBirthDate(birthDate: string | null): string | null {
  if (!birthDate) {
    return null;
  }
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
    return birthDate;
  }
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function RequestOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
        <span className="text-sm text-foreground">{value}</span>
        <button
          type="button"
          disabled
          title="Fitur pengajuan perubahan belum tersedia"
          className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ajukan Perubahan
        </button>
      </div>
    </div>
  );
}

export function ProfileSection({ onAvatarChange }: { onAvatarChange?: (avatarId: string) => void }) {
  const [member, setMember] = React.useState<Member | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isCancelled = false;

    async function loadMember() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch("/api/members/me", { cache: "no-store" });
        const data = await response.json();
        if (isCancelled) {
          return;
        }
        if (!response.ok || !data.ok) {
          setErrorMessage(data.error ?? "Gagal memuat data profil");
          return;
        }
        setMember(data.member as Member);
      } catch {
        if (!isCancelled) {
          setErrorMessage("Tidak bisa menghubungi server. Coba lagi");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMember();
    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleSelectAvatar(avatarId: AvatarId) {
    const response = await fetch("/api/members/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarId }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error ?? "Gagal menyimpan avatar");
    }
    setMember((current) => (current ? { ...current, avatarId } : current));
    onAvatarChange?.(avatarId);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={2.5} />
      </div>
    );
  }

  if (errorMessage || !member) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-sm text-destructive">{errorMessage ?? "Data profil tidak ditemukan"}</p>
      </div>
    );
  }

  const birthLabel = [member.birthPlace, formatBirthDate(member.birthDate)].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Foto Profil</h3>
        <AvatarPicker selectedAvatarId={member.avatarId} onSelect={handleSelectAvatar} />
      </section>

      <div className="h-px bg-border" />

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Data Diri</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Nama Lengkap" value={member.fullName || "-"} />
          <ReadOnlyField label="Tempat, Tanggal Lahir" value={birthLabel || "-"} />
          <ReadOnlyField label="Pelayanan" value={member.pelayanan || "-"} />
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Kontak</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RequestOnlyField label="Email" value={member.email || "-"} />
          <RequestOnlyField label="No HP" value={member.phone || "-"} />
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Info Lainnya</h3>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            {getRoleLabel(member.role)}
          </span>
          <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            {cgGroupDisplayLabel(member.role, member.cgGroupId)}
          </span>
          <BadgeTooltip label="Info NIJ" content="Nomor Induk Jemaat. Bersifat opsional, bisa kosong.">
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
              NIJ: {member.nij ?? "Belum ada"}
            </span>
          </BadgeTooltip>
          {member.isBendahara ? (
            <BadgeTooltip
              label="Info Bendahara"
              content={`Bendahara ${cgGroupDisplayLabel(member.role, member.cgGroupId)}`}
            >
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
                Bendahara
              </span>
            </BadgeTooltip>
          ) : null}
        </div>
      </section>
    </div>
  );
}
