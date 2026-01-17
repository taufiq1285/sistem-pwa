/**
 * CHECK FASE 3 STATUS
 *
 * Purpose: Verify Week 3-4 Fase 3 Implementation Status
 * - Check versioning columns
 * - Check conflict_log table
 * - Check helper functions
 * - Check triggers
 */

-- ============================================================================
-- 1. CHECK VERSION COLUMNS
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'FASE 3 STATUS CHECK'
\echo '========================================'
\echo ''
\echo '--- 1. VERSION COLUMNS ---'
\echo ''

SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name IN ('_version', 'version')
ORDER BY table_name;

-- ============================================================================
-- 2. CHECK VERSION INCREMENT TRIGGERS
-- ============================================================================

\echo ''
\echo '--- 2. VERSION INCREMENT TRIGGERS ---'
\echo ''

SELECT
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%version%'
ORDER BY event_object_table;

-- ============================================================================
-- 3. CHECK CONFLICT_LOG TABLE
-- ============================================================================

\echo ''
\echo '--- 3. CONFLICT_LOG TABLE ---'
\echo ''

SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'conflict_log'
) AS conflict_log_exists;

-- Show structure if exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'conflict_log') THEN
    RAISE NOTICE 'Conflict log table structure:';
  END IF;
END $$;

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'conflict_log'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. CHECK HELPER FUNCTIONS
-- ============================================================================

\echo ''
\echo '--- 4. HELPER FUNCTIONS ---'
\echo ''

SELECT
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition LIKE '%_version%' as handles_version
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'increment_version',
  'check_version_conflict',
  'safe_update_with_version',
  'log_conflict',
  'resolve_conflict'
)
ORDER BY routine_name;

-- ============================================================================
-- 5. CHECK RLS POLICIES ON CONFLICT_LOG
-- ============================================================================

\echo ''
\echo '--- 5. CONFLICT_LOG RLS POLICIES ---'
\echo ''

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'conflict_log'
ORDER BY policyname;

-- ============================================================================
-- 6. TEST VERSION INCREMENT
-- ============================================================================

\echo ''
\echo '--- 6. TEST VERSION INCREMENT (if kuis table has _version) ---'
\echo ''

DO $$
DECLARE
  v_has_version BOOLEAN;
  v_test_id UUID;
  v_version_before INTEGER;
  v_version_after INTEGER;
BEGIN
  -- Check if kuis has _version
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'kuis'
    AND column_name = '_version'
  ) INTO v_has_version;

  IF v_has_version THEN
    -- Get a test record
    SELECT id, _version INTO v_test_id, v_version_before
    FROM kuis
    LIMIT 1;

    IF v_test_id IS NOT NULL THEN
      RAISE NOTICE 'Testing version increment on kuis table...';
      RAISE NOTICE 'Record ID: %', v_test_id;
      RAISE NOTICE 'Version before: %', v_version_before;

      -- Update to trigger version increment
      UPDATE kuis
      SET updated_at = NOW()
      WHERE id = v_test_id;

      -- Check version after
      SELECT _version INTO v_version_after
      FROM kuis
      WHERE id = v_test_id;

      RAISE NOTICE 'Version after: %', v_version_after;

      IF v_version_after = v_version_before + 1 THEN
        RAISE NOTICE '✅ Version increment working correctly!';
      ELSE
        RAISE WARNING '❌ Version increment NOT working! Expected %, got %',
          v_version_before + 1, v_version_after;
      END IF;

      -- Rollback the test update
      UPDATE kuis
      SET _version = v_version_before
      WHERE id = v_test_id;

      RAISE NOTICE 'Rolled back test update';
    ELSE
      RAISE NOTICE 'No kuis records found for testing';
    END IF;
  ELSE
    RAISE NOTICE 'Table kuis does not have _version column - migration not run yet';
  END IF;
END $$;

-- ============================================================================
-- 7. SUMMARY
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'SUMMARY'
\echo '========================================'

DO $$
DECLARE
  v_version_count INTEGER;
  v_trigger_count INTEGER;
  v_function_count INTEGER;
  v_conflict_log_exists BOOLEAN;
  v_status TEXT;
BEGIN
  -- Count version columns
  SELECT COUNT(*)
  INTO v_version_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name IN ('_version', 'version');

  -- Count triggers
  SELECT COUNT(*)
  INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%version%';

  -- Count functions
  SELECT COUNT(*)
  INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'increment_version',
    'check_version_conflict',
    'safe_update_with_version',
    'log_conflict',
    'resolve_conflict'
  );

  -- Check conflict_log
  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'conflict_log'
  ) INTO v_conflict_log_exists;

  -- Determine status
  IF v_version_count >= 2 AND v_trigger_count >= 2 AND v_function_count >= 3 AND v_conflict_log_exists THEN
    v_status := '✅ FASE 3 FULLY IMPLEMENTED';
  ELSIF v_version_count > 0 OR v_trigger_count > 0 OR v_function_count > 0 THEN
    v_status := '⚠️  FASE 3 PARTIALLY IMPLEMENTED';
  ELSE
    v_status := '❌ FASE 3 NOT IMPLEMENTED';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Status: %', v_status;
  RAISE NOTICE '';
  RAISE NOTICE 'Components:';
  RAISE NOTICE '  Version columns: % tables', v_version_count;
  RAISE NOTICE '  Version triggers: %', v_trigger_count;
  RAISE NOTICE '  Helper functions: %', v_function_count;
  RAISE NOTICE '  Conflict log table: %', CASE WHEN v_conflict_log_exists THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE '';

  IF v_status != '✅ FASE 3 FULLY IMPLEMENTED' THEN
    RAISE NOTICE 'NEXT STEPS:';
    IF v_version_count = 0 THEN
      RAISE NOTICE '  1. Run migration: supabase/migrations/fase3_optimistic_locking_ADJUSTED.sql';
    END IF;
    IF NOT v_conflict_log_exists THEN
      RAISE NOTICE '  2. Create conflict_log table (included in migration)';
    END IF;
    IF v_function_count < 3 THEN
      RAISE NOTICE '  3. Create helper functions (included in migration)';
    END IF;
  ELSE
    RAISE NOTICE 'WEEK 3 CHECKLIST:';
    RAISE NOTICE '  ✅ Run versioning SQL migration';
    RAISE NOTICE '  ⏳ Enable smart conflict resolver (check code)';
    RAISE NOTICE '  ⏳ Keep fallbackToLWW = true';
    RAISE NOTICE '  ⏳ Monitor field conflict logs';
    RAISE NOTICE '';
    RAISE NOTICE 'WEEK 4 CHECKLIST:';
    RAISE NOTICE '  ⏳ Add manual resolution UI';
    RAISE NOTICE '  ⏳ Enable optimistic locking checks';
    RAISE NOTICE '  ⏳ Test with real users';
    RAISE NOTICE '  ⏳ Adjust business rules if needed';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
