# 🔍 Panduan Verifikasi Database Supabase

## Cara Cek Database Anda Sudah Sesuai dengan Aplikasi

### 📋 Daftar Tabel yang Dibutuhkan Aplikasi

Aplikasi ini membutuhkan **18 tabel utama**:

#### 1. Authentication & Users
- `users` - User accounts
- `mahasiswa` - Student profiles
- `dosen` - Lecturer profiles
- `laboran` - Lab technician profiles

#### 2. Academic
- `program_studi` - Study programs
- `mata_kuliah` - Courses
- `kelas` - Classes
- `jadwal` - Schedules

#### 3. Lab Management
- `laboratorium` - Laboratories
- `inventaris` - Lab inventory
- `peminjaman` - Equipment borrowing

#### 4. Learning
- `materi` - Learning materials
- `kuis` - Quizzes
- `soal` - Questions
- `jawaban_mahasiswa` - Student answers
- `kehadiran` - Attendance

#### 5. System
- `pengumuman` - Announcements
- `offline_queue` - Offline sync queue (optional)

---

## 🚀 Langkah-Langkah Verifikasi

### STEP 1: Cek Tabel yang Ada

Jalankan query ini di **Supabase SQL Editor**:

```sql
-- 1. CEK SEMUA TABEL
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Output**: List tabel yang ada di database Anda.

---

### STEP 2: Bandingkan dengan Tabel yang Dibutuhkan

Saya sudah buatkan script untuk cek otomatis. Lihat file `check-all-tables.sql`

---

### STEP 3: Cek Struktur Setiap Tabel

Jalankan query di file `verify-database-schema.sql`

---

## ⚡ Quick Check

Jalankan query ini untuk **cek cepat**:

```sql
-- QUICK CHECK: Apakah semua tabel utama ada?
SELECT
    CASE
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')
        THEN '✅' ELSE '❌'
    END AS users,
    CASE
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mahasiswa')
        THEN '✅' ELSE '❌'
    END AS mahasiswa,
    CASE
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dosen')
        THEN '✅' ELSE '❌'
    END AS dosen,
    CASE
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kelas')
        THEN '✅' ELSE '❌'
    END AS kelas,
    CASE
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kuis')
        THEN '✅' ELSE '❌'
    END AS kuis,
    CASE
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'materi')
        THEN '✅' ELSE '❌'
    END AS materi,
    CASE
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pengumuman')
        THEN '✅' ELSE '❌'
    END AS pengumuman,
    CASE
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventaris')
        THEN '✅' ELSE '❌'
    END AS inventaris;
```

**Hasil yang Diharapkan**: Semua kolom harus ✅

---

## 📊 Verifikasi Detail per Tabel

### Tabel: `users`
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**Expected Columns**:
- id (uuid)
- email (text/varchar)
- full_name (text/varchar)
- role (text/varchar)
- phone (text/varchar)
- avatar_url (text/varchar)
- created_at (timestamp)
- updated_at (timestamp)

---

### Tabel: `mahasiswa`
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'mahasiswa'
ORDER BY ordinal_position;
```

**Expected Columns**:
- id (uuid)
- user_id (uuid) - FK to users
- nim (text/varchar)
- program_studi (text/varchar)
- angkatan (integer)
- created_at (timestamp)
- updated_at (timestamp)

---

### Tabel: `pengumuman`
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pengumuman'
ORDER BY ordinal_position;
```

**Expected Columns** (berdasarkan fix terbaru):
- id (uuid)
- judul (text/varchar)
- konten (text) ← BUKAN 'isi'
- tipe (text/varchar)
- prioritas (text/varchar)
- penulis_id (uuid) ← BUKAN 'created_by'
- target_role (text[] atau jsonb)
- target_kelas_id (uuid)
- is_active (boolean)
- is_pinned (boolean)
- tanggal_mulai (timestamp)
- tanggal_selesai (timestamp)
- attachment_url (text/varchar)
- view_count (integer)
- created_at (timestamp)
- updated_at (timestamp)

---

### Tabel: `kuis`
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'kuis'
ORDER BY ordinal_position;
```

**Expected Columns**:
- id (uuid)
- kelas_id (uuid)
- dosen_id (uuid)
- judul (text/varchar)
- deskripsi (text)
- durasi_menit (integer)
- tanggal_mulai (timestamp)
- tanggal_selesai (timestamp)
- max_attempts (integer)
- passing_score (integer)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)

---

### Tabel: `peminjaman`
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'peminjaman'
ORDER BY ordinal_position;
```

**Expected Columns**:
- id (uuid)
- inventaris_id (uuid)
- peminjam_id (uuid) - mahasiswa yang pinjam
- dosen_id (uuid) - dosen penanggung jawab
- jumlah_pinjam (integer)
- keperluan (text)
- tanggal_pinjam (date/timestamp)
- tanggal_kembali_rencana (date/timestamp)
- tanggal_kembali_aktual (date/timestamp) ← BUKAN 'tanggal_kembali_real'
- kondisi_saat_pinjam (text/varchar)
- kondisi_saat_kembali (text/varchar)
- catatan_pengembalian (text)
- status (text/varchar)
- rejection_reason (text)
- approved_by (uuid)
- approved_at (timestamp)
- denda (numeric/decimal)
- created_at (timestamp)
- updated_at (timestamp)

---

## 🔧 Cara Menggunakan File SQL

### 1. Buka Supabase Dashboard
- Login ke [Supabase](https://app.supabase.com)
- Pilih project Anda
- Klik **SQL Editor** di sidebar

### 2. Jalankan File SQL
- Buka file `verify-database-schema.sql`
- Copy paste ke SQL Editor
- Klik **Run** atau tekan `Ctrl+Enter`

### 3. Lihat Hasil
- Cek output untuk setiap tabel
- Bandingkan dengan expected columns di atas

---

## ❌ Jika Ada Kolom yang Hilang

### Option 1: Tambah Kolom Manual
```sql
-- Contoh: Tambah kolom 'is_pinned' ke tabel pengumuman
ALTER TABLE pengumuman
ADD COLUMN is_pinned BOOLEAN DEFAULT false;

-- Contoh: Tambah kolom 'view_count' ke tabel pengumuman
ALTER TABLE pengumuman
ADD COLUMN view_count INTEGER DEFAULT 0;
```

### Option 2: Generate Schema dari Aplikasi
Lihat file `database-schema-required.sql` untuk schema lengkap

---

## 🔑 Cek Foreign Keys

```sql
-- Cek semua foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;
```

---

## 🛡️ Cek Row Level Security (RLS)

```sql
-- Cek RLS status untuk setiap tabel
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected**: `rowsecurity = true` untuk semua tabel

---

## ✅ Checklist Verifikasi

- [ ] Semua 18 tabel utama ada
- [ ] Kolom di tabel `users` sesuai
- [ ] Kolom di tabel `mahasiswa` sesuai
- [ ] Kolom di tabel `dosen` sesuai
- [ ] Kolom di tabel `kuis` sesuai
- [ ] Kolom di tabel `pengumuman` sesuai (konten, penulis_id, is_pinned, view_count)
- [ ] Kolom di tabel `peminjaman` sesuai (tanggal_kembali_aktual)
- [ ] Foreign keys ada dan benar
- [ ] RLS enabled untuk semua tabel
- [ ] Indexes untuk performa

---

## 📝 Next Steps

### Jika Ada Perbedaan:
1. Catat kolom yang berbeda
2. Update type definitions di aplikasi, ATAU
3. Update database schema sesuai aplikasi

### Rekomendasi:
**Update Database** lebih mudah daripada update aplikasi!

---

## 📞 Butuh Bantuan?

Jika menemukan perbedaan:
1. Copy hasil query
2. Beritahu saya kolom mana yang berbeda
3. Saya akan bantu fix!

---

**Dibuat**: 2024-11-24
**Purpose**: Verify Supabase database compatibility
**Files**:
- `verify-database-schema.sql` - Detailed verification
- `check-all-tables.sql` - Quick table check
- `database-schema-required.sql` - Required schema
