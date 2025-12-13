-- ============================================================================
-- CLEANUP DEVELOPMENT DATA
-- ============================================================================
-- ⚠️ WARNING: HANYA untuk DEVELOPMENT MODE!
-- ⚠️ JANGAN jalankan di PRODUCTION!
-- ============================================================================

-- ============================================================================
-- OPSI 1: HAPUS HANYA 2 KELAS YANG INVALID (Ringan)
-- ============================================================================

-- Hapus 2 kelas yang mata_kuliah_id, dosen_id, kode_kelas = NULL
DELETE FROM kelas
WHERE id IN (
    '34912893-1fb5-4081-b8e2-6e545fad979f',
    'a736f8d2-991a-4e5c-ba78-2b7201c08ef3'
);

-- Verify
SELECT COUNT(*) as total_kelas_null FROM kelas WHERE mata_kuliah_id IS NULL;
-- Expected: 0

-- ============================================================================
-- OPSI 2: CLEAN SLATE - HAPUS SEMUA DATA AKADEMIK (Full Reset)
-- ============================================================================

-- ⚠️ Ini akan menghapus SEMUA data akademik!
-- ⚠️ Uncomment jika yakin ingin reset total

/*
-- Step 1: Hapus data dependent (dari child ke parent)
DELETE FROM jawaban;
DELETE FROM attempt_kuis;
DELETE FROM soal;
DELETE FROM kuis;
DELETE FROM nilai;
DELETE FROM kehadiran;
DELETE FROM materi;
DELETE FROM jadwal_praktikum;
DELETE FROM kelas_mahasiswa;
DELETE FROM kelas;
DELETE FROM mata_kuliah;

-- Step 2: Hapus data mahasiswa, dosen, laboran (optional)
-- DELETE FROM mahasiswa;
-- DELETE FROM dosen;
-- DELETE FROM laboran;

-- Step 3: Hapus peminjaman & inventaris (optional)
-- DELETE FROM peminjaman;
-- DELETE FROM inventaris;
-- DELETE FROM laboratorium;

-- Step 4: Hapus pengumuman & notifikasi (optional)
-- DELETE FROM pengumuman;
-- DELETE FROM notifikasi;

-- Step 5: Verify - harusnya semua 0
SELECT 'mata_kuliah' as table_name, COUNT(*) as count FROM mata_kuliah
UNION ALL
SELECT 'kelas', COUNT(*) FROM kelas
UNION ALL
SELECT 'kelas_mahasiswa', COUNT(*) FROM kelas_mahasiswa
UNION ALL
SELECT 'jadwal_praktikum', COUNT(*) FROM jadwal_praktikum
UNION ALL
SELECT 'kuis', COUNT(*) FROM kuis
UNION ALL
SELECT 'nilai', COUNT(*) FROM nilai;
*/

-- ============================================================================
-- OPSI 3: SOFT DELETE - Tandai sebagai inactive saja
-- ============================================================================

-- Alternatif: Tidak hapus, tapi set is_active = false
/*
UPDATE kelas
SET is_active = false
WHERE id IN (
    '34912893-1fb5-4081-b8e2-6e545fad979f',
    'a736f8d2-991a-4e5c-ba78-2b7201c08ef3'
);
*/

-- ============================================================================
-- SETELAH CLEANUP: Mulai Fresh dengan Data Master
-- ============================================================================

-- Setelah cleanup, Anda bisa insert data master fresh dari admin panel:
-- 1. Buat Mata Kuliah baru (Admin > Mata Kuliah)
-- 2. Buat Kelas baru (Admin > Kelas) - pastikan pilih mata_kuliah dan dosen yang valid
-- 3. Assign mahasiswa ke kelas
-- 4. Buat jadwal praktikum

-- ============================================================================
-- NOTES
-- ============================================================================

-- CASCADE DELETE akan otomatis hapus:
-- - kelas → kelas_mahasiswa (enrollment)
-- - kelas → jadwal_praktikum
-- - kelas → kuis → soal → attempt_kuis → jawaban
-- - kelas → materi
-- - kelas → nilai
-- - kelas → kehadiran

-- RESTRICT akan prevent delete jika ada data terkait:
-- - mata_kuliah (jika ada kelas yang pakai)
-- - dosen (jika ada kelas yang pakai)

-- ============================================================================
-- RECOMMENDED WORKFLOW untuk Development
-- ============================================================================

-- 1. Jalankan OPSI 1 (hapus 2 kelas invalid) ✅ AMAN
-- 2. Atau jalankan OPSI 2 (full reset) jika mau mulai dari 0
-- 3. Buat data master baru lewat admin panel
-- 4. Test sistem dengan data fresh

-- ============================================================================
-- END OF CLEANUP SCRIPT
-- ============================================================================
