-- Fix notifications RLS so task notifications actually persist.
-- Current policy blocks mahasiswa inserts and uses incorrect joins for role checks,
-- which prevents dosen publish notifications and mahasiswa submission notifications.

DROP POLICY IF EXISTS "notifications_insert_dosen" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;

-- Any authenticated user may create notifications.
-- Reads/updates/deletes remain scoped by the existing per-user policies.
CREATE POLICY "notifications_insert_authenticated" ON notifications
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
