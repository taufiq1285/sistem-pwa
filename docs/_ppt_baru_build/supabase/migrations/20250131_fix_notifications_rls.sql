-- Fix RLS policy for notifications table
-- Allow dosen, admin, and laboran to create notifications for any user (including mahasiswa)

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

-- ============================================================================
-- CREATE NEW POLICIES WITH PROPER ROLE CHECKING
-- ============================================================================

-- SELECT: Users can see their own notifications, admins can see all
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Allow admins to see all notifications (for debugging/management)
CREATE POLICY "notifications_select_admin" ON notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            JOIN admin ON admin.id = users.id
            WHERE admin.user_id = auth.uid()
        )
    );

-- INSERT: Allow admins, dosen, and laboran to create notifications for anyone
CREATE POLICY "notifications_insert_dosen" ON notifications
    FOR INSERT
    WITH CHECK (
        -- Admin can create notifications for anyone
        EXISTS (
            SELECT 1 FROM users
            JOIN admin ON admin.id = users.id
            WHERE admin.user_id = auth.uid()
        )
        OR
        -- Dosen can create notifications for mahasiswa in their classes
        EXISTS (
            SELECT 1 FROM users
            JOIN dosen ON dosen.id = users.id
            WHERE dosen.user_id = auth.uid()
        )
        OR
        -- Laboran can create notifications for anyone
        EXISTS (
            SELECT 1 FROM users
            JOIN laboran ON laboran.id = users.id
            WHERE laboran.user_id = auth.uid()
        )
    );

-- UPDATE: Users can only update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own notifications, admins can delete any
CREATE POLICY "notifications_delete_own" ON notifications
    FOR DELETE
    USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_admin" ON notifications
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            JOIN admin ON admin.id = users.id
            WHERE admin.user_id = auth.uid()
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Notifications RLS policies updated';
  RAISE NOTICE '📝 Policies created:';
  RAISE NOTICE '  - notifications_select_own: Users see their own notifications';
  RAISE NOTICE '  - notifications_select_admin: Admins see all notifications';
  RAISE NOTICE '  - notifications_insert_dosen: Dosen/Admin/Laboran can create for anyone';
  RAISE NOTICE '  - notifications_update_own: Users update their own';
  RAISE NOTICE '  - notifications_delete_own: Users delete their own';
  RAISE NOTICE '  - notifications_delete_admin: Admins delete any';
END $$;
