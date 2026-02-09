-- ============================================================================
-- CLEANUP SCRIPT: Hapus semua data tugas praktikum/kuis
-- ============================================================================
-- ⚠️ PERHATIAN: Script ini akan menghapus SEMUA data kuis!
-- Jalankan di Supabase SQL Editor dengan hati-hati
-- ============================================================================

-- 1. Hapus semua jawaban (child table - harus dihapus duluan)
DELETE FROM jawaban;

-- 2. Hapus semua attempt_kuis (child table - harus dihapus duluan)
DELETE FROM attempt_kuis;

-- 3. Hapus semua soal (child table - harus dihapus duluan)
DELETE FROM soal;

-- 4. Hapus semua kuis (parent table - dihapus terakhir)
DELETE FROM kuis;

-- Verifikasi: Cek jumlah data setelah cleanup
SELECT 'jawaban' as table_name, COUNT(*) as remaining_count FROM jawaban
UNION ALL
SELECT 'soal', COUNT(*) FROM soal
UNION ALL
SELECT 'attempt_kuis', COUNT(*) FROM attempt_kuis
UNION ALL
SELECT 'kuis', COUNT(*) FROM kuis;

-- ============================================================================
-- Catatan:
-- - Foreign key constraints akan memastikan data terkait juga terhapus
-- - Setelah menjalankan script ini, dashboard dosen akan menampilkan 0
-- - Mahasiswa tidak akan melihat ada tugas praktikum
-- ============================================================================
