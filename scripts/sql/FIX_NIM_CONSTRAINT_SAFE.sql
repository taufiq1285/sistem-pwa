-- ============================================================================
-- FIX: Update mahasiswa_nim_format constraint dengan cara AMAN
-- Step 1: Lihat data yang tidak sesuai format
-- Step 2: Hapus atau update data lama
-- Step 3: Update constraint
-- ============================================================================

-- STEP 1: Lihat data mahasiswa yang tidak sesuai format BD2401001
SELECT
  id,
  user_id,
  nim,
  CASE
    WHEN nim ~ '^[A-Z]{2}[0-9]{7}$' THEN '✅ Valid AKBID'
    ELSE '❌ Invalid format'
  END as nim_status
FROM mahasiswa
ORDER BY nim;

-- STEP 2: Hapus data yang tidak valid (atau update nimnya)
-- Opsi A: Hapus semua data mahasiswa lama
DELETE FROM mahasiswa;

-- STEP 3: Drop constraint lama
ALTER TABLE mahasiswa DROP CONSTRAINT mahasiswa_nim_format;

-- STEP 4: Create constraint baru untuk format AKBID (2 huruf + 7 angka)
ALTER TABLE mahasiswa
ADD CONSTRAINT mahasiswa_nim_format
CHECK (nim ~ '^[A-Z]{2}[0-9]{7}$');

-- STEP 5: Verify
SELECT 'Constraint updated successfully!' as status;
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'mahasiswa'
AND constraint_name = 'mahasiswa_nim_format';
