import { ShieldOff } from "lucide-react";

export function MemberAccessDenied() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShieldOff className="h-5 w-5" strokeWidth={2} />
      </span>
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
        Role akun kamu belum dikenali
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Data Anggota gak bisa ditampilkan karena akun ini belum punya role yang valid. Hubungi
        Coach untuk pengecekan akun.
      </p>
    </div>
  );
}
