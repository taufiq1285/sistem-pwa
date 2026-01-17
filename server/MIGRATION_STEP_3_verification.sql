-- ============================================================================
-- MIGRATION STEP 3: Verification
-- ============================================================================
-- Jalankan file ini SETELAH STEP 2G untuk memverifikasi semua berhasil
-- ============================================================================

-- Check if columns exist
SELECT
    column_name,
    data_type,
    is_nullable,
    CASE
        WHEN column_name = 'kelas_id' AND data_type = 'uuid' AND is_nullable = 'YES' THEN '✅'
        WHEN column_name = 'tanggal' AND data_type = 'date' AND is_nullable = 'YES' THEN '✅'
        WHEN column_name = 'jadwal_id' AND is_nullable = 'YES' THEN '✅'
        ELSE '❌'
    END as status
FROM information_schema.columns
WHERE table_name = 'kehadiran'
  AND column_name IN ('kelas_id', 'tanggal', 'jadwal_id')
ORDER BY column_name;

-- Check constraints
SELECT
    conname as constraint_name,
    CASE contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'p' THEN 'PRIMARY KEY'
        ELSE contype::text
    END as constraint_type,
    '✅' as status
FROM pg_constraint
WHERE conrelid = 'kehadiran'::regclass
  AND conname IN (
    'kehadiran_kelas_id_fkey',
    'kehadiran_unique_hybrid',
    'kehadiran_identifier_check'
  )
ORDER BY conname;

-- Check indexes
SELECT
    indexname,
    indexdef,
    '✅' as status
FROM pg_indexes
WHERE tablename = 'kehadiran'
  AND indexname LIKE 'idx_kehadiran_%'
ORDER BY indexname;

-- Check policies
SELECT
    policyname,
    cmd as operation,
    '✅' as status
FROM pg_policies
WHERE tablename = 'kehadiran'
ORDER BY policyname;

-- ============================================================================
-- Expected Results:
-- ============================================================================
-- COLUMNS (should have 3 rows with ✅):
--   - jadwal_id | uuid | YES | ✅
--   - kelas_id  | uuid | YES | ✅
--   - tanggal   | date | YES | ✅
--
-- CONSTRAINTS (should have 3 rows with ✅):
--   - kehadiran_identifier_check | CHECK       | ✅
--   - kehadiran_kelas_id_fkey    | FOREIGN KEY | ✅
--   - kehadiran_unique_hybrid    | UNIQUE      | ✅
--
-- INDEXES (should have 3 rows with ✅):
--   - idx_kehadiran_kelas_id
--   - idx_kehadiran_kelas_tanggal
--   - idx_kehadiran_tanggal
--
-- POLICIES (should have 5 rows with ✅):
--   - kehadiran_admin_all
--   - kehadiran_insert_dosen
--   - kehadiran_select_dosen
--   - kehadiran_select_mahasiswa
--   - kehadiran_update_dosen
-- ============================================================================

-- ============================================================================
-- JIKA SEMUA ✅, lanjut ke MIGRATION_STEP_4 (Fix Data Kelas)
-- ============================================================================
