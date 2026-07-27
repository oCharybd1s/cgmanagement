"use client";

import * as React from "react";
import { Check, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVATAR_CATALOG, getAvatarComponent, type AvatarId } from "@/components/settings/avatars/avatar-catalog";

export function AvatarPicker({
  selectedAvatarId,
  onSelect,
}: {
  selectedAvatarId: string | null;
  onSelect: (avatarId: AvatarId) => Promise<void>;
}) {
  const [pendingAvatarId, setPendingAvatarId] = React.useState<AvatarId | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSelect(avatarId: AvatarId) {
    if (avatarId === selectedAvatarId || pendingAvatarId) {
      return;
    }
    setErrorMessage(null);
    setPendingAvatarId(avatarId);
    try {
      await onSelect(avatarId);
    } catch {
      setErrorMessage("Gagal menyimpan avatar. Coba lagi");
    } finally {
      setPendingAvatarId(null);
    }
  }

  const CurrentAvatar = getAvatarComponent(selectedAvatarId);
  const isSaving = pendingAvatarId !== null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
        {CurrentAvatar ? (
          <CurrentAvatar />
        ) : (
          <User className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
        )}
        {isSaving ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" strokeWidth={2.5} />
          </span>
        ) : null}
      </div>

      <div className="flex w-full gap-2.5 overflow-x-auto px-1 pb-1">
        {AVATAR_CATALOG.map((avatar) => {
          const isSelected = avatar.id === selectedAvatarId;
          const AvatarImage = avatar.Component;

          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => handleSelect(avatar.id)}
              disabled={isSaving}
              aria-label={avatar.label}
              aria-pressed={isSelected}
              title={avatar.label}
              className={cn(
                "relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
              )}
            >
              <AvatarImage />
              {isSelected ? (
                <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2 w-2" strokeWidth={4} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

