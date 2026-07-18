"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/types";

export function SessionStatusPanel({
  initialStatus,
}: {
  initialStatus: Pick<SessionUser, "role" | "orgId" | "cgGroupId">;
}) {
  const [status, setStatus] = React.useState(initialStatus);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastCheckedAt, setLastCheckedAt] = React.useState<Date | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function refresh() {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal memuat status sesi");
        return;
      }

      setStatus({
        role: data.user.role,
        orgId: data.user.orgId,
        cgGroupId: data.user.cgGroupId,
      });
      setLastCheckedAt(new Date());
    } catch {
      setError("Tidak bisa menghubungi server");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border p-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status Sesi
        </span>
        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:opacity-60"
        >
          <RefreshCw className={cn("h-3 w-3", isRefreshing ? "animate-spin" : "")} strokeWidth={2} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-1 px-1 text-xs">
        <StatusRow label="Role" value={getRoleLabel(status.role)} ok={status.role !== null} />
        <StatusRow
          label="Org ID"
          value={status.orgId ?? "belum terhubung"}
          ok={status.orgId !== null}
        />
        <StatusRow
          label="CG Group ID"
          value={status.cgGroupId ?? "-"}
          ok={status.cgGroupId !== null || status.role === "coach"}
        />
      </div>

      {error ? <p className="px-1 text-xs text-destructive">{error}</p> : null}

      {lastCheckedAt ? (
        <p className="px-1 text-[11px] text-muted-foreground">
          Diperbarui {lastCheckedAt.toLocaleTimeString("id-ID")}
        </p>
      ) : null}
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono font-medium", ok ? "text-foreground" : "text-destructive")}>{value}</span>
    </div>
  );
}
