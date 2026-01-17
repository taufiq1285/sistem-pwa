-- ============================================
-- CLEANUP DOSEN DATA (FIXED VERSION)
-- ============================================
-- Script ini membersihkan semua data yang pernah diinput oleh dosen
-- tapi tetap mempertahankan akun dosen (users & dosen table)

-- PERINGATAN: Script ini akan menghapus SEMUA data yang dibuat oleh dosen!

-- ============================================
-- 1. HAPUS DATA KEHADIRAN (via kelas -> jadwal_praktikum)
-- ============================================
DELETE FROM kehadiran
WHERE jadwal_praktikum_id IN (
  SELECT jp.id FROM jadwal_praktikum jp
  INNER JOIN kelas k ON jp.kelas_id = k.id
  WHERE k.dosen_id IS NOT NULL
);

-- ============================================
-- 2. HAPUS DATA NILAI (via kelas -> jadwal_praktikum)
-- ============================================
DELETE FROM nilai
WHERE jadwal_praktikum_id IN (
  SELECT jp.id FROM jadwal_praktikum jp
  INNER JOIN kelas k ON jp.kelas_id = k.id
  WHERE k.dosen_id IS NOT NULL
);

-- ============================================
-- 3. HAPUS DATA JAWABAN KUIS (kuis punya dosen_id langsung)
-- ============================================
DELETE FROM jawaban_kuis
WHERE kuis_id IN (
  SELECT id FROM kuis WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 4. HAPUS DATA HASIL KUIS
-- ============================================
DELETE FROM hasil_kuis
WHERE kuis_id IN (
  SELECT id FROM kuis WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 5. HAPUS DATA SOAL KUIS
-- ============================================
DELETE FROM soal_kuis
WHERE kuis_id IN (
  SELECT id FROM kuis WHERE dosen_id IS NOT NULL
);

-- Atau jika nama tabel adalah 'soal' (bukan soal_kuis)
DELETE FROM soal
WHERE kuis_id IN (
  SELECT id FROM kuis WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 6. HAPUS DATA KUIS
-- ============================================
DELETE FROM kuis
WHERE dosen_id IS NOT NULL;

-- ============================================
-- 7. HAPUS DATA MATERI (via kelas -> jadwal_praktikum)
-- ============================================
DELETE FROM materi
WHERE jadwal_praktikum_id IN (
  SELECT jp.id FROM jadwal_praktikum jp
  INNER JOIN kelas k ON jp.kelas_id = k.id
  WHERE k.dosen_id IS NOT NULL
);

-- ============================================
-- 8. HAPUS DATA PEMINJAMAN (peminjaman punya dosen_id langsung)
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
-- 9. HAPUS RELASI MAHASISWA-JADWAL (via kelas)
-- ============================================
DELETE FROM jadwal_praktikum_mahasiswa
WHERE jadwal_praktikum_id IN (
  SELECT jp.id FROM jadwal_praktikum jp
  INNER JOIN kelas k ON jp.kelas_id = k.id
  WHERE k.dosen_id IS NOT NULL
);

-- ============================================
-- 10. HAPUS JADWAL PRAKTIKUM (via kelas)
-- ============================================
DELETE FROM jadwal_praktikum
WHERE kelas_id IN (
  SELECT id FROM kelas WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 11. HAPUS RELASI KELAS-MAHASISWA
-- ============================================
DELETE FROM kelas_mahasiswa
WHERE kelas_id IN (
  SELECT id FROM kelas WHERE dosen_id IS NOT NULL
);

-- ============================================
-- 12. HAPUS KELAS (opsional)
-- ============================================
-- Uncomment jika ingin hapus kelas juga
-- DELETE FROM kelas WHERE dosen_id IS NOT NULL;

-- ============================================
-- VERIFIKASI HASIL
-- ============================================
SELECT 'kehadiran' as tabel, COUNT(*) as jumlah FROM kehadiran
UNION ALL
SELECT 'nilai' as tabel, COUNT(*) as jumlah FROM nilai
UNION ALL
SELECT 'jawaban_kuis' as tabel, COUNT(*) as jumlah FROM jawaban_kuis
UNION ALL
SELECT 'hasil_kuis' as tabel, COUNT(*) as jumlah FROM hasil_kuis
UNION ALL
SELECT 'soal/soal_kuis' as tabel, COUNT(*) as jumlah FROM soal
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
SELECT 'kelas_mahasiswa' as tabel, COUNT(*) as jumlah FROM kelas_mahasiswa
UNION ALL
SELECT 'kelas' as tabel, COUNT(*) as jumlah FROM kelas
UNION ALL
SELECT 'dosen (tetap ada)' as tabel, COUNT(*) as jumlah FROM dosen
UNION ALL
SELECT 'users dosen (tetap ada)' as tabel, COUNT(*) as jumlah FROM users WHERE role = 'dosen';

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
-- ✓ Relasi kelas-mahasiswa

-- Data yang DIPERTAHANKAN:
-- ✓ Akun dosen (users & dosen table)
-- ✓ Akun mahasiswa
-- ✓ Data master (laboratorium, mata kuliah, inventaris, dll)
-- ✓ Data kelas (bisa dihapus jika di-uncomment)
