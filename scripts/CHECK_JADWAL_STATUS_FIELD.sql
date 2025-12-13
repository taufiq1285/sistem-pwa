-- ============================================================================
-- CHECK: Does jadwal_praktikum have 'status' field?
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Check if status column exists
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
  AND column_name = 'status';

-- Expected Result:
-- If status field EXISTS:
-- column_name | data_type | column_default | is_nullable
-- status      | text      | 'pending'      | NO

-- If EMPTY RESULT → status field DOES NOT EXIST yet

-- ============================================================================
-- CHECK ALL COLUMNS in jadwal_praktikum
-- ============================================================================
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
ORDER BY ordinal_position;

-- Expected columns:
-- id, kelas_id, laboratorium_id, tanggal_praktikum, hari,
-- jam_mulai, jam_selesai, topik, catatan, is_active,
-- created_at, updated_at

-- Check if 'status' is in the list
