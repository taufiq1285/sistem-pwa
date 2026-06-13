-- ============================================================================
-- TEMPORARY TEST POLICY FOR KEHADIRAN
-- ============================================================================
-- Purpose: Test if auth context is working
-- This is a TEMPORARY permissive policy for debugging
-- ============================================================================

-- Drop all existing kehadiran policies
DROP POLICY IF EXISTS "kehadiran_select_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_select_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_select_mahasiswa" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_insert_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_insert_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_update_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_update_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_delete_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_delete_dosen" ON kehadiran;

-- TEMPORARY: Allow ALL authenticated users to do everything
-- This is ONLY for testing - DO NOT use in production!
CREATE POLICY "kehadiran_temp_select_all" ON kehadiran
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "kehadiran_temp_insert_all" ON kehadiran
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "kehadiran_temp_update_all" ON kehadiran
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "kehadiran_temp_delete_all" ON kehadiran
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- IMPORTANT: This is a temporary permissive policy for debugging
-- After confirming it works, we'll replace with proper restrictive policies
-- ============================================================================
