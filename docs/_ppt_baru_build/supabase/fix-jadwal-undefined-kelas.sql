-- ============================================================================
-- FIX: Jadwal Praktikum Menampilkan "Kelas undefined"
-- ============================================================================
-- Issue: Dashboard dosen menampilkan "Kelas undefined - Lab ANC (undefined)"
-- Root Cause: kelas_id di jadwal_praktikum bernilai NULL atau tidak valid
-- ============================================================================

-- STEP 1: CEK JADWAL DENGAN KELAS_ID NULL atau INVALID
-- ============================================================================

-- Cek jadwal yang kelas_id-nya NULL
SELECT
    '=== JADWAL DENGAN KELAS_ID NULL ===' as check_section,
    id,
    topik,
    tanggal_praktikum,
    hari,
    jam_mulai,
    jam_selesai,
    kelas_id,  -- INI NULL
    laboratorium_id,
    created_at
FROM jadwal_praktikum
WHERE kelas_id IS NULL
ORDER BY created_at DESC;

-- Cek jadwal yang kelas_id tidak exist di tabel kelas
SELECT
    '=== JADWAL DENGAN KELAS_ID INVALID ===' as check_section,
    jp.id,
    jp.topik,
    jp.kelas_id,  -- UUID yang tidak exist
    jp.tanggal_praktikum,
    jp.laboratorium_id
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
WHERE jp.kelas_id IS NOT NULL
AND k.id IS NULL  -- Kelas tidak ditemukan
ORDER BY jp.created_at DESC;

-- ============================================================================
-- STEP 2: CEK APAKAH ADA KELAS YANG TERSEDIA
-- ============================================================================

SELECT
    '=== KELAS YANG TERSEDIA ===' as check_section,
    id,
    kode_kelas,
    nama_kelas,
    mata_kuliah_id,
    dosen_id,
    is_active
FROM kelas
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 3: OPSI PERBAIKAN
-- ============================================================================

-- OPSI A: HAPUS JADWAL YANG KELAS_ID NULL (jika memang tidak valid)
-- ⚠️ HATI-HATI: Ini akan menghapus jadwal!
-- Uncomment jika yakin ingin menghapus:

/*
DELETE FROM jadwal_praktikum
WHERE kelas_id IS NULL;
*/

-- OPSI B: ASSIGN KELAS VALID ke jadwal yang kelas_id NULL
-- (Anda perlu ganti <UUID_KELAS> dengan ID kelas yang valid)

/*
-- Pilih kelas yang mau di-assign:
SELECT id, kode_kelas, nama_kelas FROM kelas WHERE is_active = true;

-- Update jadwal dengan kelas yang dipilih:
UPDATE jadwal_praktikum
SET kelas_id = '<UUID_KELAS>'  -- Ganti dengan UUID yang valid
WHERE kelas_id IS NULL;
*/

-- OPSI C: HAPUS JADWAL DENGAN KELAS INVALID (kelas sudah dihapus)
/*
DELETE FROM jadwal_praktikum
WHERE id IN (
    SELECT jp.id
    FROM jadwal_praktikum jp
    LEFT JOIN kelas k ON jp.kelas_id = k.id
    WHERE jp.kelas_id IS NOT NULL
    AND k.id IS NULL
);
*/

-- ============================================================================
-- STEP 4: VERIFIKASI SETELAH PERBAIKAN
-- ============================================================================

-- Harusnya tidak ada jadwal dengan kelas_id NULL atau invalid
SELECT
    '=== VERIFICATION AFTER FIX ===' as check_section,
    COUNT(*) as total_jadwal_bermasalah
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
WHERE jp.kelas_id IS NULL
OR (jp.kelas_id IS NOT NULL AND k.id IS NULL);

-- Expected: 0 rows

-- ============================================================================
-- STEP 5: PREVENT FUTURE ISSUES - ENFORCE NOT NULL CONSTRAINT
-- ============================================================================

-- Setelah data dibersihkan, enforce NOT NULL constraint
-- ⚠️ Jalankan ini HANYA setelah yakin semua jadwal punya kelas_id valid

/*
ALTER TABLE jadwal_praktikum
ALTER COLUMN kelas_id SET NOT NULL;
*/

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Jika masih muncul "undefined" setelah fix:
-- 1. Clear browser cache
-- 2. Logout → Login ulang
-- 3. Refresh halaman dashboard
-- 4. Cek console browser untuk error RLS

-- Jika RLS policy issue (kelas tidak ter-load):
-- 1. Apply SQL fix untuk jadwal INSERT (APPLY_FIX_JADWAL_INSERT_DOSEN.sql)
-- 2. Cek RLS policy untuk SELECT kelas
-- 3. Pastikan dosen punya akses ke kelas tersebut

-- ============================================================================
-- END OF FIX SCRIPT
-- ============================================================================
