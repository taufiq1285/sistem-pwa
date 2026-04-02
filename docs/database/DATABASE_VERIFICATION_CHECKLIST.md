# 🔍 Database Verification Checklist - Supabase

**Date:** 2025-12-09
**Purpose:** Memastikan database Supabase sesuai dengan aplikasi

---

## 📋 Cara Menggunakan Checklist Ini

### Step 1: Run Verification Script
1. Buka **Supabase Dashboard**
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar
4. Buka file: `supabase/VERIFY_DATABASE_COMPLETE.sql`
5. Copy semua isi file dan paste ke SQL Editor
6. Klik **Run** atau tekan `Ctrl+Enter`
7. Review semua hasil query

### Step 2: Gunakan Checklist Ini
Centang setiap item yang sudah verified ✅

---

## ✅ SECTION 1: Tables Verification

### Core Tables (WAJIB ADA)

- [ ] `users` - Base user table
- [ ] `mahasiswa` - Student profiles
- [ ] `dosen` - Lecturer profiles
- [ ] `laboran` - Lab staff profiles
- [ ] `admin` - Admin profiles

### Academic Tables

- [ ] `mata_kuliah` - Course master data
- [ ] `kelas` - Class instances
- [ ] `kelas_mahasiswa` - Student enrollments
- [ ] `jadwal_praktikum` - Schedule
- [ ] `kehadiran` - Attendance

### Assessment Tables

- [ ] `kuis` - Quiz master
- [ ] `soal_kuis` - Quiz questions
- [ ] `attempt_kuis` - Quiz attempts
- [ ] `jawaban_mahasiswa` - Student answers
- [ ] `nilai` - Final grades

### Content Tables

- [ ] `materi` - Learning materials
- [ ] `pengumuman` - Announcements

### Lab Management Tables

- [ ] `laboratorium` - Laboratory master
- [ ] `inventaris` - Equipment inventory
- [ ] `peminjaman` - Equipment borrowing

### System Tables

- [ ] `notifikasi` - Notifications
- [ ] `offline_queue` - Offline sync queue
- [ ] `sync_status` - Sync status tracking

**Total Tables Expected:** 23 tables

---

## ✅ SECTION 2: ENUM Types Verification

- [ ] `user_role` - Values: admin, dosen, mahasiswa, laboran
- [ ] `gender_type` - Values: laki-laki, perempuan
- [ ] `day_of_week` - Values: senin, selasa, rabu, kamis, jumat, sabtu, minggu
- [ ] `jenis_soal` - Values: multiple_choice, essay, true_false, short_answer
- [ ] `attempt_status` - Values: in_progress, submitted, graded
- [ ] `sync_status_type` - Values: pending, syncing, synced, failed
- [ ] `status_peminjaman` - Values: menunggu, disetujui, ditolak, dipinjam, dikembalikan

**Total ENUMs Expected:** 7 enums

---

## ✅ SECTION 3: Critical Columns Verification

### Table: `users`

- [ ] `id` (UUID, PK)
- [ ] `email` (VARCHAR, UNIQUE, NOT NULL)
- [ ] `full_name` (VARCHAR, NOT NULL)
- [ ] `role` (user_role, NOT NULL)
- [ ] `is_active` (BOOLEAN)
- [ ] `created_at` (TIMESTAMPTZ)
- [ ] `updated_at` (TIMESTAMPTZ)

### Table: `mahasiswa`

- [ ] `id` (UUID, PK)
- [ ] `user_id` (UUID, FK to users, UNIQUE)
- [ ] `nim` (VARCHAR, UNIQUE, NOT NULL)
- [ ] `program_studi` (VARCHAR)
- [ ] `angkatan` (INTEGER)
- [ ] `semester` (INTEGER)

### Table: `dosen`

- [ ] `id` (UUID, PK)
- [ ] `user_id` (UUID, FK to users, UNIQUE)
- [ ] `nip` (VARCHAR, UNIQUE, NOT NULL)
- [ ] `nidn` (VARCHAR) - ⚠️ IMPORTANT
- [ ] `nuptk` (VARCHAR) - ⚠️ IMPORTANT
- [ ] `gelar_depan` (VARCHAR)
- [ ] `gelar_belakang` (VARCHAR)

### Table: `mata_kuliah`

- [ ] `id` (UUID, PK)
- [ ] `kode_mk` (VARCHAR, UNIQUE, NOT NULL)
- [ ] `nama_mk` (VARCHAR, NOT NULL)
- [ ] `sks` (INTEGER, NOT NULL)
- [ ] `semester` (INTEGER, NOT NULL)
- [ ] `is_active` (BOOLEAN)

### Table: `kelas`

- [ ] `id` (UUID, PK)
- [ ] `mata_kuliah_id` (UUID, FK, NOT NULL)
- [ ] `dosen_id` (UUID, FK, NOT NULL)
- [ ] `kode_kelas` (VARCHAR, NOT NULL)
- [ ] `nama_kelas` (VARCHAR, NOT NULL)
- [ ] `tahun_ajaran` (VARCHAR, NOT NULL)
- [ ] `semester_ajaran` (INTEGER, NOT NULL)
- [ ] `kuota` (INTEGER)
- [ ] `is_active` (BOOLEAN)

### Table: `kelas_mahasiswa` ⚠️ CRITICAL

- [ ] `id` (UUID, PK)
- [ ] `kelas_id` (UUID, FK, NOT NULL)
- [ ] `mahasiswa_id` (UUID, FK, NOT NULL)
- [ ] `is_active` (BOOLEAN) - ⚠️ **WAJIB ADA!**
- [ ] `enrolled_at` (TIMESTAMPTZ) - ⚠️ **WAJIB ADA!**
- [ ] UNIQUE constraint on (kelas_id, mahasiswa_id)

### Table: `kuis`

- [ ] `id` (UUID, PK)
- [ ] `kelas_id` (UUID, FK, NOT NULL)
- [ ] `judul` (VARCHAR, NOT NULL)
- [ ] `deskripsi` (TEXT)
- [ ] `tanggal_mulai` (TIMESTAMPTZ, NOT NULL)
- [ ] `tanggal_selesai` (TIMESTAMPTZ, NOT NULL)
- [ ] `durasi_menit` (INTEGER)
- [ ] `status` (VARCHAR) - draft, published, closed
- [ ] `is_active` (BOOLEAN)

### Table: `inventaris`

- [ ] `id` (UUID, PK)
- [ ] `laboratorium_id` (UUID, FK)
- [ ] `kode_inventaris` (VARCHAR, UNIQUE)
- [ ] `nama_barang` (VARCHAR, NOT NULL)
- [ ] `jumlah` (INTEGER, NOT NULL)
- [ ] `kondisi` (VARCHAR)
- [ ] `is_active` (BOOLEAN)

---

## ✅ SECTION 4: Foreign Keys Verification

### Critical Foreign Keys

- [ ] `mahasiswa.user_id` → `users.id` (CASCADE)
- [ ] `dosen.user_id` → `users.id` (CASCADE)
- [ ] `laboran.user_id` → `users.id` (CASCADE)
- [ ] `admin.user_id` → `users.id` (CASCADE)
- [ ] `kelas.mata_kuliah_id` → `mata_kuliah.id` (RESTRICT)
- [ ] `kelas.dosen_id` → `dosen.id` (RESTRICT)
- [ ] `kelas_mahasiswa.kelas_id` → `kelas.id` (CASCADE)
- [ ] `kelas_mahasiswa.mahasiswa_id` → `mahasiswa.id` (CASCADE)
- [ ] `jadwal_praktikum.kelas_id` → `kelas.id` (CASCADE)
- [ ] `kuis.kelas_id` → `kelas.id` (CASCADE)

**Total FK Expected:** ~30+ foreign keys

---

## ✅ SECTION 5: Indexes Verification

### Critical Indexes

- [ ] `users(email)` - UNIQUE index
- [ ] `mahasiswa(nim)` - UNIQUE index
- [ ] `mahasiswa(user_id)` - UNIQUE index
- [ ] `dosen(nip)` - UNIQUE index
- [ ] `dosen(user_id)` - UNIQUE index
- [ ] `mata_kuliah(kode_mk)` - UNIQUE index
- [ ] `kelas_mahasiswa(kelas_id, mahasiswa_id)` - UNIQUE composite
- [ ] `kelas_mahasiswa(mahasiswa_id)` - Performance index
- [ ] `kuis(kelas_id)` - Performance index
- [ ] `attempt_kuis(mahasiswa_id)` - Performance index

---

## ✅ SECTION 6: RLS (Row Level Security) Verification

### RLS Status (MUST BE ENABLED)

- [ ] `users` - RLS ENABLED
- [ ] `mahasiswa` - RLS ENABLED
- [ ] `dosen` - RLS ENABLED
- [ ] `laboran` - RLS ENABLED
- [ ] `admin` - RLS ENABLED
- [ ] `mata_kuliah` - RLS ENABLED
- [ ] `kelas` - RLS ENABLED
- [ ] `kelas_mahasiswa` - RLS ENABLED
- [ ] `jadwal_praktikum` - RLS ENABLED
- [ ] `kuis` - RLS ENABLED
- [ ] `attempt_kuis` - RLS ENABLED
- [ ] `inventaris` - RLS ENABLED
- [ ] `peminjaman` - RLS ENABLED

### Critical RLS Policies

#### users table:
- [ ] SELECT policy for own data
- [ ] SELECT policy for admin
- [ ] UPDATE policy for own data
- [ ] INSERT policy for registration

#### mahasiswa table:
- [ ] SELECT policy (own data + dosen + admin)
- [ ] INSERT policy (registration process)
- [ ] UPDATE policy (own data + admin)

#### kelas_mahasiswa table:
- [ ] SELECT policy (mahasiswa sees own enrollments)
- [ ] SELECT policy (dosen sees their class enrollments)
- [ ] INSERT policy (admin only)
- [ ] DELETE policy (admin only)

#### kuis table:
- [ ] SELECT policy (dosen sees own kuis)
- [ ] SELECT policy (mahasiswa sees published kuis in their kelas)
- [ ] INSERT policy (dosen only)
- [ ] UPDATE policy (dosen own kuis only)

---

## ✅ SECTION 7: Functions Verification

### Critical Functions

- [ ] `is_admin()` - Check if current user is admin
- [ ] `is_dosen()` - Check if current user is dosen
- [ ] `is_mahasiswa()` - Check if current user is mahasiswa
- [ ] `is_laboran()` - Check if current user is laboran
- [ ] `get_user_role()` - Get current user's role
- [ ] `update_updated_at_column()` - Trigger function for timestamps

---

## ✅ SECTION 8: Triggers Verification

### Critical Triggers

- [ ] `users` - update_updated_at_trigger
- [ ] `mahasiswa` - update_updated_at_trigger
- [ ] `dosen` - update_updated_at_trigger
- [ ] `mata_kuliah` - update_updated_at_trigger
- [ ] `kelas` - update_updated_at_trigger

---

## ✅ SECTION 9: Storage Buckets Verification

- [ ] `materi` bucket - For learning materials
- [ ] `avatars` bucket (optional) - For user avatars
- [ ] Bucket policies configured correctly

---

## ✅ SECTION 10: Data Verification

### Sample Data Check

- [ ] At least 1 admin user exists
- [ ] At least 1 dosen exists (for testing)
- [ ] At least 1 mahasiswa exists (for testing)
- [ ] At least 1 mata_kuliah exists
- [ ] At least 1 laboratorium exists
- [ ] No orphaned mahasiswa records (without users)
- [ ] No orphaned dosen records (without users)
- [ ] No orphaned kelas records (without mata_kuliah)

### Data Integrity

- [ ] All mahasiswa have valid user_id
- [ ] All dosen have valid user_id
- [ ] All kelas have valid mata_kuliah_id
- [ ] All kelas have valid dosen_id
- [ ] All kelas_mahasiswa have valid kelas_id and mahasiswa_id
- [ ] No duplicate NIMs
- [ ] No duplicate NIPs
- [ ] No duplicate emails

---

## ✅ SECTION 11: Extensions Verification

- [ ] `uuid-ossp` extension enabled
- [ ] `pgcrypto` extension enabled (if used)

---

## 🚨 Common Issues & Fixes

### Issue 1: Missing `is_active` in `kelas_mahasiswa`

**Symptom:** Error when filtering enrollments
**Fix:**
```sql
ALTER TABLE kelas_mahasiswa
ADD COLUMN is_active BOOLEAN DEFAULT true;
```

### Issue 2: Missing `enrolled_at` in `kelas_mahasiswa`

**Symptom:** Can't track enrollment date
**Fix:**
```sql
ALTER TABLE kelas_mahasiswa
ADD COLUMN enrolled_at TIMESTAMPTZ DEFAULT NOW();
```

### Issue 3: Missing `nidn` or `nuptk` in `dosen`

**Symptom:** Registration form fails for dosen
**Fix:**
```sql
ALTER TABLE dosen ADD COLUMN nidn VARCHAR(20);
ALTER TABLE dosen ADD COLUMN nuptk VARCHAR(20);
```

### Issue 4: RLS not enabled

**Symptom:** Security risk, anyone can access data
**Fix:**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Expected Counts (Minimum for Production Ready)

| Entity | Minimum Count | Purpose |
|--------|---------------|---------|
| Tables | 23 | All core tables |
| ENUMs | 7 | All type definitions |
| Foreign Keys | 30+ | Data integrity |
| Indexes | 20+ | Performance |
| RLS Policies | 50+ | Security |
| Functions | 6+ | Helper functions |
| Triggers | 5+ | Auto-updates |

---

## ✅ Final Verification Steps

### 1. Run Complete Verification Script
- [ ] All tables exist
- [ ] All columns exist
- [ ] All foreign keys correct
- [ ] All indexes present
- [ ] All RLS enabled
- [ ] All functions working

### 2. Test Critical Queries
- [ ] Can register new mahasiswa
- [ ] Can register new dosen
- [ ] Can create kelas
- [ ] Can enroll mahasiswa to kelas
- [ ] Can create kuis
- [ ] Can submit kuis attempt

### 3. Security Check
- [ ] RLS enabled on all tables
- [ ] Policies protect sensitive data
- [ ] Users can only access allowed data
- [ ] No SQL injection vulnerabilities

### 4. Performance Check
- [ ] Indexes on foreign keys
- [ ] Indexes on frequently queried columns
- [ ] No slow queries (< 100ms for simple queries)

---

## 📝 Sign-off

**Database Verified By:** ___________________
**Date:** ___________________
**Status:**
- [ ] ✅ READY FOR PRODUCTION
- [ ] ⚠️ NEEDS MINOR FIXES
- [ ] ❌ MAJOR ISSUES FOUND

**Notes:**
```
[Add any notes or issues found here]
```

---

**Created:** 2025-12-09
**Last Updated:** 2025-12-09
**Version:** 1.0
