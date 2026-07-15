# Brand Guidelines — South Youth Komsel Digital

> Last updated: 10 Juli 2026
> Status: v1 — Global UI Foundation

## Quick Reference

| Element | Value |
|---|---|
| Primary Color | Dusk Indigo — `#463676` (light) / `#afa3e6` (dark) |
| Signature Accent | Ember Spark — `#e9b038` |
| Display Font | Bricolage Grotesque |
| Body/UI Font | Geist Sans |
| Data/Mono Font | Geist Mono |
| Voice | Hangat, jelas, membina — bukan korporat |

---

## 1. Filosofi Visual

South Youth Komsel Digital adalah alat operasional harian untuk pemimpin komsel (Coach, CGL, Sponsor) — bukan situs marketing. Identitas visualnya punya dua elemen dekoratif terpisah dengan peran berbeda:
- **Growth Contours** — garis kontur/elevasi (noise field + marching squares), warna abu netral tetap (`--contour-line`, tidak ikut tema/highlight), dipakai sebagai tekstur latar penuh 1 layar di momen orientasi (layar install PWA, halaman login) dan dasar app icon.
- **Login Blobs** — 5 cincin morphing warna-warni (`--chart-1..5`), elemen dekoratif terpisah khusus di halaman login, mengelilingi kartu form.

Keduanya boleh tampil bersamaan (kontur sebagai lapisan belakang, blob sebagai lapisan tengah di sekitar kartu) tapi masing-masing punya aturan warnanya sendiri — jangan campur highlight Ember Spark ke garis kontur.

Nada keseluruhan: hangat dan personal (karena ini komunitas, bukan korporasi), tapi tetap rapi dan dapat dipercaya (karena menyimpan data pribadi & keuangan jemaat). Kami secara sadar menghindar dari dua klise: (1) palet krem-hangat + serif kontras + aksen terracotta yang sudah terlalu sering dipakai produk-produk AI generik, dan (2) tema gelap generik dengan aksen neon. Sebagai gantinya, palet ini bertumpu pada **indigo senja** (waktu komsel biasa berkumpul) dan **kilau emas hangat** sebagai aksen sinyal/perhatian yang dipakai secukupnya.

## 2. Palet Warna

Semua warna didefinisikan di `app/globals.css` dalam format `oklch()` (mode terang & gelap terpisah). Nilai hex di bawah ini adalah representasi untuk dokumentasi/desain di luar kode.

### Primary — Dusk Indigo

| Nama | Terang | Gelap | Pemakaian |
|---|---|---|---|
| Primary | `#463676` | `#afa3e6` | Tombol utama, link, elemen aktif |
| Primary Foreground | mendekati putih | mendekati indigo pekat | Teks di atas primary |

### Signature Accent — Ember Spark

| Nama | Hex | Pemakaian |
|---|---|---|
| Brand Spark | `#e9b038` | Elemen sinyal/perhatian khusus: ikon toggle tema, titik pusat motif simpul, highlight pencapaian (mis. status spiritual lengkap). **Dipakai secukupnya**, bukan warna tombol utama. |

### Netral

| Nama | Terang | Gelap |
|---|---|---|
| Background | `#fbfaf7` | `#100f18` |
| Foreground | `#1a1a27` | `#f0eee9` |
| Muted Foreground | `#565b66` | — |

### Semantik

| State | Terang | Pemakaian |
|---|---|---|
| Success | `#1b854f` | Transaksi masuk, status aktif |
| Warning | `#e9b038` | Data belum lengkap (NIJ kosong, dsb.), status pending |
| Destructive | `#cc2d32` | Hapus, transaksi keluar, error |

### Aksesibilitas

- Kontras teks-di-atas-background pada kedua mode dijaga di atas rasio 7:1 (level AAA) karena rentang usia pengguna (Coach s.d. Simpatisan) beragam.
- Semua state interaktif (focus ring, hover) memakai token `--ring` / `--sidebar-ring`, bukan warna hardcode, supaya konsisten di kedua tema.

---

## 3. Tipografi

```css
--font-display: 'Bricolage Grotesque';
--font-sans: 'Geist Sans';
--font-mono: 'Geist Mono';
```

| Peran | Font | Pemakaian |
|---|---|---|
| Display | Bricolage Grotesque, bold/black | Judul halaman, heading besar, layar install — dipakai secukupnya di momen-momen penting |
| Body/UI | Geist Sans | Semua teks antarmuka, label, paragraf, tombol |
| Data | Geist Mono, tabular numerals | Nominal kas, tanggal, NIJ, kode CG — supaya angka rapi & mudah dipindai |

Dimuat lewat `next/font/google` di `app/layout.tsx` (self-host otomatis, tetap tersedia offline setelah PWA ter-cache).

---

## 4. Mark / Ikon

Motif kontur pertumbuhan (`components/ui/growth-contours.tsx`, data di `lib/contour-paths.ts`, digenerate lewat `scripts/generate-contours.mjs`) adalah elemen tanda tangan visual: garis-garis organik hasil noise field yang diproses marching squares (`d3-contour`), bukan bentuk acak. Semua garis satu warna abu netral tetap (`--contour-line`, ≈ `#858585`, sama di light/dark — **tidak ada highlight warna**). `preserveAspectRatio="xMidYMid slice"` supaya selalu memenuhi 1 layar penuh (boleh crop, tidak boleh nyisa area kosong). Dipakai sebagai background layar install PWA, background halaman login (bareng Login Blobs di lapisan atasnya), dasar app icon (`scripts/generate-icons.mjs` → `public/icons/`), dan sebagai background bersama di seluruh halaman terautentikasi lewat `AppShell` (`components/layout/app-shell.tsx`) — supaya identitas visual konsisten dari layar login sampai ke dalam aplikasi. App icon statis, tidak ikut tema (wajar, ikon OS tidak reaktif).

---

## 5. Komponen & Bentuk

| Elemen | Radius | Catatan |
|---|---|---|
| Button, Input | `--radius-sm` / `--radius-md` | Mengikuti komponen shadcn (`base-nova`) |
| Card, Panel | `--radius-lg` (0.75rem) | |
| Modal, Install Screen | `--radius-xl` / `--radius-2xl` | |

## 6. Motion

| Token | Durasi | Easing | Pemakaian |
|---|---|---|---|
| `--motion-instant` | 100ms | — | Feedback tekan (press state) |
| `--motion-fast` | 160ms | — | Hover, toggle kecil |
| `--motion-base` | 260ms | `--ease-signature` | Transisi tema, navigasi aktif |
| `--motion-slow` | 420ms | `--ease-out-soft` | Entrance layar penuh (install gate) |

Prinsip: motion dipakai untuk memberi makna (state berubah, item aktif berpindah), bukan hiasan. `prefers-reduced-motion` selalu dihormati (lihat `app/globals.css`).

---

## 7. Suara & Nada

| Sifat | Kami | Bukan Kami |
|---|---|---|
| Hangat | Menyapa seperti sesama pelayan komsel | Kaku, formal berlebihan |
| Jelas | Bahasa Indonesia sehari-hari, to the point | Jargon teknis/korporat |
| Membina | Memandu langkah berikutnya | Menyalahkan saat terjadi error |

Contoh nada error: *"Saldo kas CG belum bisa disimpan. Coba periksa koneksi lalu kirim ulang."* — bukan *"Error 500: transaction failed."*

---

## Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 10 Juli 2026 | Palet, tipografi, motion, dan mark awal — bagian dari Global UI Foundation |
| 1.1 | 15 Juli 2026 | Growth Contours dipakai sebagai background bersama di semua halaman terautentikasi (`AppShell`), tidak lagi eksklusif untuk layar orientasi |