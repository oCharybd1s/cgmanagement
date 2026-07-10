# Global UI Foundation — South Youth Komsel Digital

Paket ini berisi file baru/berubah untuk fondasi Global UI (tema, container, layout, PWA). Sudah diverifikasi lewat `tsc --noEmit` dan `eslint` di atas kondisi repo `cgmanagement` terbaru (Next.js 16, React 19, Tailwind v4, shadcn `base-nova`).

## Cara pasang

1. Copy seluruh folder `app/`, `components/`, `hooks/`, `lib/`, `docs/`, `public/`, `scripts/` ke root repo (menimpa file yang namanya sama: `app/globals.css`, `app/layout.tsx`).
2. Merge `package.json` — tambahkan dependency berikut ke `package.json` kamu (atau timpa langsung, lalu jalankan `npm install`):
   - dependencies: `next-themes`, `framer-motion`, `shadcn`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`
   - devDependencies: `sharp` (dipakai `scripts/generate-icons.mjs`, boleh dihapus setelah generate icon final)
3. `npm install`
4. `npm run dev` — cek `/` untuk lihat halaman health-check existing sudah jalan dengan tema baru.
5. Buka lewat Chrome DevTools → Application → Manifest untuk cek PWA installability, dan test toggle tema.

## Yang sengaja tidak diubah

- `app/page.tsx` (health-check Firebase) — dibiarkan apa adanya, di luar scope Global UI. Catatan: file ini masih mengandung lint error `react-hooks/set-state-in-effect` bawaan (bukan dari perubahan ini) dan API key fallback ter-hardcode — perlu dibersihkan sebelum repo benar-benar publik.
- `components.json`, `tsconfig.json`, `next.config.ts` — konfigurasi existing dihormati apa adanya.

## Regenerasi icon (opsional)

```
npm run generate:icons
```

Meng-generate ulang `public/icons/*.png` dari motif jaringan sel yang sama. Ganti warna di `scripts/generate-icons.mjs` kalau brand berubah.

Detail lengkap token, filosofi warna, tipografi, dan motion: lihat `docs/brand-guidelines.md`.
