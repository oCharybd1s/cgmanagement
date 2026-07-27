import { ShieldOff } from "lucide-react";

export function LaporanAccessDenied() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShieldOff className="h-5 w-5" strokeWidth={2} />
      </span>
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
        Akun kamu tidak punya akses ke Laporan CG
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Modul ini hanya bisa diakses oleh Coach, CGL, dan Sponsor. Hubungi Coach kalau menurut kamu ini keliru.
      </p>
    </div>
  );
}
