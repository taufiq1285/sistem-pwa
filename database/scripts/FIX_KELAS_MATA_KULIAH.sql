-- Script to check and fix kelas mata_kuliah relationships
-- Run this in Supabase SQL Editor

-- 1. Check kelas records that have NULL mata_kuliah_id
SELECT
    id,
    nama_kelas,
    kode_kelas,
    mata_kuliah_id,
    dosen_id,
    is_active,
    created_at
FROM kelas
WHERE mata_kuliah_id IS NULL
ORDER BY created_at DESC;

-- 2. Check if there are any mata_kuliah records available
SELECT
    id,
    nama_mk,
    kode_mk,
    sks,
    is_active
FROM mata_kuliah
ORDER BY nama_mk;

-- 3. Count of kelas with and without mata_kuliah
SELECT
    COUNT(*) as total_kelas,
    COUNT(CASE WHEN mata_kuliah_id IS NOT NULL THEN 1 END) as with_mata_kuliah,
    COUNT(CASE WHEN mata_kuliah_id IS NULL THEN 1 END) as without_mata_kuliah,
    ROUND(
        COUNT(CASE WHEN mata_kuliah_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2
    ) as percentage_with_mk
FROM kelas
WHERE is_active = true;

-- 4. Optional: Update kelas to use a default mata_kuliah if you have one
-- Uncomment and modify if needed:
/*
UPDATE kelas
SET mata_kuliah_id = 'YOUR_DEFAULT_MATA_KULIAH_ID_HERE'
WHERE mata_kuliah_id IS NULL
AND is_active = true;
*/

-- 5. Test the assignment query to see if mata_kuliah relationships work
SELECT
    jp.id as jadwal_id,
    k.id as kelas_id,
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
ORDER BY jp.created_at DESC
LIMIT 10;