"use client";

import * as React from "react";
import { Building2, Plus, Loader2 } from "lucide-react";
import type { OrganizationSummary } from "@/lib/organizations/data";

export function OrganizationAdminPanel({ initialOrganizations }: { initialOrganizations: OrganizationSummary[] }) {
  const [organizations, setOrganizations] = React.useState(initialOrganizations);
  const [orgId, setOrgId] = React.useState("");
  const [name, setName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!orgId.trim() || !name.trim()) {
      setError("Org ID dan nama wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, name }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Gagal membuat organisasi");
        return;
      }

      setOrganizations((previous) => [{ id: result.orgId, name, createdAt: new Date().toISOString() }, ...previous]);
      setOrgId("");
      setName("");
    } catch {
      setError("Gagal membuat organisasi. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">Organisasi</h2>
        <p className="text-sm text-muted-foreground">Khusus Administrator. Membuat tenant baru di Firestore.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="org-id" className="text-xs font-medium text-muted-foreground">
            Org ID
          </label>
          <input
            id="org-id"
            type="text"
            value={orgId}
            onChange={(event) => setOrgId(event.target.value)}
            disabled={isSubmitting}
            placeholder="south-youth-2"
            className="w-full rounded-xl border-[1.5px] border-input bg-input/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-[3px] focus:ring-ring/25 disabled:opacity-50"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="org-name" className="text-xs font-medium text-muted-foreground">
            Nama Organisasi
          </label>
          <input
            id="org-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
            placeholder="South Youth 2"
            className="w-full rounded-xl border-[1.5px] border-input bg-input/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-[3px] focus:ring-ring/25 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
          Buat
        </button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-2">
        {organizations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-sm text-muted-foreground">Belum ada organisasi</p>
          </div>
        ) : (
          organizations.map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.id}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {org.createdAt ? new Date(org.createdAt).toLocaleDateString("id-ID") : "-"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
