/**
 * FASE 3: Optimistic Locking - Versioning Support
 *
 * PURPOSE:
 * - Add version column to critical tables for optimistic locking
 * - Auto-increment version on updates
 * - Prevent concurrent update conflicts
 *
 * SAFETY:
 * - Non-destructive (only ALTER TABLE ADD COLUMN)
 * - Backward compatible (version nullable initially)
 * - Can be rolled back
 *
 * USAGE:
 * Run in Supabase SQL Editor
 */

-- ============================================================================
-- 1. ADD VERSION COLUMNS TO CRITICAL TABLES
-- ============================================================================

-- Add version to kuis table
ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- Add version to kuis_jawaban table
ALTER TABLE kuis_jawaban
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- Add version to nilai table
ALTER TABLE nilai
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- Add version to kehadiran table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'kehadiran') THEN
    ALTER TABLE kehadiran
    ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Add version to materi table
ALTER TABLE materi
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- ============================================================================
-- 2. CREATE VERSION INCREMENT TRIGGERS
-- ============================================================================

/**
 * Generic function to increment version on update
 */
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version
  NEW._version = COALESCE(OLD._version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to kuis
DROP TRIGGER IF EXISTS trigger_increment_kuis_version ON kuis;
CREATE TRIGGER trigger_increment_kuis_version
  BEFORE UPDATE ON kuis
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Apply trigger to kuis_jawaban
DROP TRIGGER IF EXISTS trigger_increment_kuis_jawaban_version ON kuis_jawaban;
CREATE TRIGGER trigger_increment_kuis_jawaban_version
  BEFORE UPDATE ON kuis_jawaban
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Apply trigger to nilai
DROP TRIGGER IF EXISTS trigger_increment_nilai_version ON nilai;
CREATE TRIGGER trigger_increment_nilai_version
  BEFORE UPDATE ON nilai
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Apply trigger to kehadiran (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'kehadiran') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_increment_kehadiran_version ON kehadiran';
    EXECUTE 'CREATE TRIGGER trigger_increment_kehadiran_version
      BEFORE UPDATE ON kehadiran
      FOR EACH ROW
      EXECUTE FUNCTION increment_version()';
  END IF;
END $$;

-- Apply trigger to materi
DROP TRIGGER IF EXISTS trigger_increment_materi_version ON materi;
CREATE TRIGGER trigger_increment_materi_version
  BEFORE UPDATE ON materi
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- ============================================================================
-- 3. OPTIMISTIC LOCKING CHECK FUNCTION
-- ============================================================================

/**
 * Check if update would cause version conflict
 *
 * @param p_table_name - Table name
 * @param p_id - Record ID
 * @param p_expected_version - Expected version from client
 * @returns TRUE if versions match, FALSE if conflict
 */
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
) AS $$
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
      TRUE as has_conflict,
      0 as current_version,
      p_expected_version as expected_version,
      'Record not found' as message;
    RETURN;
  END IF;

  -- Check version match
  IF v_current_version != p_expected_version THEN
    RETURN QUERY SELECT
      TRUE as has_conflict,
      v_current_version as current_version,
      p_expected_version as expected_version,
      format('Version conflict: expected %s, got %s', p_expected_version, v_current_version) as message;
  ELSE
    RETURN QUERY SELECT
      FALSE as has_conflict,
      v_current_version as current_version,
      p_expected_version as expected_version,
      'Version OK' as message;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. SAFE UPDATE FUNCTION WITH VERSION CHECK
-- ============================================================================

/**
 * Update with optimistic locking
 * Returns error if version mismatch
 *
 * Example usage:
 * SELECT safe_update_kuis_jawaban(
 *   'uuid-here',
 *   5, -- expected version
 *   '{"jawaban": {"q1": "A"}}'::jsonb
 * );
 */
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. CONFLICT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conflict_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Conflict details
  local_version INTEGER,
  remote_version INTEGER,
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

  -- For manual resolution queue
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'rejected'

  CONSTRAINT conflict_log_status_check CHECK (status IN ('pending', 'resolved', 'rejected')),
  CONSTRAINT conflict_log_resolution_check CHECK (resolution IN ('auto', 'manual', 'rejected'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conflict_log_entity ON conflict_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_conflict_log_user ON conflict_log(user_id);
CREATE INDEX IF NOT EXISTS idx_conflict_log_status ON conflict_log(status);
CREATE INDEX IF NOT EXISTS idx_conflict_log_created ON conflict_log(created_at DESC);

-- RLS
ALTER TABLE conflict_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conflicts"
  ON conflict_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create conflict logs"
  ON conflict_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all conflicts"
  ON conflict_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

/**
 * Log a conflict for manual resolution
 */
CREATE OR REPLACE FUNCTION log_conflict(
  p_entity TEXT,
  p_entity_id UUID,
  p_local_version INTEGER,
  p_remote_version INTEGER,
  p_local_data JSONB,
  p_remote_data JSONB
)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Resolve conflict manually
 */
CREATE OR REPLACE FUNCTION resolve_conflict(
  p_conflict_id UUID,
  p_winner TEXT,
  p_merged_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE conflict_log
  SET
    resolution = 'manual',
    winner = p_winner,
    merged_data = p_merged_data,
    resolved_at = NOW(),
    resolved_by = auth.uid(),
    status = 'resolved'
  WHERE id = p_conflict_id
  AND user_id = auth.uid(); -- Only owner can resolve

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_version_conflict(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_update_with_version(TEXT, UUID, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_conflict(TEXT, UUID, INTEGER, INTEGER, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_conflict(UUID, TEXT, JSONB) TO authenticated;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON COLUMN kuis._version IS 'Optimistic locking version (FASE 3)';
COMMENT ON COLUMN kuis_jawaban._version IS 'Optimistic locking version (FASE 3)';
COMMENT ON COLUMN nilai._version IS 'Optimistic locking version (FASE 3)';
COMMENT ON COLUMN materi._version IS 'Optimistic locking version (FASE 3)';

COMMENT ON TABLE conflict_log IS 'Logs conflicts for manual resolution (FASE 3)';
COMMENT ON FUNCTION increment_version() IS 'Auto-increment version on UPDATE';
COMMENT ON FUNCTION check_version_conflict(TEXT, UUID, INTEGER) IS 'Check for version conflicts before update';
COMMENT ON FUNCTION safe_update_with_version(TEXT, UUID, INTEGER, JSONB) IS 'Update with optimistic locking check';

-- ============================================================================
-- 9. VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Check version columns exist
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'kuis' AND column_name = '_version') THEN
    RAISE NOTICE '✅ Version columns added successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to add version columns';
  END IF;

  -- Check triggers exist
  IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_increment_kuis_version') THEN
    RAISE NOTICE '✅ Version increment triggers created';
  ELSE
    RAISE EXCEPTION '❌ Failed to create triggers';
  END IF;

  -- Check conflict_log table exists
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'conflict_log') THEN
    RAISE NOTICE '✅ Conflict log table created';
  ELSE
    RAISE EXCEPTION '❌ Failed to create conflict_log table';
  END IF;
END $$;

-- ============================================================================
-- 10. MIGRATION METADATA
-- ============================================================================

INSERT INTO public.schema_migrations (version, name)
VALUES ('20241212_002', 'fase3_optimistic_locking_versioning')
ON CONFLICT (version) DO NOTHING;

-- Success
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FASE 3 Migration Complete';
  RAISE NOTICE 'Added: _version columns to 5 tables';
  RAISE NOTICE 'Created: Version increment triggers';
  RAISE NOTICE 'Created: Optimistic locking functions';
  RAISE NOTICE 'Created: conflict_log table';
  RAISE NOTICE 'Status: Ready for use';
  RAISE NOTICE '========================================';
END $$;
