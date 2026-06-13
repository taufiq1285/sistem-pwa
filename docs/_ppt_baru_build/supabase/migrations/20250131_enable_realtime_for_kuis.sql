-- Enable Supabase Realtime for kuis table
-- This allows realtime subscriptions to work for automatic UI updates

-- ============================================================================
-- ENABLE REPLICA IDENTITY (Required for realtime UPDATE/DELETE events)
-- ============================================================================

-- Set replica identity to FULL so all old data is included in UPDATE/DELETE events
ALTER TABLE kuis REPLICA IDENTITY FULL;

-- ============================================================================
-- ENABLE REALTIME REPLICATION
-- ============================================================================

-- Add kuis table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE kuis;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Realtime enabled for kuis table';
  RAISE NOTICE '📝 REPLICA IDENTITY: FULL';
  RAISE NOTICE '📝 kuis table is now part of supabase_realtime publication';
  RAISE NOTICE '📝 Realtime subscriptions will now receive INSERT, UPDATE, DELETE events';
END $$;

-- Check which tables are in the realtime publication
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;
