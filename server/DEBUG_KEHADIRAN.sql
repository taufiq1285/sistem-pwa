-- ============================================================================
-- DEBUG: Check Kehadiran Data
-- ============================================================================

-- 1. Check if mata_kuliah_id column exists
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'kehadiran'
  AND column_name IN ('kelas_id', 'tanggal', 'mata_kuliah_id')
ORDER BY column_name;

-- 2. Check recent kehadiran records
SELECT
    id,
    kelas_id,
    mata_kuliah_id,
    tanggal,
    status,
    created_at
FROM kehadiran
ORDER BY created_at DESC
LIMIT 5;

-- 3. Count records with/without mata_kuliah_id
SELECT
    COUNT(*) as total_records,
    COUNT(mata_kuliah_id) as with_mata_kuliah,
    COUNT(*) - COUNT(mata_kuliah_id) as without_mata_kuliah
FROM kehadiran;

-- 4. Check if kelas has mata_kuliah_id
SELECT
    id,
    nama_kelas,
    mata_kuliah_id
FROM kelas
LIMIT 5;

-- 5. Sample kehadiran with joins
SELECT
    k.id,
    k.tanggal,
    kelas.nama_kelas,
    mk.nama_mk as mata_kuliah_dari_kehadiran,
    mk2.nama_mk as mata_kuliah_dari_kelas
FROM kehadiran k
LEFT JOIN kelas ON k.kelas_id = kelas.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN mata_kuliah mk2 ON kelas.mata_kuliah_id = mk2.id
WHERE k.tanggal IS NOT NULL
ORDER BY k.created_at DESC
LIMIT 5;
