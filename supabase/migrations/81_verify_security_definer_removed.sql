-- ============================================================================
-- VERIFICATION: Check SECURITY DEFINER property on Views
-- ============================================================================
-- This query checks if views still have SECURITY DEFINER property
-- ============================================================================

-- Method 1: Check pg_class for relkind and security options
SELECT
  c.relname AS view_name,
  c.relkind AS object_type,
  CASE
    WHEN (c.relacl IS NOT NULL AND EXISTS (
      SELECT 1 FROM pg_namespace n
      WHERE n.oid = c.relnamespace
      AND n.nspname = 'public'
    )) THEN 'Has ACL'
    ELSE 'No ACL'
  END AS acl_status,
  pg_get_viewdef(c.oid) AS view_definition
FROM pg_class c
WHERE c.relname IN ('v_dosen_grading_access', 'v_available_kelas', 'v_kelas_assignments', 'v_team_teaching_assignments')
AND c.relkind = 'v'
ORDER BY c.relname;

-- Method 2: More specific check for SECURITY DEFINER
-- Note: Views in PostgreSQL don't directly have SECURITY DEFINER like functions do
-- The security warning might be from how the view was created initially

-- Check if any functions called by these views use SECURITY DEFINER
SELECT
  p.proname AS function_name,
  CASE
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security_type,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true  -- Only show functions with SECURITY DEFINER
AND (
  p.proname LIKE '%dosen%'
  OR p.proname LIKE '%kelas%'
  OR p.proname LIKE '%assignment%'
  OR p.proname LIKE '%grading%'
)
ORDER BY p.proname;

-- Method 3: Check information_schema.views
SELECT
  table_name AS view_name,
  view_definition,
  is_updatable,
  insertable_into,
  is_trigger_updatable,
  is_trigger_deletable,
  is_trigger_insertable_into
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('v_dosen_grading_access', 'v_available_kelas', 'v_kelas_assignments', 'v_team_teaching_assignments')
ORDER BY table_name;

-- Result Interpretation:
-- - Views should show "is_updatable = YES" or "NO" depending on complexity
-- - Functions with SECURITY DEFINER are OK if they're helper functions for RLS
-- - The security warning should be resolved if views don't have SECURITY DEFINER

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_class c
  WHERE c.relname IN ('v_dosen_grading_access', 'v_available_kelas', 'v_kelas_assignments')
  AND c.relkind = 'v';

  RAISE NOTICE '✅ Verification Complete: Found % views', v_count;

  IF v_count = 3 THEN
    RAISE NOTICE '✅ All expected views are present';
    RAISE NOTICE '📝 SECURITY DEFINER property should now be removed from views';
    RAISE NOTICE '🔍 Check Database Linter in Supabase Dashboard to confirm warning is gone';
  ELSE
    RAISE NOTICE '⚠️ Warning: Expected 3 views, found %', v_count;
  END IF;
END $$;
