-- ============================================================================
-- MIGRATION STEP 4: Check Kelas Data
-- ============================================================================
-- Jalankan file ini SETELAH STEP 3 untuk mengecek kondisi data kelas
-- ============================================================================

-- Cek berapa kelas yang broken (tanpa mata_kuliah_id)
SELECT
    COUNT(*) as jumlah_kelas_broken,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ Tidak ada kelas broken'
        ELSE '⚠️ Ada kelas yang perlu diperbaiki'
    END as status
FROM kelas
WHERE is_active = true AND mata_kuliah_id IS NULL;

-- Cek berapa mata kuliah yang tersedia
SELECT
    COUNT(*) as jumlah_mata_kuliah,
    CASE
        WHEN COUNT(*) = 0 THEN '⚠️ Belum ada mata kuliah'
        ELSE '✅ Ada mata kuliah'
    END as status
FROM mata_kuliah;

-- Tampilkan semua mata kuliah yang tersedia
SELECT
    id,
    kode_mk,
    nama_mk,
    semester,
    sks,
    program_studi
FROM mata_kuliah
ORDER BY kode_mk;

-- Tampilkan kelas yang broken (jika ada)
SELECT
    id,
    nama_kelas,
    kode_kelas,
    tahun_ajaran,
    semester_ajaran,
    mata_kuliah_id,
    '❌ PERLU DIPERBAIKI' as status
FROM kelas
WHERE is_active = true AND mata_kuliah_id IS NULL;

-- Tampilkan kelas yang OK
SELECT
    k.id,
    k.nama_kelas,
    k.kode_kelas,
    mk.kode_mk,
    mk.nama_mk,
    '✅ OK' as status
FROM kelas k
JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true;

-- ============================================================================
-- INSTRUKSI:
-- ============================================================================
-- 1. Jika "jumlah_mata_kuliah" = 0 (Belum ada mata kuliah):
--    → Jalankan MIGRATION_STEP_5A_create_mata_kuliah.sql
--
-- 2. Jika "jumlah_mata_kuliah" > 0 (Sudah ada mata kuliah):
--    → Jalankan MIGRATION_STEP_5B_fix_kelas.sql
--
-- 3. Jika "jumlah_kelas_broken" = 0 (Tidak ada kelas broken):
--    → SKIP ke testing! Migration selesai!
-- ============================================================================
