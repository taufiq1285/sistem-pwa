-- Script to fix kelas mata_kuliah assignments
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. CHECK CURRENT STATE
-- ============================================================================

-- Check how many kelas have and don't have mata_kuliah_id
SELECT
    COUNT(*) as total_kelas,
    COUNT(CASE WHEN mata_kuliah_id IS NOT NULL THEN 1 END) as with_mata_kuliah,
    COUNT(CASE WHEN mata_kuliah_id IS NULL THEN 1 END) as without_mata_kuliah
FROM kelas
WHERE is_active = true;

-- List kelas without mata_kuliah
SELECT
    id,
    nama_kelas,
    kode_kelas,
    mata_kuliah_id,
    is_active,
    created_at
FROM kelas
WHERE mata_kuliah_id IS NULL
    AND is_active = true
ORDER BY created_at DESC;

-- Check available mata_kuliah
SELECT
    id,
    nama_mk,
    kode_mk,
    sks,
    is_active
FROM mata_kuliah
WHERE is_active = true
ORDER BY nama_mk;

-- ============================================================================
-- 2. BATCH UPDATE OPTIONS
-- ============================================================================

-- Option 1: Assign a default mata_kuliah to all kelas without one
-- First, pick a mata_kuliah_id from the query above
-- UPDATE kelas
-- SET mata_kuliah_id = 'YOUR_CHOSEN_MATA_KULIAH_ID_HERE'
-- WHERE mata_kuliah_id IS NULL
--     AND is_active = true;

-- Option 2: Update specific kelas with specific mata_kuliah (example)
-- UPDATE kelas
-- SET mata_kuliah_id = 'e.g., 123e4567-e89b-12d3-a456-426614174000'
-- WHERE id = 'YOUR_KELAS_ID_HERE';

-- ============================================================================
-- 3. VERIFY FIXES
-- ============================================================================

-- Re-check the counts after updates
SELECT
    COUNT(*) as total_kelas,
    COUNT(CASE WHEN mata_kuliah_id IS NOT NULL THEN 1 END) as with_mata_kuliah,
    COUNT(CASE WHEN mata_kuliah_id IS NULL THEN 1 END) as without_mata_kuliah,
    ROUND(
        COUNT(CASE WHEN mata_kuliah_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2
    ) as percentage_with_mk
FROM kelas
WHERE is_active = true;

-- Test the assignment query with mata_kuliah
SELECT
    jp.id,
    k.nama_kelas,
    k.mata_kuliah_id,
    mk.nama_mk,
    mk.kode_mk,
    CASE
        WHEN mk.id IS NOT NULL THEN 'Mata kuliah loaded'
        ELSE 'Mata kuliah NOT loaded'
    END as mk_status
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE jp.is_active = true
    AND k.is_active = true
ORDER BY jp.created_at DESC
LIMIT 5;