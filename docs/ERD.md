# Skema Database (Produksi) — Supabase
## Sistem Informasi Praktikum PWA

Dokumen ini disusun dalam format akademik agar dapat langsung digunakan pada bab implementasi/analisis basis data skripsi. Isi dokumen merepresentasikan **kondisi aktual database Supabase** (schema produksi), bukan rancangan konseptual lama.

---

## 1. Ruang Lingkup dan Sumber Kebenaran Data

### 1.1 Ruang lingkup utama
Schema yang menjadi domain bisnis aplikasi adalah:
- `public`

### 1.2 Schema sistem (platform Supabase)
Schema berikut bersifat infrastruktur dan tidak dibahas sebagai entitas bisnis utama skripsi:
- `auth`
- `storage`
- `realtime`
- `vault`
- `supabase_migrations`
- `extensions`

Dengan demikian, pembahasan skema database aplikasi pada skripsi difokuskan pada tabel-tabel di schema `public`.

---

## 2. Ringkasan Tabel Utama (Schema `public`)

Total tabel pada domain aplikasi: **34 tabel**.

### 2.1 Kelompok Identitas dan Peran Pengguna
1. `users`
2. `admin`
3. `dosen`
4. `mahasiswa`
5. `laboran`

### 2.2 Kelompok Akademik dan Kelas
6. `mata_kuliah`
7. `kelas`
8. `kelas_mahasiswa`
9. `dosen_mata_kuliah`
10. `kelas_dosen_assignment`
11. `mahasiswa_semester_audit`

### 2.3 Kelompok Praktikum dan Pembelajaran
12. `jadwal_praktikum`
13. `kehadiran`
14. `materi`
15. `logbook_entries`
16. `nilai`
17. `permintaan_perbaikan_nilai`

### 2.4 Kelompok Kuis dan Evaluasi
18. `kuis`
19. `soal`
20. `bank_soal`
21. `attempt_kuis`
22. `jawaban`

### 2.5 Kelompok Laboratorium dan Inventaris
23. `laboratorium`
24. `inventaris`
25. `peminjaman`

### 2.6 Kelompok Komunikasi
26. `pengumuman`
27. `notifications`

### 2.7 Kelompok Operasional Sistem (Offline, Sinkronisasi, Audit, Keamanan)
28. `offline_queue`
29. `sync_history`
30. `conflict_log`
31. `cache_metadata`
32. `audit_logs`
33. `audit_logs_archive`
34. `sensitive_operations`

---

## 3. View Pendukung (Bukan Tabel Transaksi)

View berikut tersedia di schema `public` dan digunakan untuk kebutuhan query tertentu:
1. `v_available_kelas`
2. `v_dosen_grading_access`
3. `v_kelas_assignments`

---

## 4. Penyesuaian Nama Entitas dari ERD Konseptual Lama

Agar konsisten dengan implementasi aktual di Supabase, dilakukan penyesuaian istilah berikut:

- `JADWAL` → `jadwal_praktikum`
- `LOGBOOK` → `logbook_entries`
- `KUIS_SUBMISSION` → dipisah menjadi `attempt_kuis` dan `jawaban`
- `MAHASISWA_KELAS` → `kelas_mahasiswa`

Implikasi akademik: pada naskah skripsi, penamaan tabel harus mengikuti nama implementasi aktual agar konsisten dengan artefak sistem dan hasil pengujian.

---

## 5. Ringkasan Relasi Tingkat Tinggi

1. Entitas pengguna berpusat pada `users` dan diperluas oleh tabel peran (`admin`, `dosen`, `mahasiswa`, `laboran`).
2. Struktur akademik dibangun oleh `mata_kuliah` dan `kelas`, dengan tabel penghubung `kelas_mahasiswa`, `dosen_mata_kuliah`, dan `kelas_dosen_assignment`.
3. Aktivitas praktikum direpresentasikan oleh `jadwal_praktikum`, kemudian diturunkan ke `kehadiran`, `materi`, `logbook_entries`, `nilai`, dan `permintaan_perbaikan_nilai`.
4. Modul kuis dibangun dari `kuis`, `soal`, `bank_soal`, serta tabel aktivitas pengerjaan mahasiswa (`attempt_kuis`, `jawaban`).
5. Modul laboratorium mengelola aset melalui alur `laboratorium` → `inventaris` → `peminjaman`.
6. Aspek komunikasi dan keandalan sistem didukung oleh `pengumuman`, `notifications`, serta tabel sinkronisasi/audit.

---

## 6. Format Penulisan untuk Skripsi (Siap Tempel)

Paragraf berikut dapat langsung digunakan pada bab implementasi:

> Berdasarkan hasil inspeksi schema produksi pada Supabase, sistem menggunakan schema `public` sebagai domain utama basis data aplikasi. Total terdapat 34 tabel yang dikelompokkan ke dalam modul pengguna, akademik, praktikum, kuis, laboratorium, komunikasi, serta operasional sistem (offline sync dan audit). Penamaan tabel pada implementasi akhir diselaraskan dengan kebutuhan operasional aplikasi, misalnya `jadwal_praktikum`, `logbook_entries`, dan pemisahan data pengerjaan kuis ke dalam `attempt_kuis` serta `jawaban`. Dengan pendekatan ini, dokumentasi basis data pada skripsi konsisten terhadap kondisi sistem yang berjalan.

---

## 7. 4.1.4 Skema Database (Ringkasan tabel utama — detail di ERD)

| Tabel | Kolom Utama | Keterangan |
|---|---|---|
| users | id, email, encrypted_password | Auth Supabase |
| users / admin / dosen / mahasiswa / laboran | id, role/nim_nip/nip, nama | Implementasi profil & role pada DB real (menggantikan konsep `profiles`) |
| kelas | id, nama, dosen_id, mata_kuliah_id | Data kelas |
| kuis | id, kelas_id, judul, durasi_menit | Data kuis |
| inventaris | id, nama_barang, jumlah, kondisi | Stok alat |
| peminjaman | id, inventaris_id, status | Alur peminjaman |
| materi | id, kelas_id, file_url | File materi |
| notifications | id, user_id, is_read | Notifikasi pengguna |

> Catatan: Pada implementasi Supabase aktual, entitas profil tidak disimpan sebagai satu tabel `profiles`, tetapi dipisah ke tabel role (`admin`, `dosen`, `mahasiswa`, `laboran`) dan terhubung ke `users`.

## 8. Status Dokumen

- Versi: **3.2 (Skripsi-ready, real Supabase sync + ringkasan 4.1.4)**
- Status: **✅ Valid untuk ringkasan skema database pada naskah skripsi**
