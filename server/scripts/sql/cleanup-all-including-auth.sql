-- ============================================
-- CLEANUP ALL DATA INCLUDING AUTH
-- ============================================
-- PERINGATAN: Ini akan menghapus SEMUA DATA termasuk akun login!
-- Jalankan di Supabase Dashboard > SQL Editor

-- ============================================
-- STEP 1: HAPUS SEMUA DATA TRANSAKSI
-- ============================================

-- Hapus kehadiran
DELETE FROM kehadiran;

-- Hapus nilai
DELETE FROM nilai;

-- Hapus jawaban kuis
DELETE FROM jawaban_kuis;

-- Hapus hasil kuis
DELETE FROM hasil_kuis;

-- Hapus soal
DELETE FROM soal;

-- Hapus kuis
DELETE FROM kuis;

-- Hapus materi
DELETE FROM materi;

-- Hapus detail peminjaman
DELETE FROM detail_peminjaman;

-- Hapus peminjaman
DELETE FROM peminjaman;

-- Hapus relasi mahasiswa-jadwal
DELETE FROM jadwal_praktikum_mahasiswa;

-- Hapus jadwal praktikum
DELETE FROM jadwal_praktikum;

-- Hapus relasi kelas-mahasiswa
DELETE FROM kelas_mahasiswa;

-- Hapus kelas
DELETE FROM kelas;

-- ============================================
-- STEP 2: HAPUS DATA PROFIL (OPTIONAL)
-- ============================================
-- Uncomment jika ingin hapus semua profil juga

-- DELETE FROM dosen;
-- DELETE FROM mahasiswa;
-- DELETE FROM laboran;
-- DELETE FROM admin;

-- ============================================
-- STEP 3: HAPUS DATA USERS (PUBLIC.USERS)
-- ============================================
-- Uncomment jika ingin hapus semua users di public.users

-- DELETE FROM users;

-- ============================================
-- STEP 4: HAPUS AUTH USERS (AUTH.USERS)
-- ============================================
-- PERINGATAN: Ini menghapus akun authentication!
-- Anda tidak bisa login setelah ini!
-- Uncomment untuk menjalankan:

-- DELETE FROM auth.users;

-- ============================================
-- ALTERNATIF: HAPUS AUTH USERS BY ROLE
-- ============================================
-- Jika hanya ingin hapus dosen saja:

-- DELETE FROM auth.users
-- WHERE raw_user_meta_data->>'role' = 'dosen';

-- Jika hanya ingin hapus mahasiswa saja:

-- DELETE FROM auth.users
-- WHERE raw_user_meta_data->>'role' = 'mahasiswa';

-- ============================================
-- STEP 5: RESET MASTER DATA (OPTIONAL)
-- ============================================
-- Uncomment jika ingin reset master data juga

-- DELETE FROM inventaris;
-- DELETE FROM laboratorium;
-- DELETE FROM mata_kuliah;

-- ============================================
-- VERIFIKASI
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
SELECT 'jadwal_praktikum', COUNT(*) FROM jadwal_praktikum
UNION ALL
SELECT 'kuis', COUNT(*) FROM kuis
UNION ALL
SELECT 'peminjaman', COUNT(*) FROM peminjaman
UNION ALL
SELECT 'laboratorium', COUNT(*) FROM laboratorium
UNION ALL
SELECT 'mata_kuliah', COUNT(*) FROM mata_kuliah
UNION ALL
SELECT 'inventaris', COUNT(*) FROM inventaris;
