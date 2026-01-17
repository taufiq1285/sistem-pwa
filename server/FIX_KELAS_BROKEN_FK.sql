-- ============================================================================
-- FIX KELAS WITH NULL mata_kuliah_id
-- Script untuk memperbaiki kelas yang tidak punya mata kuliah
-- ============================================================================

-- Step 1: Cek berapa banyak kelas yang broken
SELECT
    COUNT(*) as jumlah_kelas_broken
FROM kelas
WHERE is_active = true AND mata_kuliah_id IS NULL;

-- Step 2: Cek apakah ada mata kuliah di database
SELECT
    COUNT(*) as jumlah_mata_kuliah
FROM mata_kuliah;

-- Step 3: Tampilkan semua mata kuliah yang tersedia
SELECT
    id,
    kode_mk,
    nama_mk,
    semester,
    sks
FROM mata_kuliah
ORDER BY kode_mk;

-- ============================================================================
-- PILIHAN A: Jika sudah ada mata kuliah, assign kelas ke mata kuliah pertama
-- ============================================================================
-- JALANKAN INI jika sudah ada mata kuliah di database

-- Update kelas yang broken dengan mata kuliah pertama yang tersedia
UPDATE kelas
SET mata_kuliah_id = (
    SELECT id
    FROM mata_kuliah
    LIMIT 1
)
WHERE is_active = true
  AND mata_kuliah_id IS NULL;

-- Verify hasil update
SELECT
    k.id,
    k.nama_kelas,
    k.mata_kuliah_id,
    mk.kode_mk,
    mk.nama_mk,
    CASE
        WHEN mk.id IS NULL THEN '❌ BROKEN'
        ELSE '✅ OK'
    END as status
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true;


-- ============================================================================
-- PILIHAN B: Jika belum ada mata kuliah, buat mata kuliah sample dulu
-- ============================================================================
-- JALANKAN INI jika belum ada mata kuliah sama sekali

-- Buat mata kuliah sample
INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, semester, program_studi)
VALUES
    ('IF101', 'Algoritma dan Pemrograman', 4, 1, 'Informatika'),
    ('IF201', 'Struktur Data', 3, 2, 'Informatika'),
    ('IF301', 'Basis Data', 4, 3, 'Informatika')
ON CONFLICT (kode_mk) DO NOTHING;

-- Update kelas dengan mata kuliah yang baru dibuat
UPDATE kelas
SET mata_kuliah_id = (
    SELECT id
    FROM mata_kuliah
    WHERE kode_mk = 'IF101'
    LIMIT 1
)
WHERE is_active = true
  AND mata_kuliah_id IS NULL;

-- Verify hasil
SELECT
    k.id,
    k.nama_kelas,
    k.mata_kuliah_id,
    mk.kode_mk,
    mk.nama_mk,
    CASE
        WHEN mk.id IS NULL THEN '❌ BROKEN'
        ELSE '✅ OK'
    END as status
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true;


-- ============================================================================
-- PILIHAN C: Update kelas spesifik dengan mata kuliah spesifik
-- ============================================================================
-- Gunakan ini jika ingin update satu-satu

-- Format:
-- UPDATE kelas
-- SET mata_kuliah_id = '<ID_MATA_KULIAH_YANG_DIINGINKAN>'
-- WHERE id = '<ID_KELAS>';

-- Contoh:
-- UPDATE kelas
-- SET mata_kuliah_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- WHERE id = 'df6527c4-a1f7-4573-b443-de0533c62479';
