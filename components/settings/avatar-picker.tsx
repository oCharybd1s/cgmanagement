"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVATAR_CATALOG, type AvatarId } from "@/components/settings/avatars/avatar-catalog";

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

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {AVATAR_CATALOG.map((avatar) => {
          const isSelected = avatar.id === selectedAvatarId;
          const isPending = avatar.id === pendingAvatarId;
          const AvatarImage = avatar.Component;

          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => handleSelect(avatar.id)}
              disabled={pendingAvatarId !== null}
              aria-label={avatar.label}
              aria-pressed={isSelected}
              title={avatar.label}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-full border-2 transition-all duration-200 disabled:cursor-not-allowed",
                isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
              )}
            >
              <AvatarImage />
              {isSelected ? (
                <span className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
              {isPending ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" strokeWidth={2.5} />
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
