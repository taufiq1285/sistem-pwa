-- ============================================
-- CLEANUP DOSEN DATA (Keep User Accounts)
-- ============================================
-- Script ini membersihkan semua data yang pernah diinput oleh dosen
-- tapi tetap mempertahankan akun dosen (users & dosen table)

-- PERINGATAN: Script ini akan menghapus SEMUA data yang dibuat oleh dosen!
-- Pastikan backup database sebelum menjalankan script ini.

-- ============================================
-- 1. HAPUS DATA KEHADIRAN
-- ============================================
DELETE FROM kehadiran
WHERE jadwal_praktikum_id IN (
  SELECT id FROM jadwal_praktikum WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 2. HAPUS DATA NILAI
-- ============================================
DELETE FROM nilai
WHERE jadwal_praktikum_id IN (
  SELECT id FROM jadwal_praktikum WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 3. HAPUS DATA JAWABAN KUIS & HASIL KUIS
-- ============================================
-- Hapus jawaban kuis mahasiswa
DELETE FROM jawaban_kuis
WHERE kuis_id IN (
  SELECT id FROM kuis WHERE dosen_id IS NOT NULL
);

-- Hapus hasil kuis mahasiswa
DELETE FROM hasil_kuis
WHERE kuis_id IN (
  SELECT id FROM kuis WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 4. HAPUS DATA SOAL KUIS
-- ============================================
DELETE FROM soal_kuis
WHERE kuis_id IN (
  SELECT id FROM kuis WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 5. HAPUS DATA KUIS
-- ============================================
DELETE FROM kuis
WHERE dosen_id IS NOT NULL;

-- ============================================
-- 6. HAPUS DATA MATERI
-- ============================================
DELETE FROM materi
WHERE jadwal_praktikum_id IN (
  SELECT id FROM jadwal_praktikum WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 7. HAPUS DATA PEMINJAMAN
-- ============================================
-- Hapus detail peminjaman terlebih dahulu
DELETE FROM detail_peminjaman
WHERE peminjaman_id IN (
  SELECT id FROM peminjaman WHERE dosen_id IS NOT NULL
);

-- Hapus peminjaman
DELETE FROM peminjaman
WHERE dosen_id IS NOT NULL;

-- ============================================
-- 8. HAPUS DATA JADWAL PRAKTIKUM
-- ============================================
-- Hapus relasi mahasiswa dengan jadwal praktikum
DELETE FROM jadwal_praktikum_mahasiswa
WHERE jadwal_praktikum_id IN (
  SELECT id FROM jadwal_praktikum WHERE dosen_id IS NOT NULL
);

-- Hapus jadwal praktikum
DELETE FROM jadwal_praktikum
WHERE dosen_id IS NOT NULL;

-- ============================================
-- 9. HAPUS DATA KELAS (opsional - jika kelas dibuat oleh dosen)
-- ============================================
-- Uncomment jika ingin hapus kelas juga
-- DELETE FROM kelas WHERE dosen_id IS NOT NULL;

-- ============================================
-- VERIFIKASI HASIL
-- ============================================
-- Cek jumlah data yang tersisa per tabel
SELECT 'kehadiran' as tabel, COUNT(*) as jumlah FROM kehadiran
UNION ALL
SELECT 'nilai' as tabel, COUNT(*) as jumlah FROM nilai
UNION ALL
SELECT 'jawaban_kuis' as tabel, COUNT(*) as jumlah FROM jawaban_kuis
UNION ALL
SELECT 'hasil_kuis' as tabel, COUNT(*) as jumlah FROM hasil_kuis
UNION ALL
SELECT 'soal_kuis' as tabel, COUNT(*) as jumlah FROM soal_kuis
UNION ALL
SELECT 'kuis' as tabel, COUNT(*) as jumlah FROM kuis
UNION ALL
SELECT 'materi' as tabel, COUNT(*) as jumlah FROM materi
UNION ALL
SELECT 'detail_peminjaman' as tabel, COUNT(*) as jumlah FROM detail_peminjaman
UNION ALL
SELECT 'peminjaman' as tabel, COUNT(*) as jumlah FROM peminjaman
UNION ALL
SELECT 'jadwal_praktikum_mahasiswa' as tabel, COUNT(*) as jumlah FROM jadwal_praktikum_mahasiswa
UNION ALL
SELECT 'jadwal_praktikum' as tabel, COUNT(*) as jumlah FROM jadwal_praktikum
UNION ALL
SELECT 'dosen' as tabel, COUNT(*) as jumlah FROM dosen
UNION ALL
SELECT 'users (dosen)' as tabel, COUNT(*) as jumlah FROM users WHERE role = 'dosen';

-- ============================================
-- CATATAN
-- ============================================
-- Data yang DIHAPUS:
-- ✓ Kehadiran mahasiswa
-- ✓ Nilai mahasiswa
-- ✓ Kuis dan soal kuis
-- ✓ Jawaban dan hasil kuis mahasiswa
-- ✓ Materi pembelajaran
-- ✓ Peminjaman dan detail peminjaman
-- ✓ Jadwal praktikum dan relasi mahasiswa

-- Data yang DIPERTAHANKAN:
-- ✓ Akun dosen (users & dosen table)
-- ✓ Akun mahasiswa
-- ✓ Data master (laboratorium, mata kuliah, dll)
-- ✓ Data kelas (kecuali jika di-uncomment)
