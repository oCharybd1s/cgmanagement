# Catatan patch: fitur "Only Me" + pengetatan firestore.rules

## Isi paket ini

- `lib/events/types.ts`, `lib/events/access.ts`, `lib/events/resolve-scope.ts`,
  `components/calendar/event-type-badge.tsx` — fitur kalender "Only Me" untuk
  Sponsor/CGL/Coach (sama seperti pesan sebelumnya, tidak berubah).
- `firestore.rules` — pengganti penuh untuk seluruh isi file rules, bukan patch
  sebagian. Timpa file `firestore.rules` di project Anda dengan ini, lalu
  deploy manual (`firebase deploy --only firestore:rules` atau lewat Firebase
  Console).

## Cara kerja tiap collection di rules baru

| Collection | Read | Write langsung dari client |
|---|---|---|
| `users` | tidak diubah dari sebelumnya | tidak diubah dari sebelumnya |
| `cgGroups` | semua anggota org (data tidak sensitif) | hanya `create` oleh Coach; `update`/`delete` selalu ditolak (perubahan `cglId` selalu lewat promote/demote yang cascading) |
| `kasAccounts` | sesuai matriks kas (Coach semua, CGL/Member kas Coach + kas CG sendiri, Sponsor/Simpatisan kas CG sendiri) | ditolak total — semua mutasi saldo transaksional lewat Admin SDK |
| `transactions` | sama polanya dengan `kasAccounts`, dicocokkan lewat `kasAccountId` | ditolak total (sama alasan) |
| `events` | mengikuti `canViewEvent` di kode, termasuk privasi `only_me` | `create`/`update`/`delete` direplikasi dari `canCreateEventType`/`resolveEventScope`/`canUpdateEvent`/`canDeleteEvent` |
| `vipProspects` | Coach semua, CGL/Sponsor CG sendiri | `create` oleh Coach/CGL/Sponsor; `update` ikut `canManageVipProspect`; `delete` ikut `canDeleteVipProspect` (Sponsor tidak bisa hapus) |
| `meetingReports` | Coach semua, CGL/Sponsor CG sendiri | `create` oleh Coach/CGL/Sponsor; `update`/`delete` Coach saja (sesuai `canManageMeetingReport`) |
| `organizationLog` | hanya role `admin` (bukan Coach — ini memang perilaku kode saat ini) | ditolak total, selalu ditulis di dalam transaksi promote/demote |
| `formerMembers` | role `coach` (literal, bukan admin) atau CGL CG sendiri | ditolak total, selalu ditulis di dalam transaksi hapus CG / hapus anggota |

Semua collection ini di aplikasi **hanya pernah diakses lewat Admin SDK** (API
route server), tidak ada satu pun `firebase/firestore` client SDK dipakai di
kode (`lib/firebase/firebase.ts` hanya untuk Cloud Messaging). Jadi rules ini
murni defense-in-depth: melindungi dari seseorang yang memakai Firebase client
SDK langsung dari browser dengan token Auth aslinya sendiri, bukan mengubah
perilaku aplikasi yang ada sekarang.

## Yang sengaja TIDAK saya ubah

- Blok `match /users/{userId}` — dipertahankan persis seperti sebelumnya.
  Saya sempat perhatikan rule ini masih mengizinkan Coach/CGL mengubah field
  `role` dan `cgGroupId` secara langsung, padahal di kode promote/demote
  selalu dilakukan lewat transaksi (update `users` + `cgGroups.cglId` +
  `organizationLog` sekaligus). Ini celah lama yang sudah ada sebelum patch
  ini, bukan sesuatu yang saya perkenalkan — saya tidak menyentuhnya karena
  di luar cakupan yang diminta dan berisiko mengganggu bagian yang sudah
  dianggap final. Kalau mau, ini bisa jadi task terpisah.
- Rule tingkat `organizations/{orgId}` (`allow read, write: if isSignedIn();`)
  — saya temukan ini juga membuka `list` semua organisasi (nama org) ke semua
  user yang login, lintas tenant, sejak app menuju multi-tenant. Ini juga
  celah lama yang tidak saya sentuh — di luar 8 collection yang dicek di
  `AGENTS.md` bagian 7.

## Bagian yang disederhanakan (bukan replikasi 100%)

- Validasi target satu-lawan-satu (`meeting_one_on_one`) dan penunjukan CGL
  oleh Coach (`meeting_cgl`) di rules **tidak** melakukan `get()` untuk
  memverifikasi role/CG asli dari `targetUserId` seperti yang dilakukan
  `resolveOneOnOneScope`/`resolveMeetingCglScope` di server. Rules hanya
  memastikan `targetUserId` terisi dan (untuk CGL/Sponsor) `targetCgId` yang
  diklaim sama dengan CG milik sendiri. Kalau seseorang bypass app dan
  menulis langsung, hasil terburuknya adalah data event yang tidak akurat
  (menunjuk ke orang di CG lain), bukan kebocoran akses ke data milik CG lain
  — karena visibilitasnya tetap dikontrol oleh `targetCgId`/`targetUserId`
  yang tersimpan, bukan oleh CG asli si target.
- Validasi field di rules hanya mencakup yang penting untuk keamanan/relasi
  (nama, tanggal, cgId, dsb.), bukan seluruh aturan UX seperti batas 120
  karakter nama event. Rules bukan tempat validasi kualitas data — itu tetap
  tanggung jawab route Admin SDK yang sudah ada.

## Belum diuji di emulator

Sandbox ini tidak punya akses jaringan ke domain Firebase (emulator,
`firebase deploy`, dsb. — hanya npm/PyPI/GitHub yang diizinkan), jadi rules
ini **belum pernah dijalankan** terhadap Firestore sungguhan atau emulator.
Sudah saya cek manual: kurung/tanda kurung kurawal seimbang, dan logikanya
saya telusuri baris demi baris dari kode `lib/auth/roles.ts`,
`lib/events/access.ts`, `lib/events/resolve-scope.ts`, dan setiap
`lib/<collection>/*.ts` yang relevan — tapi ini bukan pengganti pengujian
sungguhan.

**Sebelum deploy ke production**, sangat disarankan:
1. `firebase emulators:start --only firestore`
2. Jalankan skenario baca/tulis dari setiap role (Coach, CGL, Sponsor,
   Member, Simpatisan) lewat `@firebase/rules-unit-testing`, minimal untuk
   jalur yang paling sensitif: baca `kasAccounts`/`transactions` per role,
   baca `events` tipe `only_me` milik orang lain (harus ditolak), dan baca
   `organizationLog` oleh Coach (harus ditolak, karena hanya `admin`).
3. Deploy ke Firestore project yang bukan production dulu kalau
   memungkinkan.
