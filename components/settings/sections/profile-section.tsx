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

function EditableContactField({
  label,
  value,
  fieldKey,
  onSave,
}: {
  label: string;
  value: string;
  fieldKey: "email" | "phone";
  onSave: (nextValue: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  function handleEdit() {
    setInputValue(value);
    setError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setInputValue(value);
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(inputValue.trim());
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
          <input
            type={fieldKey === "email" ? "email" : "tel"}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            disabled={isSaving}
            autoFocus
            placeholder={fieldKey === "email" ? "nama@email.com" : "08xxxxxxxxxx"}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
          />
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} /> : null}
              Simpan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
        <span className="text-sm text-foreground">{value || "-"}</span>
        <button
          type="button"
          onClick={handleEdit}
          className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
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

  async function handleSaveContact(fieldKey: "email" | "phone", nextValue: string) {
    if (!member) {
      return;
    }
    const response = await fetch("/api/members/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fieldKey === "email" ? nextValue : member.email,
        phone: fieldKey === "phone" ? nextValue : member.phone,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.fieldErrors?.[fieldKey] ?? data.error ?? "Gagal menyimpan perubahan");
    }
    setMember((current) => (current ? { ...current, email: data.email, phone: data.phone } : current));
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
        <div className="flex flex-col gap-4">
          <EditableContactField
            label="Email"
            value={member.email || ""}
            fieldKey="email"
            onSave={(nextValue) => handleSaveContact("email", nextValue)}
          />
          <EditableContactField
            label="No HP"
            value={member.phone || ""}
            fieldKey="phone"
            onSave={(nextValue) => handleSaveContact("phone", nextValue)}
          />
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
