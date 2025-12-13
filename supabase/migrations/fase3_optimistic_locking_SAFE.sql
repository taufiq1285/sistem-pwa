/**
 * FASE 3: Optimistic Locking - SAFE VERSION
 *
 * SAFE FEATURES:
 * - Checks if tables exist before ALTER
 * - Checks if columns exist before ADD
 * - Checks if triggers exist before CREATE
 * - Idempotent (can run multiple times safely)
 * - Skips tables that don't exist
 * - Reports what was done
 *
 * RUN THIS FIRST: supabase/check-database-structure.sql
 * Then adjust this migration based on results
 */

-- ============================================================================
-- CONFIGURATION
-- Set tables to add versioning to (adjust based on your database)
-- ============================================================================

DO $$
DECLARE
  v_tables TEXT[] := ARRAY['kuis', 'kuis_jawaban', 'nilai', 'materi']; -- Adjust this!
  v_table TEXT;
  v_column_exists BOOLEAN;
  v_trigger_exists BOOLEAN;
  v_tables_updated INTEGER := 0;
  v_columns_added INTEGER := 0;
  v_triggers_created INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 3: Safe Optimistic Locking Migration';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- 1. CREATE VERSION INCREMENT FUNCTION (IF NOT EXISTS)
  -- ============================================================================

  IF NOT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'increment_version'
  ) THEN
    EXECUTE $$
      CREATE OR REPLACE FUNCTION increment_version()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW._version = COALESCE(OLD._version, 0) + 1;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    $$;
    RAISE NOTICE '✅ Created function: increment_version()';
  ELSE
    RAISE NOTICE '⚪ Function increment_version() already exists (skipping)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '--- Adding _version columns to tables ---';
  RAISE NOTICE '';

  -- ============================================================================
  -- 2. ADD _VERSION COLUMN TO EACH TABLE
  -- ============================================================================

  FOREACH v_table IN ARRAY v_tables
  LOOP
    -- Check if table exists
    IF EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = v_table
    ) THEN

      -- Check if _version column already exists
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = v_table
        AND column_name = '_version'
      ) INTO v_column_exists;

      IF NOT v_column_exists THEN
        -- Add _version column
        EXECUTE format('ALTER TABLE %I ADD COLUMN _version INTEGER DEFAULT 1 NOT NULL', v_table);
        RAISE NOTICE '✅ Added _version to table: %', v_table;
        v_columns_added := v_columns_added + 1;
      ELSE
        RAISE NOTICE '⚪ Table % already has _version column (skipping)', v_table;
      END IF;

      -- Check if trigger already exists
      SELECT EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'trigger_increment_' || v_table || '_version'
      ) INTO v_trigger_exists;

      IF NOT v_trigger_exists THEN
        -- Create trigger
        EXECUTE format('
          CREATE TRIGGER trigger_increment_%I_version
          BEFORE UPDATE ON %I
          FOR EACH ROW
          EXECUTE FUNCTION increment_version()
        ', v_table, v_table);
        RAISE NOTICE '✅ Created trigger for table: %', v_table;
        v_triggers_created := v_triggers_created + 1;
      ELSE
        RAISE NOTICE '⚪ Trigger for % already exists (skipping)', v_table;
      END IF;

      v_tables_updated := v_tables_updated + 1;

    ELSE
      RAISE NOTICE '⚠️  Table % does not exist (skipping)', v_table;
    END IF;

    RAISE NOTICE '';
  END LOOP;

  -- ============================================================================
  -- 3. CREATE HELPER FUNCTIONS
  -- ============================================================================

  RAISE NOTICE '--- Creating helper functions ---';
  RAISE NOTICE '';

  -- Function: check_version_conflict
  IF NOT EXISTS (
    SELECT FROM pg_proc WHERE proname = 'check_version_conflict'
  ) THEN
    EXECUTE $$
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
        EXECUTE format('SELECT _version FROM %I WHERE id = $1', p_table_name)
        INTO v_current_version
        USING p_id;

        IF v_current_version IS NULL THEN
          RETURN QUERY SELECT TRUE, 0, p_expected_version, 'Record not found'::TEXT;
          RETURN;
        END IF;

        IF v_current_version != p_expected_version THEN
          RETURN QUERY SELECT
            TRUE,
            v_current_version,
            p_expected_version,
            format('Version conflict: expected %s, got %s', p_expected_version, v_current_version)::TEXT;
        ELSE
          RETURN QUERY SELECT FALSE, v_current_version, p_expected_version, 'Version OK'::TEXT;
        END IF;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;
    $$;
    RAISE NOTICE '✅ Created function: check_version_conflict()';
  ELSE
    RAISE NOTICE '⚪ Function check_version_conflict() already exists (skipping)';
  END IF;

  -- Function: log_conflict
  IF NOT EXISTS (
    SELECT FROM pg_proc WHERE proname = 'log_conflict'
  ) THEN
    EXECUTE $$
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
        -- Only insert if conflict_log table exists
        IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'conflict_log') THEN
          INSERT INTO conflict_log (
            entity, entity_id, user_id,
            local_version, remote_version,
            local_data, remote_data,
            resolution, status
          )
          VALUES (
            p_entity, p_entity_id, auth.uid(),
            p_local_version, p_remote_version,
            p_local_data, p_remote_data,
            'manual', 'pending'
          )
          RETURNING id INTO v_conflict_id;
          RETURN v_conflict_id;
        ELSE
          RAISE NOTICE 'conflict_log table does not exist';
          RETURN NULL;
        END IF;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;
    $$;
    RAISE NOTICE '✅ Created function: log_conflict()';
  ELSE
    RAISE NOTICE '⚪ Function log_conflict() already exists (skipping)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '--- Creating conflict_log table (optional) ---';
  RAISE NOTICE '';

  -- ============================================================================
  -- 4. CREATE CONFLICT_LOG TABLE (OPTIONAL)
  -- ============================================================================

  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'conflict_log'
  ) THEN
    CREATE TABLE conflict_log (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      entity TEXT NOT NULL,
      entity_id UUID NOT NULL,
      user_id UUID REFERENCES auth.users(id),

      local_version INTEGER,
      remote_version INTEGER,
      local_data JSONB,
      remote_data JSONB,

      resolution TEXT,
      winner TEXT,
      merged_data JSONB,

      created_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      resolved_by UUID REFERENCES auth.users(id),

      status TEXT DEFAULT 'pending',

      CONSTRAINT conflict_log_status_check CHECK (status IN ('pending', 'resolved', 'rejected'))
    );

    CREATE INDEX idx_conflict_log_entity ON conflict_log(entity, entity_id);
    CREATE INDEX idx_conflict_log_user ON conflict_log(user_id);
    CREATE INDEX idx_conflict_log_status ON conflict_log(status);

    ALTER TABLE conflict_log ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own conflicts"
      ON conflict_log FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create conflict logs"
      ON conflict_log FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE '✅ Created table: conflict_log with RLS policies';
  ELSE
    RAISE NOTICE '⚪ Table conflict_log already exists (skipping)';
  END IF;

  -- ============================================================================
  -- 5. GRANT PERMISSIONS
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '--- Granting permissions ---';
  RAISE NOTICE '';

  GRANT EXECUTE ON FUNCTION increment_version() TO authenticated;
  GRANT EXECUTE ON FUNCTION check_version_conflict(TEXT, UUID, INTEGER) TO authenticated;
  GRANT EXECUTE ON FUNCTION log_conflict(TEXT, UUID, INTEGER, INTEGER, JSONB, JSONB) TO authenticated;

  RAISE NOTICE '✅ Granted execute permissions on functions';

  -- ============================================================================
  -- 6. SUMMARY REPORT
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables processed: %', v_tables_updated;
  RAISE NOTICE 'Columns added: %', v_columns_added;
  RAISE NOTICE 'Triggers created: %', v_triggers_created;
  RAISE NOTICE '';
  RAISE NOTICE 'Status: ✅ COMPLETE';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Show all tables with _version column
SELECT
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = '_version'
ORDER BY table_name;

-- Show all version triggers
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
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('increment_version', 'check_version_conflict', 'log_conflict')
ORDER BY routine_name;
