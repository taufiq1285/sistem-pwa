-- ============================================================================
-- EMERGENCY FIX: Temporarily Disable RLS on jadwal_praktikum
-- ============================================================================
-- This will help us test if RLS is causing the hang
-- ============================================================================

-- BACKUP: Check current RLS status
SELECT
  tablename,
  rowsecurity as rls_currently_enabled
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';

-- TEMPORARILY DISABLE RLS (for testing only!)
ALTER TABLE jadwal_praktikum DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
  tablename,
  rowsecurity as rls_now_disabled
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';

-- ============================================================================
-- NOW TEST: Try to create jadwal in the application
-- If this works, the problem is definitely the RLS policy
-- ============================================================================

-- After testing, RE-ENABLE RLS:
-- ALTER TABLE jadwal_praktikum ENABLE ROW LEVEL SECURITY;
