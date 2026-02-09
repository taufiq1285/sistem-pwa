-- QUICK FIX: Assign Mata Kuliah to Kelas
-- Run this in Supabase SQL Editor

-- Step 1: Check your mata_kuliah options first
SELECT id, nama_mk, kode_mk FROM mata_kuliah WHERE is_active = true ORDER BY nama_mk;

-- Step 2: Choose ONE mata_kuliah to assign to all kelas that don't have one
-- Replace 'YOUR_MATA_KULIAH_ID_HERE' with an actual ID from the query above

-- Example: If you have mata_kuliah with ID '123e4567-e89b-12d3-a456-426614174000'
-- UPDATE kelas
-- SET mata_kuliah_id = '123e4567-e89b-12d3-a456-426614174000'
-- WHERE mata_kuliah_id IS NULL
-- AND is_active = true;

-- Step 3: Verify the fix
SELECT
    COUNT(*) as total_kelas,
    COUNT(CASE WHEN mata_kuliah_id IS NOT NULL THEN 1 END) as with_mk,
    COUNT(CASE WHEN mata_kuliah_id IS NULL THEN 1 END) as without_mk
FROM kelas
WHERE is_active = true;

-- Step 4: Test the assignment query
SELECT
    jp.id,
    k.nama_kelas,
    k.mata_kuliah_id,
    mk.nama_mk,
    mk.kode_mk,
    CASE
        WHEN mk.id IS NOT NULL THEN 'Mata kuliah loaded ✓'
        ELSE 'Mata kuliah NOT loaded ✗'
    END as status
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE jp.is_active = true
ORDER BY jp.created_at DESC
LIMIT 10;