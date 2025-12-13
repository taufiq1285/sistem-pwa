# 📋 Expected Database Schema - Sistem Praktikum PWA

## Daftar Lengkap Tabel & Kolom yang Dibutuhkan Aplikasi

---

## 1. TABLE: `users` (Auth & Profile)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| email | varchar/text | NO | - | Email (unique) |
| full_name | varchar/text | NO | - | Nama lengkap |
| role | varchar/text | NO | 'mahasiswa' | User role |
| phone | varchar/text | YES | NULL | No. telepon |
| avatar_url | text | YES | NULL | URL foto profil |
| is_active | boolean | NO | true | Status aktif |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (email)

**RLS**: ✅ Enabled

---

## 2. TABLE: `mahasiswa` (Student Profiles)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | FK to users.id |
| nim | varchar/text | NO | - | NIM (unique) |
| program_studi | varchar/text | NO | - | Program studi |
| angkatan | integer | NO | - | Tahun angkatan |
| gender | char(1) | YES | NULL | L/P |
| date_of_birth | date | YES | NULL | Tanggal lahir |
| address | text | YES | NULL | Alamat |
| phone | varchar | YES | NULL | No. HP |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**Foreign Keys**:
- user_id → users(id) ON DELETE CASCADE

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (nim)
- INDEX (user_id)

**RLS**: ✅ Enabled

---

## 3. TABLE: `dosen` (Lecturer Profiles)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | FK to users.id |
| nip | varchar/text | NO | - | NIP (unique) |
| nidn | varchar/text | YES | NULL | NIDN |
| nuptk | varchar/text | YES | NULL | NUPTK |
| jabatan | varchar/text | YES | NULL | Jabatan |
| pendidikan_terakhir | varchar | YES | NULL | S1/S2/S3 |
| spesialisasi | text | YES | NULL | Bidang spesialisasi |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**Foreign Keys**:
- user_id → users(id) ON DELETE CASCADE

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (nip)
- INDEX (user_id)

**RLS**: ✅ Enabled

---

## 4. TABLE: `laboran` (Lab Technician Profiles)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | FK to users.id |
| nip | varchar/text | NO | - | NIP (unique) |
| jabatan | varchar/text | YES | NULL | Jabatan |
| laboratorium_id | uuid | YES | NULL | Lab yang dikelola |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**Foreign Keys**:
- user_id → users(id) ON DELETE CASCADE
- laboratorium_id → laboratorium(id) ON DELETE SET NULL

**RLS**: ✅ Enabled

---

## 5. TABLE: `program_studi`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| kode_prodi | varchar | NO | - | Kode prodi (unique) |
| nama_prodi | varchar | NO | - | Nama program studi |
| fakultas | varchar | YES | NULL | Nama fakultas |
| jenjang | varchar | YES | 'S1' | D3/S1/S2 |
| is_active | boolean | NO | true | Status aktif |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (kode_prodi)

---

## 6. TABLE: `mata_kuliah`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| kode_mk | varchar | NO | - | Kode MK (unique) |
| nama_mk | varchar | NO | - | Nama mata kuliah |
| sks | integer | NO | 3 | Jumlah SKS |
| semester | integer | YES | NULL | Semester berapa |
| deskripsi | text | YES | NULL | Deskripsi MK |
| is_active | boolean | NO | true | Status aktif |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (kode_mk)

---

## 7. TABLE: `kelas`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| mata_kuliah_id | uuid | NO | - | FK to mata_kuliah |
| dosen_id | uuid | NO | - | FK to dosen |
| nama_kelas | varchar | NO | - | Nama kelas (A, B, etc) |
| tahun_ajaran | varchar | NO | - | 2024/2025 |
| semester | varchar | NO | - | Ganjil/Genap |
| kapasitas | integer | YES | 40 | Max mahasiswa |
| is_active | boolean | NO | true | Status aktif |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**Foreign Keys**:
- mata_kuliah_id → mata_kuliah(id) ON DELETE CASCADE
- dosen_id → dosen(id) ON DELETE RESTRICT

---

## 8. TABLE: `pengumuman` (⚠️ PENTING - Sudah difix!)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| judul | varchar | NO | - | Judul pengumuman |
| **konten** | text | NO | - | ← BUKAN 'isi' |
| tipe | varchar | YES | 'info' | info/penting/urgent |
| prioritas | varchar | YES | 'normal' | low/normal/high |
| **penulis_id** | uuid | NO | - | ← BUKAN 'created_by' |
| target_role | text[] | YES | NULL | Array roles |
| target_kelas_id | uuid | YES | NULL | FK to kelas |
| **is_active** | boolean | NO | true | ← WAJIB ADA |
| **is_pinned** | boolean | NO | false | ← WAJIB ADA |
| tanggal_mulai | timestamptz | YES | NULL | Mulai ditampilkan |
| tanggal_selesai | timestamptz | YES | NULL | Selesai tampil |
| attachment_url | text | YES | NULL | URL attachment |
| **view_count** | integer | NO | 0 | ← WAJIB ADA |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**Foreign Keys**:
- penulis_id → users(id) ON DELETE CASCADE
- target_kelas_id → kelas(id) ON DELETE SET NULL

**⚠️ CATATAN PENTING**:
- Gunakan `konten` BUKAN `isi`
- Gunakan `penulis_id` BUKAN `created_by`
- Harus ada kolom: `is_active`, `is_pinned`, `view_count`

---

## 9. TABLE: `kuis`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| kelas_id | uuid | NO | - | FK to kelas |
| dosen_id | uuid | NO | - | FK to dosen |
| judul | varchar | NO | - | Judul kuis |
| deskripsi | text | YES | NULL | Deskripsi |
| **durasi_menit** | integer | NO | 60 | Durasi kuis |
| tanggal_mulai | timestamptz | NO | - | Waktu mulai |
| tanggal_selesai | timestamptz | NO | - | Waktu selesai |
| max_attempts | integer | NO | 1 | Max percobaan |
| passing_score | integer | YES | 60 | Nilai lulus |
| is_active | boolean | NO | true | Status aktif |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**Foreign Keys**:
- kelas_id → kelas(id) ON DELETE CASCADE
- dosen_id → dosen(id) ON DELETE RESTRICT

---

## 10. TABLE: `peminjaman` (⚠️ PENTING - Ada fix!)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| inventaris_id | uuid | NO | - | FK to inventaris |
| peminjam_id | uuid | NO | - | FK to mahasiswa |
| dosen_id | uuid | YES | NULL | FK to dosen |
| jumlah_pinjam | integer | NO | 1 | Jumlah barang |
| keperluan | text | NO | - | Keperluan pinjam |
| tanggal_pinjam | date | NO | - | Tanggal pinjam |
| tanggal_kembali_rencana | date | NO | - | Rencana kembali |
| **tanggal_kembali_aktual** | date | YES | NULL | ← BUKAN 'tanggal_kembali_real' |
| kondisi_saat_pinjam | varchar | YES | NULL | Kondisi saat pinjam |
| kondisi_saat_kembali | varchar | YES | NULL | Kondisi saat kembali |
| catatan_pengembalian | text | YES | NULL | Catatan |
| status | varchar | NO | 'pending' | pending/approved/rejected/returned |
| rejection_reason | text | YES | NULL | Alasan reject |
| approved_by | uuid | YES | NULL | FK to users |
| approved_at | timestamptz | YES | NULL | Waktu approval |
| denda | numeric | YES | 0 | Denda |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

**⚠️ CATATAN PENTING**:
- Gunakan `tanggal_kembali_aktual` BUKAN `tanggal_kembali_real`

---

## 11. TABLE: `inventaris`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| laboratorium_id | uuid | NO | - | FK to laboratorium |
| kode_barang | varchar | NO | - | Kode barang (unique) |
| nama_barang | varchar | NO | - | Nama barang |
| kategori | varchar | YES | NULL | Kategori |
| jumlah | integer | NO | 1 | Stok total |
| jumlah_tersedia | integer | NO | 1 | Stok tersedia |
| kondisi | varchar | NO | 'baik' | Kondisi barang |
| lokasi_penyimpanan | varchar | YES | NULL | Lokasi di lab |
| harga_satuan | numeric | YES | NULL | Harga per unit |
| tanggal_pembelian | date | YES | NULL | Tanggal beli |
| keterangan | text | YES | NULL | Keterangan |
| foto_url | text | YES | NULL | URL foto |
| is_active | boolean | NO | true | Status aktif |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

---

## 12. TABLE: `materi`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| kelas_id | uuid | NO | - | FK to kelas |
| dosen_id | uuid | NO | - | FK to dosen |
| judul | varchar | NO | - | Judul materi |
| deskripsi | text | YES | NULL | Deskripsi |
| file_url | text | YES | NULL | URL file |
| file_name | varchar | YES | NULL | Nama file |
| file_size | bigint | YES | NULL | Ukuran file (bytes) |
| file_type | varchar | YES | NULL | MIME type |
| tipe_materi | varchar | YES | 'slide' | slide/modul/video |
| urutan | integer | YES | NULL | Urutan tampil |
| is_active | boolean | NO | true | Status aktif |
| published_at | timestamptz | YES | NULL | Waktu publish |
| created_at | timestamptz | NO | now() | Waktu dibuat |
| updated_at | timestamptz | NO | now() | Waktu update |

---

## Summary Checks

### ✅ Minimal Tables Required (18):
1. users
2. mahasiswa
3. dosen
4. laboran
5. program_studi
6. mata_kuliah
7. kelas
8. jadwal
9. laboratorium
10. inventaris
11. peminjaman
12. materi
13. kuis
14. soal
15. jawaban_mahasiswa
16. kehadiran
17. pengumuman
18. offline_queue (optional)

### ⚠️ Critical Fixes Applied:
1. **pengumuman**: konten (not isi), penulis_id (not created_by), is_active, is_pinned, view_count
2. **peminjaman**: tanggal_kembali_aktual (not tanggal_kembali_real)
3. **kuis**: durasi_menit (required)

### 🔧 How to Verify:
Run `verify-database-schema.sql` in Supabase SQL Editor

---

**Last Updated**: 2024-11-24
**Status**: Production Schema
**Compatible With**: sistem-praktikum-pwa v1.0.0
