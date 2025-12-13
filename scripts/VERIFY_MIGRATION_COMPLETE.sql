-- ============================================================================
-- VERIFICATION CHECKLIST FOR MIGRATION 45
-- Run this to verify the hybrid approval workflow migration is complete
-- ============================================================================

-- 1. Check if new columns exist in jadwal_praktikum
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
  AND column_name IN ('status', 'cancelled_by', 'cancelled_at', 'cancellation_reason')
ORDER BY column_name;

-- Expected: 4 rows
-- - status (VARCHAR, default 'approved', NOT NULL)
-- - cancelled_by (UUID, nullable)
-- - cancelled_at (TIMESTAMPTZ, nullable)
-- - cancellation_reason (TEXT, nullable)

-- ============================================================================

-- 2. Check if functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('cancel_jadwal_praktikum', 'reactivate_jadwal_praktikum')
ORDER BY routine_name;

-- Expected: 2 rows
-- - cancel_jadwal_praktikum (FUNCTION)
-- - reactivate_jadwal_praktikum (FUNCTION)

-- ============================================================================

-- 3. Check if view exists (you already verified this ✅)
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'active_jadwal_praktikum';

-- Expected: 1 row
-- - active_jadwal_praktikum (VIEW) ✅ VERIFIED

-- ============================================================================

-- 4. Check if indexes exist
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'jadwal_praktikum'
  AND indexname LIKE '%status%'
ORDER BY indexname;

-- Expected: 1 row
-- - idx_jadwal_praktikum_status

-- ============================================================================

-- 5. Verify existing jadwal have status = 'approved'
SELECT
  status,
  COUNT(*) as total
FROM jadwal_praktikum
GROUP BY status
ORDER BY status;

-- Expected: All should show 'approved'

-- ============================================================================

-- 6. Test the cancel function (READ ONLY - just check permissions)
SELECT
  p.proname as function_name,
  pg_catalog.pg_get_function_arguments(p.oid) as arguments,
  r.rolname as granted_to
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_proc_acl pa ON p.oid = pa.oid
LEFT JOIN pg_roles r ON pa.grantee = r.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('cancel_jadwal_praktikum', 'reactivate_jadwal_praktikum')
ORDER BY function_name;

-- Expected: Should show grants to 'authenticated' role

-- ============================================================================
-- SUMMARY CHECKLIST:
-- ============================================================================
-- [ ] 4 columns added to jadwal_praktikum
-- [ ] 2 functions created (cancel, reactivate)
-- [✅] 1 view created (active_jadwal_praktikum) - VERIFIED
-- [ ] 1 index created (status)
-- [ ] All existing jadwal have status = 'approved'
-- ============================================================================
