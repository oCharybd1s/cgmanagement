# Perubahan: Popup Pengaturan (Profile + Keamanan)

## Revisi terbaru - Profile section fungsional penuh

### File baru
- lib/members/update-avatar.ts
  - updateOwnAvatarForSession(session, avatarId): validasi avatarId terhadap
    AVATAR_IDS lalu update field avatarId di Firestore.
- app/api/members/me/route.ts
  - GET: ambil data profil sendiri (lengkap, termasuk avatarId).
  - PATCH: update avatarId sendiri saja.
- components/settings/avatars/avatar-catalog.tsx
  - 10 komponen avatar SVG (hasil approve sepanjang sesi sebelumnya):
    Singa, Elang, Domba, Kelinci, Rubah, Harimau (chibi), Pria Tertawa,
    Wanita Mengedip, Pria Terkejut, Wanita Tenang.
  - Export AVATAR_IDS (dipakai validasi server) dan AVATAR_CATALOG (dipakai UI).
- components/settings/avatar-picker.tsx
  - Grid avatar, klik langsung PATCH avatarId, ada state loading per-avatar.
- components/settings/badge-tooltip.tsx
  - Hover di desktop, tap di mobile (klik luar untuk menutup).
- components/settings/sections/profile-section.tsx
  - Fetch GET /api/members/me saat dibuka.
  - Avatar picker di atas.
  - Read-only: Nama Lengkap, Tempat/Tanggal Lahir, Pelayanan.
  - Request-only (belum fungsional, tombol disabled dengan tooltip
    "Fitur pengajuan perubahan belum tersedia"): Email, No HP.
  - Badge + tooltip: Role, Kode Grup, NIJ, Bendahara (kalau isBendahara true).

### File diedit
- lib/members/types.ts
  - Tambah field avatarId: string | null ke Member.
- lib/members/data.ts
  - toMember direfactor jadi toMember(id, data) - lebih rapi, tidak perlu
    cast tipe snapshot.
  - Tambah avatarId ke mapping.
  - Tambah getOwnMemberForSession(session).
- components/settings/settings-modal.tsx
  - Tab Profile sekarang render ProfileSection asli (bukan ComingSoon lagi).
  - Default tab dibuka jadi "profile" (sebelumnya "security").

## Belum dikerjakan / keputusan yang masih terbuka
- Backend request-flow untuk ubah Email & No HP (field disabled di UI sekarang,
  sengaja tidak dibuat pura-pura jalan).
- Verifikasi password lama saat ganti password.
- Perilaku setelah sukses ganti password (saat ini: router.refresh()).
- 4 avatar tumbuhan belum dibuat - katalog masih 10 avatar (bisa nambah nanti
  tinggal tambah komponen baru + masukkan ke AVATAR_CATALOG).

## Cara pakai
Extract isi zip ini ke root project (timpa file yang sudah ada di path yang sama).
Tidak ada file yang perlu dihapus di revisi ini.
