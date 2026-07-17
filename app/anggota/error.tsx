"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AnggotaError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" strokeWidth={2} />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          Data anggota belum bisa dimuat
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Coba periksa koneksi lalu muat ulang halaman ini.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={unstable_retry}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
        >
          Muat ulang
        </button>
        <Link
          href="/home"
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
