/**
 * FASE 3: Add Version Tracking to Existing conflict_log Table
 *
 * PURPOSE:
 * - Add local_version and remote_version columns
 * - Add status column for manual resolution workflow
 * - Add winner column for resolution tracking
 * - Make existing conflict_log compatible with Fase 3
 *
 * SAFETY:
 * - Only ADD COLUMN (non-destructive)
 * - Existing data remains unchanged
 * - NULL allowed for backward compatibility
 * - Can run multiple times safely
 */

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 3: Update conflict_log Table';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- 1. ADD VERSION COLUMNS
  -- ============================================================================

  RAISE NOTICE '--- Adding version tracking columns ---';
  RAISE NOTICE '';

  -- Add local_version column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'conflict_log'
    AND column_name = 'local_version'
  ) THEN
    ALTER TABLE conflict_log
    ADD COLUMN local_version INTEGER;

    RAISE NOTICE '✅ Added column: local_version';
  ELSE
    RAISE NOTICE '⚪ Column local_version already exists';
  END IF;

  -- Add remote_version column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'conflict_log'
    AND column_name = 'remote_version'
  ) THEN
    ALTER TABLE conflict_log
    ADD COLUMN remote_version INTEGER;

    RAISE NOTICE '✅ Added column: remote_version';
  ELSE
    RAISE NOTICE '⚪ Column remote_version already exists';
  END IF;

  -- ============================================================================
  -- 2. ADD OPTIONAL WORKFLOW COLUMNS
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '--- Adding workflow columns ---';
  RAISE NOTICE '';

  -- Add status column (for manual resolution queue)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'conflict_log'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE conflict_log
    ADD COLUMN status TEXT DEFAULT 'pending';

    -- Add constraint
    ALTER TABLE conflict_log
    ADD CONSTRAINT conflict_log_status_check
    CHECK (status IN ('pending', 'resolved', 'rejected'));

    RAISE NOTICE '✅ Added column: status';
  ELSE
    RAISE NOTICE '⚪ Column status already exists';
  END IF;

  -- Add winner column (for tracking which side won)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'conflict_log'
    AND column_name = 'winner'
  ) THEN
    ALTER TABLE conflict_log
    ADD COLUMN winner TEXT;

    -- Add constraint
    ALTER TABLE conflict_log
    ADD CONSTRAINT conflict_log_winner_check
    CHECK (winner IN ('local', 'remote', 'merged') OR winner IS NULL);

    RAISE NOTICE '✅ Added column: winner';
  ELSE
    RAISE NOTICE '⚪ Column winner already exists';
  END IF;

  -- ============================================================================
  -- 3. ADD INDEXES
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '--- Adding indexes ---';
  RAISE NOTICE '';

  -- Index on status for querying pending conflicts
  IF NOT EXISTS (
    SELECT FROM pg_indexes
    WHERE indexname = 'idx_conflict_log_status'
  ) THEN
    CREATE INDEX idx_conflict_log_status ON conflict_log(status);
    RAISE NOTICE '✅ Created index: idx_conflict_log_status';
  ELSE
    RAISE NOTICE '⚪ Index idx_conflict_log_status already exists';
  END IF;

  -- Index on table_name and record_id for quick lookups
  IF NOT EXISTS (
    SELECT FROM pg_indexes
    WHERE indexname = 'idx_conflict_log_table_record'
  ) THEN
    CREATE INDEX idx_conflict_log_table_record ON conflict_log(table_name, record_id);
    RAISE NOTICE '✅ Created index: idx_conflict_log_table_record';
  ELSE
    RAISE NOTICE '⚪ Index idx_conflict_log_table_record already exists';
  END IF;

  -- ============================================================================
  -- 4. ADD COMMENTS
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '--- Adding column comments ---';
  RAISE NOTICE '';

  COMMENT ON COLUMN conflict_log.local_version IS 'FASE 3: Version number from local/client data';
  COMMENT ON COLUMN conflict_log.remote_version IS 'FASE 3: Version number from remote/server data';
  COMMENT ON COLUMN conflict_log.status IS 'FASE 3: Resolution workflow status';
  COMMENT ON COLUMN conflict_log.winner IS 'FASE 3: Which side won the conflict resolution';

  RAISE NOTICE '✅ Added column comments';

  -- ============================================================================
  -- 5. SUMMARY
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated table: conflict_log';
  RAISE NOTICE 'New columns: local_version, remote_version, status, winner';
  RAISE NOTICE 'New indexes: 2';
  RAISE NOTICE '';
  RAISE NOTICE 'Status: ✅ COMPLETE';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run fase3_optimistic_locking_ADJUSTED_FIXED.sql';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'conflict_log'
ORDER BY ordinal_position;
