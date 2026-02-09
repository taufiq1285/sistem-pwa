-- ============================================================================
-- FIX: RLS Enabled No Policy - Add policies for tables with RLS but no policies
-- Run this script di Supabase SQL Editor
-- ============================================================================
-- Tables: cache_metadata, notifications, offline_queue, sync_history
-- ============================================================================

-- ============================================================================
-- 1. CACHE_METADATA - Cache for PWA offline functionality
-- ============================================================================

-- Users can manage their own cache metadata
CREATE POLICY "cache_metadata_select" ON public.cache_metadata
    FOR SELECT USING (
        (SELECT public.is_admin()) OR
        user_id = (SELECT auth.uid())
    );

CREATE POLICY "cache_metadata_insert" ON public.cache_metadata
    FOR INSERT WITH CHECK (
        user_id = (SELECT auth.uid())
    );

CREATE POLICY "cache_metadata_update" ON public.cache_metadata
    FOR UPDATE USING (
        user_id = (SELECT auth.uid())
    );

CREATE POLICY "cache_metadata_delete" ON public.cache_metadata
    FOR DELETE USING (
        (SELECT public.is_admin()) OR
        user_id = (SELECT auth.uid())
    );

-- ============================================================================
-- 2. NOTIFICATIONS - User notifications
-- ============================================================================

-- Users can read their own notifications, admin/laboran can read all
CREATE POLICY "notifications_select" ON public.notifications
    FOR SELECT USING (
        (SELECT public.is_admin()) OR
        (SELECT public.is_laboran()) OR
        user_id = (SELECT auth.uid())
    );

-- System/Admin can create notifications for any user
CREATE POLICY "notifications_insert" ON public.notifications
    FOR INSERT WITH CHECK (
        (SELECT public.is_admin()) OR
        (SELECT public.is_laboran()) OR
        (SELECT public.is_dosen()) OR
        user_id = (SELECT auth.uid())
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update" ON public.notifications
    FOR UPDATE USING (
        (SELECT public.is_admin()) OR
        user_id = (SELECT auth.uid())
    );

-- Users can delete their own notifications, admin can delete any
CREATE POLICY "notifications_delete" ON public.notifications
    FOR DELETE USING (
        (SELECT public.is_admin()) OR
        user_id = (SELECT auth.uid())
    );

-- ============================================================================
-- 3. OFFLINE_QUEUE - Offline operation queue for PWA
-- ============================================================================

-- Users can manage their own offline queue
CREATE POLICY "offline_queue_select" ON public.offline_queue
    FOR SELECT USING (
        (SELECT public.is_admin()) OR
        user_id = (SELECT auth.uid())
    );

CREATE POLICY "offline_queue_insert" ON public.offline_queue
    FOR INSERT WITH CHECK (
        user_id = (SELECT auth.uid())
    );

CREATE POLICY "offline_queue_update" ON public.offline_queue
    FOR UPDATE USING (
        user_id = (SELECT auth.uid())
    );

CREATE POLICY "offline_queue_delete" ON public.offline_queue
    FOR DELETE USING (
        (SELECT public.is_admin()) OR
        user_id = (SELECT auth.uid())
    );

-- ============================================================================
-- 4. SYNC_HISTORY - Sync history for PWA
-- ============================================================================

-- Users can view their own sync history, admin can view all
CREATE POLICY "sync_history_select" ON public.sync_history
    FOR SELECT USING (
        (SELECT public.is_admin()) OR
        user_id = (SELECT auth.uid())
    );

-- Users can insert their own sync records
CREATE POLICY "sync_history_insert" ON public.sync_history
    FOR INSERT WITH CHECK (
        user_id = (SELECT auth.uid())
    );

-- Users can update their own sync records
CREATE POLICY "sync_history_update" ON public.sync_history
    FOR UPDATE USING (
        user_id = (SELECT auth.uid())
    );

-- Admin can delete old sync history, users can delete their own
CREATE POLICY "sync_history_delete" ON public.sync_history
    FOR DELETE USING (
        (SELECT public.is_admin()) OR
        user_id = (SELECT auth.uid())
    );

-- ============================================================================
-- VERIFY - Check policies were created
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename IN ('cache_metadata', 'notifications', 'offline_queue', 'sync_history')
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies created for:';
    RAISE NOTICE '   - cache_metadata (4 policies)';
    RAISE NOTICE '   - notifications (4 policies)';
    RAISE NOTICE '   - offline_queue (4 policies)';
    RAISE NOTICE '   - sync_history (4 policies)';
END $$;
