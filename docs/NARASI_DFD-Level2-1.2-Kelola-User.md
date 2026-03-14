# Narasi Alur DFD Level 2 — 1.2 Kelola User

Dokumen ini menjelaskan alur proses pada diagram `docs/DFD-Level2-1.2-Kelola-User-Yourdon.drawio`.

## 1. Tujuan Proses 1.2
Proses `1.2 Kelola User` bertujuan memastikan pengelolaan akun pengguna berjalan terkontrol oleh admin, mulai dari pembuatan akun, penetapan role, perubahan profil role, perubahan status user, hingga penghapusan/arsip data user.

## 2. Komponen Proses
- **Entitas eksternal:** Admin
- **Data store:** D1 Data User dan Role
- **Aktivitas internal:**
  - `A1` Buat Akun
  - `A2` Tetapkan Role
  - `A3` Kelola Profil Role
  - `A4` Ubah Status User
  - `A5` Hapus atau Arsipkan User

## 3. Narasi Alur Utama
1. Admin memasukkan data akun baru ke aktivitas `A1 Buat Akun`.
2. Sistem memvalidasi kelengkapan data akun, lalu menyimpan data user ke D1.
3. Setelah akun dibuat, aliran antaraktivitas `A1 → A2` membawa status **akun dibuat** untuk melanjutkan penetapan role.
4. Admin menetapkan role melalui `A2 Tetapkan Role`.
5. Sistem memperbarui relasi user-role pada D1 sehingga hak akses terbentuk.
6. Jika diperlukan, admin memperbarui profil role pada `A3 Kelola Profil Role`.
7. Admin dapat mengubah status user aktif/nonaktif melalui `A4 Ubah Status User`.
8. Admin dapat menghapus atau mengarsipkan akun melalui `A5 Hapus atau Arsipkan User`.
9. Sistem mengirimkan konfirmasi ke admin untuk aksi kelola profil role, perubahan status user, dan penghapusan/pengarsipan user.

## 4. Output Kunci
- Data user baru tersimpan.
- Role pengguna terbentuk dan siap dipakai proses autentikasi/otorisasi.
- Status user mutakhir (aktif/nonaktif).
- Data user terhapus atau terarsip sesuai kebijakan.

## 5. Ringkasan Siap Pakai Skripsi
Proses `1.2 Kelola User` merepresentasikan fungsi administrasi akun pada sistem. Admin membuat akun, menetapkan role, memperbarui profil role, mengubah status user, serta melakukan penghapusan atau pengarsipan akun. Seluruh perubahan disimpan pada data store user-role sehingga data identitas dan hak akses tetap konsisten untuk mendukung proses autentikasi dan kontrol akses sistem.