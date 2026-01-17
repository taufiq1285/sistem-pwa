/**
 * FASE 3: Optimistic Locking - ADJUSTED FOR EXISTING DATABASE
 *
 * PERUBAHAN DARI VERSI ASLI:
 * - Handle existing kuis.version column
 * - Handle existing conflict_log table
 * - Use correct table names (attempt_kuis, jawaban, not kuis_jawaban)
 * - Configurable table list
 *
 * SAFE FEATURES:
 * - Checks if tables exist before ALTER
 * - Checks if columns exist before ADD
 * - Checks if triggers exist before CREATE
 * - Idempotent (can run multiple times safely)
 * - Skips what already exists
 *
 * BEFORE RUNNING:
 * 1. Run: supabase/check-database-structure.sql
 * 2. Review output
 * 3. Adjust v_tables array below
 * 4. Backup your database
 */

-- ============================================================================
-- CONFIGURATION
-- ============================================================================

DO $$
DECLARE
  -- ⚠️ ADJUST THIS ARRAY BASED ON YOUR NEEDS ⚠️
  -- Options:
  -- - Minimal: ['attempt_kuis', 'jawaban']
  -- - Standard: ['attempt_kuis', 'jawaban', 'nilai', 'kehadiran']
  -- - Full: ['attempt_kuis', 'jawaban', 'nilai', 'kehadiran', 'materi', 'soal']

  v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban']; -- 👈 EDIT THIS LINE

  -- Internal variables
  v_table TEXT;
  v_column_exists BOOLEAN;
  v_trigger_exists BOOLEAN;
  v_function_exists BOOLEAN;
  v_tables_updated INTEGER := 0;
  v_columns_added INTEGER := 0;
  v_triggers_created INTEGER := 0;
  v_functions_created INTEGER := 0;
  v_kuis_has_version BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 3: Optimistic Locking Migration';
  RAISE NOTICE 'ADJUSTED for Existing Database';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Configuration:';
  RAISE NOTICE '  Tables to process: %', array_length(v_tables, 1);
  RAISE NOTICE '  Table list: %', array_to_string(v_tables, ', ');
  RAISE NOTICE '';

  -- ============================================================================
  -- 1. CHECK SPECIAL CASES
  -- ============================================================================

  RAISE NOTICE '--- Checking special cases ---';
  RAISE NOTICE '';

  -- Check if kuis table has 'version' column
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'kuis'
    AND column_name = 'version'
  ) INTO v_kuis_has_version;

  IF v_kuis_has_version THEN
    RAISE NOTICE '⚠️  Table kuis has existing "version" column';
    RAISE NOTICE '   This will be SKIPPED. Use kuis.version or rename to _version manually.';
    RAISE NOTICE '';
  END IF;

  -- ============================================================================
  -- 2. CREATE VERSION INCREMENT FUNCTION
  -- ============================================================================

  RAISE NOTICE '--- Creating version increment function ---';
  RAISE NOTICE '';

  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'increment_version'
    AND pg_function_is_visible(oid)
  ) INTO v_function_exists;

  IF NOT v_function_exists THEN
    CREATE OR REPLACE FUNCTION increment_version()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW._version = COALESCE(OLD._version, 0) + 1;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    RAISE NOTICE '✅ Created function: increment_version()';
    v_functions_created := v_functions_created + 1;
  ELSE
    RAISE NOTICE '⚪ Function increment_version() already exists (skipping)';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- 3. ADD _VERSION COLUMNS AND TRIGGERS
  -- ============================================================================

  RAISE NOTICE '--- Processing tables ---';
  RAISE NOTICE '';

  FOREACH v_table IN ARRAY v_tables
  LOOP
    RAISE NOTICE 'Processing table: %', v_table;

    -- Skip kuis if it has existing version column
    IF v_table = 'kuis' AND v_kuis_has_version THEN
      RAISE NOTICE '  ⚠️  Skipped (has existing version column)';
      RAISE NOTICE '';
      CONTINUE;
    END IF;

    -- Check if table exists
    IF NOT EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = v_table
    ) THEN
      RAISE NOTICE '  ⚠️  Table does not exist (skipping)';
      RAISE NOTICE '';
      CONTINUE;
    END IF;

    -- Check if _version column exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = v_table
      AND column_name = '_version'
    ) INTO v_column_exists;

    IF NOT v_column_exists THEN
      -- Add _version column
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN _version INTEGER DEFAULT 1 NOT NULL',
        v_table
      );
      RAISE NOTICE '  ✅ Added _version column';
      v_columns_added := v_columns_added + 1;
    ELSE
      RAISE NOTICE '  ⚪ Column _version already exists';
    END IF;

    -- Check if trigger exists
    SELECT EXISTS (
      SELECT FROM pg_trigger
      WHERE tgname = 'trigger_increment_' || v_table || '_version'
    ) INTO v_trigger_exists;

    IF NOT v_trigger_exists THEN
      -- Create trigger
      EXECUTE format(
        'DROP TRIGGER IF EXISTS trigger_increment_%I_version ON %I',
        v_table, v_table
      );

      EXECUTE format(
        'CREATE TRIGGER trigger_increment_%I_version
         BEFORE UPDATE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION increment_version()',
        v_table, v_table
      );

      RAISE NOTICE '  ✅ Created version increment trigger';
      v_triggers_created := v_triggers_created + 1;
    ELSE
      RAISE NOTICE '  ⚪ Trigger already exists';
    END IF;

    v_tables_updated := v_tables_updated + 1;
    RAISE NOTICE '';
  END LOOP;

  -- ============================================================================
  -- 4. CREATE HELPER FUNCTIONS
  -- ============================================================================

  RAISE NOTICE '--- Creating helper functions ---';
  RAISE NOTICE '';

  -- Function: check_version_conflict
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'check_version_conflict'
    AND pg_function_is_visible(oid)
  ) INTO v_function_exists;

  IF NOT v_function_exists THEN
    CREATE OR REPLACE FUNCTION check_version_conflict(
      p_table_name TEXT,
      p_id UUID,
      p_expected_version INTEGER
    )
    RETURNS TABLE (
      has_conflict BOOLEAN,
      current_version INTEGER,
      expected_version INTEGER,
      message TEXT
    ) AS $func$
    DECLARE
      v_current_version INTEGER;
    BEGIN
      -- Get current version from table
      EXECUTE format('SELECT _version FROM %I WHERE id = $1', p_table_name)
      INTO v_current_version
      USING p_id;

      -- Check if record exists
      IF v_current_version IS NULL THEN
        RETURN QUERY SELECT
          TRUE,
          0,
          p_expected_version,
          'Record not found'::TEXT;
        RETURN;
      END IF;

      -- Check version match
      IF v_current_version != p_expected_version THEN
        RETURN QUERY SELECT
          TRUE,
          v_current_version,
          p_expected_version,
          format('Version conflict: expected %s, got %s', p_expected_version, v_current_version)::TEXT;
      ELSE
        RETURN QUERY SELECT
          FALSE,
          v_current_version,
          p_expected_version,
          'Version OK'::TEXT;
      END IF;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    RAISE NOTICE '✅ Created function: check_version_conflict()';
    v_functions_created := v_functions_created + 1;
  ELSE
    RAISE NOTICE '⚪ Function check_version_conflict() already exists';
  END IF;

  -- Function: safe_update_with_version
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'safe_update_with_version'
    AND pg_function_is_visible(oid)
  ) INTO v_function_exists;

  IF NOT v_function_exists THEN
    CREATE OR REPLACE FUNCTION safe_update_with_version(
      p_table_name TEXT,
      p_id UUID,
      p_expected_version INTEGER,
      p_data JSONB
    )
    RETURNS TABLE (
      success BOOLEAN,
      new_version INTEGER,
      error TEXT
    ) AS $func$
    DECLARE
      v_current_version INTEGER;
      v_new_version INTEGER;
      v_set_clause TEXT;
      v_key TEXT;
      v_value TEXT;
    BEGIN
      -- Get current version
      EXECUTE format('SELECT _version FROM %I WHERE id = $1', p_table_name)
      INTO v_current_version
      USING p_id;

      -- Check version match
      IF v_current_version IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 'Record not found';
        RETURN;
      END IF;

      IF v_current_version != p_expected_version THEN
        RETURN QUERY SELECT
          FALSE,
          v_current_version,
          format('Version conflict: expected %s, current is %s', p_expected_version, v_current_version);
        RETURN;
      END IF;

      -- Build SET clause from JSONB
      v_set_clause := '';
      FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_data)
      LOOP
        IF v_set_clause != '' THEN
          v_set_clause := v_set_clause || ', ';
        END IF;
        v_set_clause := v_set_clause || format('%I = %L', v_key, v_value);
      END LOOP;

      -- Execute update (version will auto-increment via trigger)
      EXECUTE format('UPDATE %I SET %s WHERE id = $1 RETURNING _version', p_table_name, v_set_clause)
      INTO v_new_version
      USING p_id;

      RETURN QUERY SELECT TRUE, v_new_version, NULL::TEXT;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    RAISE NOTICE '✅ Created function: safe_update_with_version()';
    v_functions_created := v_functions_created + 1;
  ELSE
    RAISE NOTICE '⚪ Function safe_update_with_version() already exists';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- 5. HANDLE CONFLICT_LOG TABLE
  -- ============================================================================

  RAISE NOTICE '--- Checking conflict_log table ---';
  RAISE NOTICE '';

  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'conflict_log'
  ) THEN
    RAISE NOTICE '⚠️  Table conflict_log already exists';
    RAISE NOTICE '   Checking if it has required columns...';

    -- Check for required columns
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'conflict_log'
      AND column_name = 'local_version'
    ) THEN
      RAISE NOTICE '   ⚠️  Missing column: local_version';
      RAISE NOTICE '   Consider running:';
      RAISE NOTICE '   ALTER TABLE conflict_log ADD COLUMN local_version INTEGER;';
    END IF;

    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'conflict_log'
      AND column_name = 'remote_version'
    ) THEN
      RAISE NOTICE '   ⚠️  Missing column: remote_version';
      RAISE NOTICE '   Consider running:';
      RAISE NOTICE '   ALTER TABLE conflict_log ADD COLUMN remote_version INTEGER;';
    END IF;

    RAISE NOTICE '   ℹ️  Skipping conflict_log creation (already exists)';
  ELSE
    -- Create conflict_log table
    CREATE TABLE conflict_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity TEXT NOT NULL,
      entity_id UUID NOT NULL,
      user_id UUID REFERENCES auth.users(id),

      -- Version tracking
      local_version INTEGER,
      remote_version INTEGER,

      -- Data snapshots
      local_data JSONB,
      remote_data JSONB,

      -- Resolution
      resolution TEXT, -- 'auto', 'manual', 'rejected'
      winner TEXT, -- 'local', 'remote', 'merged'
      merged_data JSONB,

      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      resolved_by UUID REFERENCES auth.users(id),

      -- Status
      status TEXT DEFAULT 'pending',

      CONSTRAINT conflict_log_status_check CHECK (status IN ('pending', 'resolved', 'rejected')),
      CONSTRAINT conflict_log_resolution_check CHECK (resolution IN ('auto', 'manual', 'rejected') OR resolution IS NULL)
    );

    -- Indexes
    CREATE INDEX idx_conflict_log_entity ON conflict_log(entity, entity_id);
    CREATE INDEX idx_conflict_log_user ON conflict_log(user_id);
    CREATE INDEX idx_conflict_log_status ON conflict_log(status);
    CREATE INDEX idx_conflict_log_created ON conflict_log(created_at DESC);

    -- RLS
    ALTER TABLE conflict_log ENABLE ROW LEVEL SECURITY;

    -- Policies
    CREATE POLICY "Users can view own conflicts"
      ON conflict_log FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create conflict logs"
      ON conflict_log FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    -- Admin can view all
    DO $policy$
    BEGIN
      IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
        EXECUTE $$
          CREATE POLICY "Admin can view all conflicts"
            ON conflict_log FOR SELECT
            USING (
              EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role = 'admin'
              )
            );
        $$;
      END IF;
    END $policy$;

    RAISE NOTICE '✅ Created table: conflict_log with RLS policies';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- 6. CREATE LOG_CONFLICT FUNCTION
  -- ============================================================================

  RAISE NOTICE '--- Creating log_conflict function ---';
  RAISE NOTICE '';

  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'log_conflict'
    AND pg_function_is_visible(oid)
  ) INTO v_function_exists;

  IF NOT v_function_exists THEN
    CREATE OR REPLACE FUNCTION log_conflict(
      p_entity TEXT,
      p_entity_id UUID,
      p_local_version INTEGER,
      p_remote_version INTEGER,
      p_local_data JSONB,
      p_remote_data JSONB
    )
    RETURNS UUID AS $func$
    DECLARE
      v_conflict_id UUID;
    BEGIN
      INSERT INTO conflict_log (
        entity,
        entity_id,
        user_id,
        local_version,
        remote_version,
        local_data,
        remote_data,
        resolution,
        status
      )
      VALUES (
        p_entity,
        p_entity_id,
        auth.uid(),
        p_local_version,
        p_remote_version,
        p_local_data,
        p_remote_data,
        'manual',
        'pending'
      )
      RETURNING id INTO v_conflict_id;

      RETURN v_conflict_id;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    RAISE NOTICE '✅ Created function: log_conflict()';
    v_functions_created := v_functions_created + 1;
  ELSE
    RAISE NOTICE '⚪ Function log_conflict() already exists';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- 7. GRANT PERMISSIONS
  -- ============================================================================

  RAISE NOTICE '--- Granting permissions ---';
  RAISE NOTICE '';

  GRANT EXECUTE ON FUNCTION increment_version() TO authenticated;
  GRANT EXECUTE ON FUNCTION check_version_conflict(TEXT, UUID, INTEGER) TO authenticated;
  GRANT EXECUTE ON FUNCTION safe_update_with_version(TEXT, UUID, INTEGER, JSONB) TO authenticated;
  GRANT EXECUTE ON FUNCTION log_conflict(TEXT, UUID, INTEGER, INTEGER, JSONB, JSONB) TO authenticated;

  RAISE NOTICE '✅ Granted execute permissions on functions';
  RAISE NOTICE '';

  -- ============================================================================
  -- 8. ADD COMMENTS
  -- ============================================================================

  RAISE NOTICE '--- Adding comments ---';
  RAISE NOTICE '';

  COMMENT ON FUNCTION increment_version() IS 'FASE 3: Auto-increment _version on UPDATE';
  COMMENT ON FUNCTION check_version_conflict(TEXT, UUID, INTEGER) IS 'FASE 3: Check for version conflicts';
  COMMENT ON FUNCTION safe_update_with_version(TEXT, UUID, INTEGER, JSONB) IS 'FASE 3: Update with optimistic locking';
  COMMENT ON FUNCTION log_conflict(TEXT, UUID, INTEGER, INTEGER, JSONB, JSONB) IS 'FASE 3: Log conflict for manual resolution';
  COMMENT ON TABLE conflict_log IS 'FASE 3: Conflict log for manual resolution';

  FOREACH v_table IN ARRAY v_tables
  LOOP
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = v_table
      AND column_name = '_version'
    ) THEN
      EXECUTE format(
        'COMMENT ON COLUMN %I._version IS ''FASE 3: Optimistic locking version''',
        v_table
      );
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Added comments to objects';
  RAISE NOTICE '';

  -- ============================================================================
  -- 9. SUMMARY
  -- ============================================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables processed: %', v_tables_updated;
  RAISE NOTICE 'Columns added: %', v_columns_added;
  RAISE NOTICE 'Triggers created: %', v_triggers_created;
  RAISE NOTICE 'Functions created: %', v_functions_created;
  RAISE NOTICE '';

  IF v_kuis_has_version THEN
    RAISE NOTICE '⚠️  WARNINGS:';
    RAISE NOTICE '   - Table kuis has existing "version" column';
    RAISE NOTICE '   - This was NOT modified by migration';
    RAISE NOTICE '   - Either rename manually or update code to use it';
    RAISE NOTICE '';
  END IF;

  RAISE NOTICE 'Status: ✅ COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Show all tables with _version column
SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = '_version'
ORDER BY table_name;

-- Show version triggers
SELECT
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%version%'
ORDER BY event_object_table;

-- Show created functions
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('increment_version', 'check_version_conflict', 'safe_update_with_version', 'log_conflict')
ORDER BY routine_name;

-- Show conflict_log structure
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'conflict_log'
ORDER BY ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review verification queries above';
  RAISE NOTICE '2. Test version increment with UPDATE';
  RAISE NOTICE '3. Update frontend code to use _version field';
  RAISE NOTICE '4. Deploy smart-conflict-resolver.ts';
  RAISE NOTICE '5. Monitor conflict_log table';
  RAISE NOTICE '';
END $$;
