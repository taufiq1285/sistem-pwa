/**
 * FASE 2: Idempotency - Request Log Table
 *
 * PURPOSE:
 * - Store processed request IDs to prevent duplicate operations
 * - Track request processing status and results
 * - Enable server-side deduplication
 *
 * SAFETY:
 * - Non-destructive migration (only CREATE)
 * - Backward compatible (existing tables unchanged)
 * - Can be rolled back safely
 *
 * USAGE:
 * Run in Supabase SQL Editor or via migration:
 * supabase migration new fase2_idempotency
 */

-- ============================================================================
-- 1. CREATE REQUEST LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS request_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Idempotency key (UNIQUE to prevent duplicates)
  request_id TEXT NOT NULL UNIQUE,

  -- Request metadata
  entity TEXT NOT NULL,  -- 'kuis', 'kuis_jawaban', etc.
  operation TEXT NOT NULL,  -- 'create', 'update', 'delete'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'processing',  -- 'processing', 'completed', 'failed'

  -- Result data (store response for idempotent returns)
  result JSONB,  -- Store the result to return on duplicate requests

  -- Error information (if failed)
  error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- TTL for cleanup (optional)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  -- Indexes for performance
  CONSTRAINT request_log_status_check CHECK (status IN ('processing', 'completed', 'failed'))
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Index on request_id for fast duplicate checking
CREATE INDEX IF NOT EXISTS idx_request_log_request_id
  ON request_log(request_id);

-- Index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_request_log_user_id
  ON request_log(user_id);

-- Index on status for filtering by status
CREATE INDEX IF NOT EXISTS idx_request_log_status
  ON request_log(status);

-- Index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_request_log_expires_at
  ON request_log(expires_at);

-- Composite index for entity+operation queries
CREATE INDEX IF NOT EXISTS idx_request_log_entity_operation
  ON request_log(entity, operation);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_request_log_created_at
  ON request_log(created_at DESC);

-- ============================================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_request_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Set completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamps
DROP TRIGGER IF EXISTS trigger_update_request_log_updated_at ON request_log;
CREATE TRIGGER trigger_update_request_log_updated_at
  BEFORE UPDATE ON request_log
  FOR EACH ROW
  EXECUTE FUNCTION update_request_log_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE request_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
CREATE POLICY "Users can view own request logs"
  ON request_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own requests
CREATE POLICY "Users can insert own request logs"
  ON request_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own requests
CREATE POLICY "Users can update own request logs"
  ON request_log
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admin can see all requests
CREATE POLICY "Admin can view all request logs"
  ON request_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 5. CLEANUP FUNCTION (Auto-delete expired entries)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_request_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired entries
  WITH deleted AS (
    DELETE FROM request_log
    WHERE expires_at < NOW()
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  -- Log cleanup
  RAISE NOTICE 'Cleaned up % expired request logs', deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

/**
 * Check if request ID was already processed
 *
 * @param p_request_id - Request ID to check
 * @returns Record with status and result (if exists)
 */
CREATE OR REPLACE FUNCTION check_request_idempotency(p_request_id TEXT)
RETURNS TABLE (
  exists BOOLEAN,
  status TEXT,
  result JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as exists,
    rl.status,
    rl.result,
    rl.created_at
  FROM request_log rl
  WHERE rl.request_id = p_request_id
  LIMIT 1;

  -- If no record found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::JSONB, NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Log request start
 *
 * @param p_request_id - Request ID
 * @param p_entity - Entity type
 * @param p_operation - Operation type
 * @param p_user_id - User ID (optional, defaults to auth.uid())
 * @returns Request log ID
 */
CREATE OR REPLACE FUNCTION log_request_start(
  p_request_id TEXT,
  p_entity TEXT,
  p_operation TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_log_id UUID;
BEGIN
  -- Use provided user_id or default to auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Insert request log
  INSERT INTO request_log (
    request_id,
    entity,
    operation,
    user_id,
    status
  )
  VALUES (
    p_request_id,
    p_entity,
    p_operation,
    v_user_id,
    'processing'
  )
  ON CONFLICT (request_id) DO NOTHING
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Log request completion
 *
 * @param p_request_id - Request ID
 * @param p_result - Result data (JSONB)
 * @param p_status - Status ('completed' or 'failed')
 * @param p_error - Error message (if failed)
 */
CREATE OR REPLACE FUNCTION log_request_complete(
  p_request_id TEXT,
  p_result JSONB DEFAULT NULL,
  p_status TEXT DEFAULT 'completed',
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE request_log
  SET
    status = p_status,
    result = p_result,
    error = p_error,
    completed_at = NOW()
  WHERE request_id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_request_idempotency(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_request_start(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_request_complete(TEXT, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_request_logs() TO authenticated;

-- ============================================================================
-- 8. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE request_log IS 'Stores processed request IDs for idempotency (FASE 2)';
COMMENT ON COLUMN request_log.request_id IS 'Unique idempotency key from client';
COMMENT ON COLUMN request_log.entity IS 'Entity type (kuis, kuis_jawaban, etc.)';
COMMENT ON COLUMN request_log.operation IS 'Operation type (create, update, delete)';
COMMENT ON COLUMN request_log.result IS 'Stored result for idempotent responses';
COMMENT ON COLUMN request_log.expires_at IS 'Auto-cleanup timestamp (default: 30 days)';

COMMENT ON FUNCTION check_request_idempotency(TEXT) IS 'Check if request was already processed';
COMMENT ON FUNCTION log_request_start(TEXT, TEXT, TEXT, UUID) IS 'Log request start with processing status';
COMMENT ON FUNCTION log_request_complete(TEXT, JSONB, TEXT, TEXT) IS 'Log request completion with result';
COMMENT ON FUNCTION cleanup_expired_request_logs() IS 'Delete expired request logs (manual or scheduled)';

-- ============================================================================
-- 9. SAMPLE USAGE EXAMPLES (Comment out in production)
-- ============================================================================

/*
-- Example 1: Check if request exists
SELECT * FROM check_request_idempotency('req_kuis_create_1702736400000_abc123');

-- Example 2: Log request start
SELECT log_request_start('req_kuis_create_1702736400000_abc123', 'kuis', 'create');

-- Example 3: Log request completion
SELECT log_request_complete(
  'req_kuis_create_1702736400000_abc123',
  '{"id": "123", "judul": "Quiz 1"}'::jsonb,
  'completed'
);

-- Example 4: Manual cleanup
SELECT cleanup_expired_request_logs();

-- Example 5: View all requests for current user
SELECT * FROM request_log WHERE user_id = auth.uid() ORDER BY created_at DESC;
*/

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Verify table created
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'request_log') THEN
    RAISE NOTICE '✅ Table request_log created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create table request_log';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Migration metadata
INSERT INTO public.schema_migrations (version, name)
VALUES ('20241212_001', 'fase2_idempotency_request_log')
ON CONFLICT (version) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FASE 2 Migration Complete';
  RAISE NOTICE 'Created: request_log table';
  RAISE NOTICE 'Created: 6 indexes for performance';
  RAISE NOTICE 'Created: 4 helper functions';
  RAISE NOTICE 'Created: RLS policies';
  RAISE NOTICE 'Status: Ready for use';
  RAISE NOTICE '========================================';
END $$;
