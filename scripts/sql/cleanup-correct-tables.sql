-- ============================================
-- CLEANUP ALL DATA - CORRECT TABLE NAMES
-- ============================================
-- Berdasarkan schema yang sebenarnya di database
-- Jalankan di Supabase Dashboard > SQL Editor

-- ============================================
-- CEK DATA YANG ADA (JALANKAN INI DULU)
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
SELECT 'laboran', COUNT(*) FROM laboran
UNION ALL
SELECT 'admin', COUNT(*) FROM admin
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
SELECT 'peminjaman', COUNT(*) FROM peminjaman
UNION ALL
SELECT 'inventaris', COUNT(*) FROM inventaris
UNION ALL
SELECT 'laboratorium', COUNT(*) FROM laboratorium
UNION ALL
SELECT 'mata_kuliah', COUNT(*) FROM mata_kuliah;

-- ============================================
-- OPSI A: HAPUS DATA TRANSAKSI DOSEN SAJA
-- ============================================
-- Hapus data yang diinput dosen, tapi keep akun login

DELETE FROM jawaban;           -- Jawaban kuis mahasiswa
DELETE FROM attempt_kuis;      -- Attempt/hasil kuis
DELETE FROM soal;              -- Soal kuis
DELETE FROM kuis;              -- Kuis
DELETE FROM nilai;             -- Nilai mahasiswa
DELETE FROM materi;            -- Materi pembelajaran
DELETE FROM peminjaman;        -- Peminjaman inventaris
DELETE FROM kelas_mahasiswa;   -- Relasi kelas-mahasiswa
DELETE FROM jadwal_praktikum;  -- Jadwal praktikum
DELETE FROM kelas;             -- Kelas

-- Verifikasi
SELECT
  'kelas' as tabel, COUNT(*) FROM kelas
UNION ALL SELECT 'kuis', COUNT(*) FROM kuis
UNION ALL SELECT 'peminjaman', COUNT(*) FROM peminjaman
UNION ALL SELECT 'materi', COUNT(*) FROM materi
UNION ALL SELECT 'nilai', COUNT(*) FROM nilai;

-- ============================================
-- OPSI B: HAPUS SEMUA AKUN DOSEN (UNCOMMENT)
-- ============================================
-- Jalankan Opsi A dulu, baru jalankan ini

-- DELETE FROM dosen;
-- DELETE FROM users WHERE role = 'dosen';
-- DELETE FROM auth.users WHERE raw_user_meta_data->>'role' = 'dosen';

-- Verifikasi dosen terhapus
-- SELECT COUNT(*) as jumlah_dosen FROM auth.users
-- WHERE raw_user_meta_data->>'role' = 'dosen';

-- ============================================
-- OPSI C: RESET TOTAL (UNCOMMENT)
-- ============================================
-- PERINGATAN: Menghapus SEMUA data dan akun!

-- Hapus semua data transaksi
-- DELETE FROM jawaban;
-- DELETE FROM attempt_kuis;
-- DELETE FROM soal;
-- DELETE FROM kuis;
-- DELETE FROM nilai;
-- DELETE FROM materi;
-- DELETE FROM peminjaman;
-- DELETE FROM kelas_mahasiswa;
-- DELETE FROM jadwal_praktikum;
-- DELETE FROM kelas;

-- Hapus semua profil
-- DELETE FROM dosen;
-- DELETE FROM mahasiswa;
-- DELETE FROM laboran;
-- DELETE FROM admin;

-- Hapus semua users
-- DELETE FROM users;

-- Hapus semua auth
-- DELETE FROM auth.users;

-- Hapus master data (optional)
-- DELETE FROM inventaris;
-- DELETE FROM laboratorium;
-- DELETE FROM mata_kuliah;

-- ============================================
-- FINAL VERIFICATION
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
SELECT 'kuis', COUNT(*) FROM kuis
UNION ALL
SELECT 'peminjaman', COUNT(*) FROM peminjaman
UNION ALL
SELECT 'inventaris', COUNT(*) FROM inventaris
UNION ALL
SELECT 'laboratorium', COUNT(*) FROM laboratorium
UNION ALL
SELECT 'mata_kuliah', COUNT(*) FROM mata_kuliah;
