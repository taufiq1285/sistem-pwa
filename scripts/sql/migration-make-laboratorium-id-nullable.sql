-- ============================================================================
-- MIGRATION: Make laboratorium_id NULLABLE in inventaris table
-- ============================================================================
-- Tujuan: Inventaris adalah untuk DEPOT PUSAT, tidak harus terikat ke lab tertentu
-- Tanggal: 2025-11-25
-- ============================================================================

-- 1. Make laboratorium_id nullable (drop NOT NULL constraint)
ALTER TABLE inventaris
ALTER COLUMN laboratorium_id DROP NOT NULL;

-- 2. Verify the change
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'inventaris'
    AND column_name = 'laboratorium_id';

-- Expected result: is_nullable should be 'YES'

-- ============================================================================
-- OPTIONAL: Update existing records to NULL if needed
-- ============================================================================
-- Jika ada data existing yang perlu diubah ke NULL (jalankan jika perlu):

-- UPDATE inventaris
-- SET laboratorium_id = NULL
-- WHERE laboratorium_id = 'ID_LAB_YANG_MAU_DIHAPUS';

-- ============================================================================
-- CATATAN PENTING
-- ============================================================================
-- Setelah migration ini:
-- ✅ inventaris bisa disimpan tanpa laboratorium_id (NULL)
-- ✅ Sesuai konsep depot pusat
-- ✅ Form inventaris tidak perlu field Laboratorium
--
-- Jika suatu saat ada alat yang DI-ASSIGN ke lab tertentu:
-- ✅ Bisa set laboratorium_id secara optional
-- ============================================================================
