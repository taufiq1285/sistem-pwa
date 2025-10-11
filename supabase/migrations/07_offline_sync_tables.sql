-- ============================================================================
-- MIGRATION 07: OFFLINE SYNC TABLES
-- Tables for offline-first functionality
-- ============================================================================

-- ============================================================================
-- OFFLINE QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS offline_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    data JSONB NOT NULL,
    priority INTEGER DEFAULT 5,
    status sync_status DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT offline_queue_priority_check CHECK (priority BETWEEN 1 AND 10)
);

-- ============================================================================
-- SYNC HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status sync_status DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONFLICT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS conflict_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    local_data JSONB NOT NULL,
    server_data JSONB NOT NULL,
    resolution VARCHAR(50) CHECK (resolution IN ('server_wins', 'client_wins', 'manual', 'merged')),
    resolved_data JSONB,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CACHE METADATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS cache_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    cache_key VARCHAR(255) NOT NULL,
    last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, table_name, cache_key)
);

-- ============================================================================
-- INDEXES FOR OFFLINE TABLES
-- ============================================================================

-- Offline Queue indexes
CREATE INDEX IF NOT EXISTS idx_offline_queue_user ON offline_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_queue(status) WHERE status != 'synced';
CREATE INDEX IF NOT EXISTS idx_offline_queue_priority ON offline_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_offline_queue_created ON offline_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_offline_queue_table ON offline_queue(table_name);

-- Sync History indexes
CREATE INDEX IF NOT EXISTS idx_sync_history_user ON sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON sync_history(status);
CREATE INDEX IF NOT EXISTS idx_sync_history_created ON sync_history(created_at DESC);

-- Conflict Log indexes
CREATE INDEX IF NOT EXISTS idx_conflict_log_user ON conflict_log(user_id);
CREATE INDEX IF NOT EXISTS idx_conflict_log_table ON conflict_log(table_name);
CREATE INDEX IF NOT EXISTS idx_conflict_log_unresolved ON conflict_log(resolution) WHERE resolution IS NULL;
CREATE INDEX IF NOT EXISTS idx_conflict_log_created ON conflict_log(created_at DESC);

-- Cache Metadata indexes
CREATE INDEX IF NOT EXISTS idx_cache_metadata_user ON cache_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_table ON cache_metadata(table_name);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_expires ON cache_metadata(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_key ON cache_metadata(cache_key);

-- ============================================================================
-- TRIGGERS FOR OFFLINE TABLES
-- ============================================================================

DROP TRIGGER IF EXISTS update_offline_queue_updated_at ON offline_queue;
CREATE TRIGGER update_offline_queue_updated_at 
    BEFORE UPDATE ON offline_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conflict_log_updated_at ON conflict_log;
CREATE TRIGGER update_conflict_log_updated_at 
    BEFORE UPDATE ON conflict_log 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cache_metadata_updated_at ON cache_metadata;
CREATE TRIGGER update_cache_metadata_updated_at 
    BEFORE UPDATE ON cache_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES FOR OFFLINE TABLES
-- ============================================================================

ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_metadata ENABLE ROW LEVEL SECURITY;

-- Offline Queue policies
CREATE POLICY "offline_queue_select_own" ON offline_queue
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "offline_queue_insert_own" ON offline_queue
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "offline_queue_update_own" ON offline_queue
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "offline_queue_delete_own" ON offline_queue
    FOR DELETE USING (user_id = auth.uid());

-- Sync History policies
CREATE POLICY "sync_history_select_own" ON sync_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sync_history_insert_own" ON sync_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Conflict Log policies
CREATE POLICY "conflict_log_select_own" ON conflict_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "conflict_log_insert_own" ON conflict_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "conflict_log_update_own" ON conflict_log
    FOR UPDATE USING (user_id = auth.uid());

-- Cache Metadata policies
CREATE POLICY "cache_metadata_select_own" ON cache_metadata
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cache_metadata_insert_own" ON cache_metadata
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cache_metadata_update_own" ON cache_metadata
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "cache_metadata_delete_own" ON cache_metadata
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- OFFLINE SYNC HELPER FUNCTIONS
-- ============================================================================

-- Cleanup old sync history
CREATE OR REPLACE FUNCTION cleanup_old_sync_history(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sync_history 
    WHERE completed_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND status = 'synced';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear expired cache
CREATE OR REPLACE FUNCTION clear_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_metadata 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Offline sync tables created successfully';
    RAISE NOTICE '- offline_queue';
    RAISE NOTICE '- sync_history';
    RAISE NOTICE '- conflict_log';
    RAISE NOTICE '- cache_metadata';
END $$;