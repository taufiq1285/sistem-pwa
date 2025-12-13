-- ============================================
-- CLEANUP WITH CORRECT ORDER (Fix Foreign Key)
-- ============================================
-- Urutan DELETE harus dari child ke parent
-- Jalankan di Supabase Dashboard > SQL Editor

-- ============================================
-- STEP 1: CEK DATA SEBENARNYA (Bypass RLS)
-- ============================================
SELECT
  'auth.users' as tabel, COUNT(*) as jumlah FROM auth.users
UNION ALL
SELECT 'public.users', COUNT(*) FROM public.users
UNION ALL
SELECT 'dosen', COUNT(*) FROM dosen
UNION ALL
SELECT 'mahasiswa', COUNT(*) FROM mahasiswa
UNION ALL
SELECT 'kelas', COUNT(*) FROM kelas
UNION ALL
SELECT 'kelas_mahasiswa', COUNT(*) FROM kelas_mahasiswa
UNION ALL
SELECT 'jadwal_praktikum', COUNT(*) FROM jadwal_praktikum
UNION ALL
SELECT 'kuis', COUNT(*) FROM kuis
UNION ALL
SELECT 'soal', COUNT(*) FROM soal
UNION ALL
SELECT 'attempt_kuis', COUNT(*) FROM attempt_kuis
UNION ALL
SELECT 'jawaban', COUNT(*) FROM jawaban
UNION ALL
SELECT 'materi', COUNT(*) FROM materi
UNION ALL
SELECT 'nilai', COUNT(*) FROM nilai
UNION ALL
SELECT 'peminjaman', COUNT(*) FROM peminjaman;

-- ============================================
-- STEP 2: HAPUS DATA DENGAN URUTAN BENAR
-- ============================================

-- Level 5: Hapus yang paling ujung (no dependencies)
DELETE FROM jawaban;           -- Jawaban kuis mahasiswa
DELETE FROM nilai;             -- Nilai mahasiswa

-- Level 4: Hapus yang depend on level 5
DELETE FROM attempt_kuis;      -- Attempt/hasil kuis
DELETE FROM materi;            -- Materi pembelajaran

-- Level 3: Hapus yang depend on level 4
DELETE FROM soal;              -- Soal kuis

-- Level 2: Hapus yang depend on kelas/kuis
DELETE FROM kuis;              -- Kuis (depends on kelas)
DELETE FROM peminjaman;        -- Peminjaman (depends on dosen, bisa juga depend on mahasiswa)
DELETE FROM kelas_mahasiswa;   -- Relasi kelas-mahasiswa (depends on kelas)
DELETE FROM jadwal_praktikum;  -- Jadwal (depends on kelas & laboratorium)

-- Level 1: Hapus kelas (depends on dosen & mata_kuliah)
DELETE FROM kelas;             -- Sekarang bisa dihapus karena tidak ada yang reference

-- Level 0: Hapus profil dosen (sekarang aman karena kelas sudah terhapus)
DELETE FROM dosen;             -- Sekarang aman!

-- Hapus users dosen dari public.users
DELETE FROM users WHERE role = 'dosen';

-- Hapus auth users dosen
DELETE FROM auth.users WHERE raw_user_meta_data->>'role' = 'dosen';

-- ============================================
-- STEP 3: VERIFIKASI
-- ============================================
SELECT
  'auth.users (dosen)' as info,
  COUNT(*) as jumlah
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'dosen'
UNION ALL
SELECT 'public.users (dosen)', COUNT(*)
FROM public.users
WHERE role = 'dosen'
UNION ALL
SELECT 'dosen table', COUNT(*) FROM dosen
UNION ALL
SELECT 'kelas', COUNT(*) FROM kelas
UNION ALL
SELECT 'kuis', COUNT(*) FROM kuis
UNION ALL
SELECT 'peminjaman', COUNT(*) FROM peminjaman
UNION ALL
SELECT 'jadwal_praktikum', COUNT(*) FROM jadwal_praktikum;

-- Semua harusnya 0!

-- ============================================
-- CEK USERS YANG TERSISA
-- ============================================
SELECT
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;
