# AGENTS.md — cgmanagement (South Youth Komsel Digital)

Instruksi ini berlaku untuk semua AI coding agent (Claude Code, Copilot, dll) yang bekerja di repo ini. Baca sampai habis sebelum menyentuh kode.

---

## 0. Wajib sebelum mulai kerja

Sebelum mengerjakan fungsi baru **atau** memperbaiki fungsi yang sudah ada:

1. **Selalu cek kondisi terbaru repo** di `https://github.com/oCharybd1s/cgmanagement` (branch `main`) sebelum mulai. Jangan berasumsi working directory lokal sudah sama dengan `main` — file, struktur folder, dependency, atau konvensi bisa sudah berubah sejak checkout terakhir.
2. Baca file relevan yang sudah ada di area yang mau disentuh (jangan tulis ulang dari nol kalau sudah ada implementasi serupa).
3. Kalau area yang disentuh menyangkut UI/tema/brand, baca `docs/brand-guidelines.md` dulu.
4. Kalau ragu Next.js 16 / React 19 berperilaku beda dari yang diketahui — lihat catatan di bagian 1.

## 1. Peringatan versi (jangan andalkan ingatan lama)

Repo ini pakai **Next.js 16.2.10** dan **React 19.2.4** — ada breaking changes dibanding versi yang lebih umum dikenal (API, konvensi, struktur file bisa berbeda). Sebelum menulis kode yang menyentuh routing, data fetching, server/client component boundary, atau caching, cek dulu dokumentasi resmi versi yang terpasang (`node_modules/next/dist/docs/` kalau tersedia) dan perhatikan deprecation notice. Jangan asumsikan pola Next.js versi lama otomatis masih berlaku.

## 2. Aturan kode — non-negotiable

- **Tidak ada komentar di dalam kode**, dalam bentuk apa pun (`//`, `/* */`, JSDoc dekoratif, dsb). Kode harus jelas dari penamaan variabel/fungsi, bukan dari komentar.
- Kode harus rapi dan bersih: fungsi kecil dan fokus, penamaan deskriptif, tidak ada dead code, tidak ada `console.log` yang ketinggalan, tidak ada kode yang di-comment-out.
- TypeScript strict — hindari `any`. Tipe eksplisit untuk semua fungsi yang di-export.
- Ikuti konvensi yang sudah ada di file tetangga (import order, penamaan file, struktur komponen) sebelum memperkenalkan pola baru.
- Jalankan `npm run lint` (ESLint) dan `tsc --noEmit` sebelum menganggap suatu perubahan selesai.
- Jangan menambah dependency baru tanpa alasan kuat — cek dulu apakah kebutuhan sudah bisa dipenuhi dependency yang sudah ada di `package.json`.

## 3. Tentang produk

Platform manajemen komsel digital untuk **South Youth (Coach Yuddy)** — migrasi dari kombinasi Google Sheets + web app PHP/MySQL lama ke satu sumber data terpusat di Firestore. Skema data didesain **tenant-ready sejak awal** (semua path mulai dari `organizations/{orgId}`) meski v1 cuma untuk 1 organisasi. Detail lengkap kebutuhan produk ada di PRD (`PRD-Platform-Manajemen-Komsel-Digital.md` — minta ke pemilik repo kalau tidak ada di repo ini).

Modul utama: Data Anggota, Struktur Organisasi, CG Groups, Keuangan (Kas), Events, Calendar & Ulang Tahun, Profil & Status Spiritual, List VIP (baru), Laporan CG (baru), PWA + push notification.

## 4. Tech stack

- **Frontend:** Next.js 16 (App Router) di `app/`, React 19, TypeScript.
- **Styling:** Tailwind CSS v4 + shadcn (`base-nova`), `class-variance-authority`, `tailwind-merge`, `tw-animate-css`.
- **Animasi:** `framer-motion`.
- **Tema:** `next-themes`.
- **Ikon:** `lucide-react`.
- **Backend:** Firebase — Authentication, Firestore (Native mode), Cloud Functions, Cloud Messaging. Client SDK via `firebase`, server-side/admin via `firebase-admin`.
- **Hosting:** Vercel (frontend), Firebase (backend).
- **Struktur folder:** `app/` (routes), `components/`, `hooks/`, `lib/`, `scripts/` (termasuk `generate-icons.mjs`), `docs/`, `public/`.

## 5. Model data (Firestore)

Semua collection di-nest di bawah `organizations/{orgId}`. **Tidak pernah** membuat collection top-level baru di luar pola ini tanpa alasan arsitektural yang didiskusikan dulu.

```
organizations/{orgId}
organizations/{orgId}/users/{userId}
organizations/{orgId}/cgGroups/{cgId}
organizations/{orgId}/kasAccounts/{accountId}
organizations/{orgId}/transactions/{txId}
organizations/{orgId}/events/{eventId}
organizations/{orgId}/vipProspects/{prospectId}
organizations/{orgId}/meetingReports/{reportId}
organizations/{orgId}/organizationLog/{logId}
```

Field detail per collection mengikuti PRD bagian 5. `custom claims` di Firebase Auth token (`role`, `orgId`, `cgGroupId`) adalah sumber kebenaran untuk otorisasi — bukan field di dokumen user yang bisa berubah tanpa refresh token.

## 6. Role & hak akses

Lima role: `coach`, `cgl`, `sponsor`, `member`, `simpatisan`. Matriks akses per modul mengikuti PRD bagian 3 — jangan menambah atau mengurangi hak akses suatu role tanpa konfirmasi eksplisit, terutama untuk modul baru (List VIP, Laporan CG) yang belum punya preseden dari sistem lama.

Poin yang sering salah diimplementasikan:
- CGL cuma boleh assign status bendahara ke Sponsor **di CG-nya sendiri**, bukan lintas CG.
- Member/Simpatisan melihat kontak (email/No HP) anggota lain dalam bentuk ter-mask, kecuali sesama anggota di CG yang sama.
- CG bersifat sepenuhnya dinamis — jangan pernah hardcode kode CG (`SY1`, `SY37`, dst) di mana pun di kode.

## 7. Firestore Security Rules — status saat ini

`match /users/{userId}` di `firestore.rules` sudah punya rule granular per role. **Collection lain (`cgGroups`, `kasAccounts`, `transactions`, `events`, `vipProspects`, `meetingReports`, `organizationLog`) masih pakai placeholder `allow read, write: if isSignedIn()`** — ini belum mencerminkan matriks akses di bagian 6 dan tidak boleh dianggap final.

Kalau mengerjakan fitur yang menyentuh salah satu collection tersebut: perketat rule-nya sesuai matriks role sebelum fitur dianggap selesai, jangan cuma andalkan pengecekan di client. Jangan mengekspos operasi sensitif (transfer dana, promote/demote, assign bendahara) lewat write langsung dari client kalau seharusnya lewat Cloud Function untuk atomicity/audit trail.

## 8. Keamanan & repo publik

Repo ini **publik** (open source). Aturan ketat berlaku di semua kontribusi:

- **Tidak ada credential, secret, API key privat, atau data nyata** (kode CG asli, ID spreadsheet, nama anggota asli, dsb) yang boleh hardcode di kode, commit history, atau file contoh.
- Semua config sensitif wajib lewat environment variable (lihat `.env.example`), file `.env` aktual harus tetap ter-gitignore.
- Firebase client config (`apiKey` publik dkk) boleh terekspos di browser — proteksi sebenarnya ada di Security Rules — tapi tetap dikelola via env var untuk kerapihan.
- **Tidak ada seed/dummy data apa pun yang menyerupai data asli** di kode maupun fixture test.
- Sebelum push, pastikan tidak ada data sensitif ikut ter-commit (termasuk commit lama kalau kebetulan menyentuh history).

## 9. PWA & notifikasi

- Install gate **wajib** di mobile (deteksi `display-mode: standalone`; kalau belum ter-install, user diarahkan ke layar instalasi, tidak bisa akses fitur apa pun). Di desktop instalasi **opsional**.
- Push notification lewat Firebase Cloud Messaging + service worker, harus tetap muncul meski app tidak dibuka (bukan cuma banner in-app).
- iOS Safari: push baru berfungsi penuh setelah PWA ter-install, dan hanya di versi iOS yang cukup baru — perlu ditest khusus, jangan asumsikan perilaku sama seperti Android/desktop.
- Preferensi notifikasi per kategori bisa di-toggle user di halaman Profil — jangan hilangkan opsi ini saat menambah kategori notifikasi baru.

## 10. Non-tujuan v1 — jangan implementasi tanpa approval eksplisit

- UI onboarding organisasi baru / billing multi-tenant.
- Native mobile app.
- Integrasi otomatis WhatsApp (field No WA tetap data biasa).
- Reporting/BI lanjutan, export otomatis ke Excel/PDF.
- Menjalankan Google Form lama secara paralel.

Kalau task yang diminta menyentuh salah satu di atas, konfirmasi dulu ke pemilik repo sebelum mengerjakan, jangan diam-diam diperluas scope-nya.

## 11. Technical debt yang diketahui

- `app/page.tsx` (health-check Firebase) masih punya lint error `react-hooks/set-state-in-effect` dan API key fallback hardcode — sengaja belum dibersihkan di paket Global UI terakhir, tapi **wajib dibersihkan sebelum repo dianggap production-ready/benar-benar publik**. Kalau task menyentuh file ini, bersihkan sekalian.

## 12. Alur kerja & approval

Development mengikuti fase di PRD (Fondasi → Core Data → Keuangan → Events & Calendar → Fitur Baru → PWA & Notifikasi → Migrasi & Cutover). Jangan mengerjakan fase atau fitur besar di luar urutan/scope yang sedang disepakati tanpa konfirmasi eksplisit dari pemilik repo — dokumen requirement ini masih berstatus draft yang bisa berubah dan approval untuk tiap langkah besar diberikan secara eksplisit, bukan diasumsikan dari draft yang ada.