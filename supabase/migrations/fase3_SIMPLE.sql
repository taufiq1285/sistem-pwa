/**
 * FASE 3: Optimistic Locking - SIMPLE VERSION
 *
 * Simplified version without complex nested blocks
 * Easier to paste and execute in Supabase Dashboard
 */

-- ============================================================================
-- PART 1: CREATE INCREMENT VERSION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS
$increment_func$
BEGIN
  NEW._version = COALESCE(OLD._version, 0) + 1;
  RETURN NEW;
END;
$increment_func$
LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: ADD VERSION COLUMNS
-- ============================================================================

-- Add to attempt_kuis
ALTER TABLE attempt_kuis
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- Add to jawaban
ALTER TABLE jawaban
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- ============================================================================
-- PART 3: CREATE TRIGGERS
-- ============================================================================

-- Trigger for attempt_kuis
DROP TRIGGER IF EXISTS trigger_increment_attempt_kuis_version ON attempt_kuis;
CREATE TRIGGER trigger_increment_attempt_kuis_version
  BEFORE UPDATE ON attempt_kuis
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Trigger for jawaban
DROP TRIGGER IF EXISTS trigger_increment_jawaban_version ON jawaban;
CREATE TRIGGER trigger_increment_jawaban_version
  BEFORE UPDATE ON jawaban
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- ============================================================================
-- PART 4: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function: check_version_conflict
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
) AS
$check_func$
DECLARE
  v_current_version INTEGER;
BEGIN
  EXECUTE format('SELECT _version FROM %I WHERE id = $1', p_table_name)
  INTO v_current_version
  USING p_id;

  IF v_current_version IS NULL THEN
    RETURN QUERY SELECT
      TRUE,
      0,
      p_expected_version,
      'Record not found'::TEXT;
    RETURN;
  END IF;

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
$check_func$
LANGUAGE plpgsql SECURITY DEFINER;

-- Function: safe_update_with_version
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
) AS
$update_func$
DECLARE
  v_current_version INTEGER;
  v_new_version INTEGER;
  v_set_clause TEXT;
  v_key TEXT;
  v_value TEXT;
BEGIN
  EXECUTE format('SELECT _version FROM %I WHERE id = $1', p_table_name)
  INTO v_current_version
  USING p_id;

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

  v_set_clause := '';
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_data)
  LOOP
    IF v_set_clause != '' THEN
      v_set_clause := v_set_clause || ', ';
    END IF;
    v_set_clause := v_set_clause || format('%I = %L', v_key, v_value);
  END LOOP;

  EXECUTE format('UPDATE %I SET %s WHERE id = $1 RETURNING _version', p_table_name, v_set_clause)
  INTO v_new_version
  USING p_id;

  RETURN QUERY SELECT TRUE, v_new_version, NULL::TEXT;
END;
$update_func$
LANGUAGE plpgsql SECURITY DEFINER;

-- Function: log_conflict
CREATE OR REPLACE FUNCTION log_conflict(
  p_entity TEXT,
  p_entity_id UUID,
  p_local_version INTEGER,
  p_remote_version INTEGER,
  p_local_data JSONB,
  p_remote_data JSONB
)
RETURNS UUID AS
$log_func$
DECLARE
  v_conflict_id UUID;
BEGIN
  INSERT INTO conflict_log (
    table_name,
    record_id,
    user_id,
    local_version,
    remote_version,
    client_data,
    server_data,
    resolution_strategy,
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
$log_func$
LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION increment_version() TO authenticated;
GRANT EXECUTE ON FUNCTION check_version_conflict(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_update_with_version(TEXT, UUID, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_conflict(TEXT, UUID, INTEGER, INTEGER, JSONB, JSONB) TO authenticated;

-- ============================================================================
-- PART 6: ADD COMMENTS
-- ============================================================================

COMMENT ON FUNCTION increment_version() IS 'FASE 3: Auto-increment _version on UPDATE';
COMMENT ON FUNCTION check_version_conflict(TEXT, UUID, INTEGER) IS 'FASE 3: Check for version conflicts';
COMMENT ON FUNCTION safe_update_with_version(TEXT, UUID, INTEGER, JSONB) IS 'FASE 3: Update with optimistic locking';
COMMENT ON FUNCTION log_conflict(TEXT, UUID, INTEGER, INTEGER, JSONB, JSONB) IS 'FASE 3: Log conflict for manual resolution';

COMMENT ON COLUMN attempt_kuis._version IS 'FASE 3: Optimistic locking version';
COMMENT ON COLUMN jawaban._version IS 'FASE 3: Optimistic locking version';

-- ============================================================================
-- SUCCESS
-- ============================================================================

DO $success$
BEGIN
  RAISE NOTICE '✅ FASE 3 Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  - _version columns to 2 tables';
  RAISE NOTICE '  - Auto-increment triggers';
  RAISE NOTICE '  - 4 helper functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test and verify';
END;
$success$;
