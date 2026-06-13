-- ============================================================================
-- RLS HELPER FUNCTIONS
-- Week 3 Day 1: Enhanced Database Security
-- ============================================================================
-- Description: Helper functions untuk Row-Level Security policies
-- Purpose: Memudahkan role checking dan ownership validation di RLS policies
-- Author: System Praktikum PWA Team
-- Date: 2025-11-28
-- ============================================================================

-- ============================================================================
-- USER ROLE FUNCTIONS
-- ============================================================================

/**
 * Get current user's role from users table
 * Returns: 'admin' | 'dosen' | 'laboran' | 'mahasiswa' | NULL
 */
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE id = auth.uid();

    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_role() IS
'Returns the role of the currently authenticated user';

-- ============================================================================
-- ROLE CHECKER FUNCTIONS
-- ============================================================================

/**
 * Check if current user is admin
 * Returns: TRUE if admin, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin() IS
'Returns TRUE if current user is an admin';

/**
 * Check if current user is dosen
 * Returns: TRUE if dosen, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION is_dosen()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'dosen', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_dosen() IS
'Returns TRUE if current user is a dosen';

/**
 * Check if current user is laboran
 * Returns: TRUE if laboran, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION is_laboran()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'laboran', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_laboran() IS
'Returns TRUE if current user is a laboran';

/**
 * Check if current user is mahasiswa
 * Returns: TRUE if mahasiswa, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION is_mahasiswa()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'mahasiswa', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_mahasiswa() IS
'Returns TRUE if current user is a mahasiswa';

-- ============================================================================
-- CURRENT USER ID GETTERS (ROLE-SPECIFIC)
-- ============================================================================

/**
 * Get current mahasiswa ID from mahasiswa table
 * Returns: UUID of mahasiswa record or NULL
 */
CREATE OR REPLACE FUNCTION get_current_mahasiswa_id()
RETURNS UUID AS $$
DECLARE
    mahasiswa_id UUID;
BEGIN
    SELECT id INTO mahasiswa_id
    FROM mahasiswa
    WHERE user_id = auth.uid();

    RETURN mahasiswa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_current_mahasiswa_id() IS
'Returns the mahasiswa record ID for the current user';

/**
 * Get current dosen ID from dosen table
 * Returns: UUID of dosen record or NULL
 */
CREATE OR REPLACE FUNCTION get_current_dosen_id()
RETURNS UUID AS $$
DECLARE
    dosen_id UUID;
BEGIN
    SELECT id INTO dosen_id
    FROM dosen
    WHERE user_id = auth.uid();

    RETURN dosen_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_current_dosen_id() IS
'Returns the dosen record ID for the current user';

/**
 * Get current laboran ID from laboran table
 * Returns: UUID of laboran record or NULL
 */
CREATE OR REPLACE FUNCTION get_current_laboran_id()
RETURNS UUID AS $$
DECLARE
    laboran_id UUID;
BEGIN
    SELECT id INTO laboran_id
    FROM laboran
    WHERE user_id = auth.uid();

    RETURN laboran_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_current_laboran_id() IS
'Returns the laboran record ID for the current user';

-- ============================================================================
-- OWNERSHIP VALIDATION FUNCTIONS
-- ============================================================================

/**
 * Check if mahasiswa is enrolled in a kelas
 * Returns: TRUE if enrolled, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION mahasiswa_in_kelas(p_kelas_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_enrolled BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM kelas_mahasiswa
        WHERE kelas_id = p_kelas_id
        AND mahasiswa_id = get_current_mahasiswa_id()
        AND is_active = TRUE
    ) INTO is_enrolled;

    RETURN COALESCE(is_enrolled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION mahasiswa_in_kelas(UUID) IS
'Returns TRUE if current mahasiswa is enrolled in the specified kelas';

/**
 * Check if dosen teaches a kelas
 * Returns: TRUE if teaches, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION dosen_teaches_kelas(p_kelas_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_teacher BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM kelas
        WHERE id = p_kelas_id
        AND dosen_id = get_current_dosen_id()
    ) INTO is_teacher;

    RETURN COALESCE(is_teacher, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION dosen_teaches_kelas(UUID) IS
'Returns TRUE if current dosen teaches the specified kelas';

/**
 * Check if dosen teaches a mahasiswa
 * Returns: TRUE if teaches the student, FALSE otherwise
 */
CREATE OR REPLACE FUNCTION dosen_teaches_mahasiswa(p_mahasiswa_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_teacher BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM kelas k
        INNER JOIN kelas_mahasiswa km ON k.id = km.kelas_id
        WHERE k.dosen_id = get_current_dosen_id()
        AND km.mahasiswa_id = p_mahasiswa_id
        AND km.is_active = TRUE
    ) INTO is_teacher;

    RETURN COALESCE(is_teacher, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION dosen_teaches_mahasiswa(UUID) IS
'Returns TRUE if current dosen teaches the specified mahasiswa';

/**
 * Get kelas IDs where mahasiswa is enrolled
 * Returns: Array of kelas UUIDs
 */
CREATE OR REPLACE FUNCTION get_mahasiswa_kelas_ids()
RETURNS UUID[] AS $$
DECLARE
    kelas_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(kelas_id)
    INTO kelas_ids
    FROM kelas_mahasiswa
    WHERE mahasiswa_id = get_current_mahasiswa_id()
    AND is_active = TRUE;

    RETURN COALESCE(kelas_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_mahasiswa_kelas_ids() IS
'Returns array of kelas IDs where current mahasiswa is enrolled';

/**
 * Get kelas IDs taught by dosen
 * Returns: Array of kelas UUIDs
 */
CREATE OR REPLACE FUNCTION get_dosen_kelas_ids()
RETURNS UUID[] AS $$
DECLARE
    kelas_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(id)
    INTO kelas_ids
    FROM kelas
    WHERE dosen_id = get_current_dosen_id();

    RETURN COALESCE(kelas_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_dosen_kelas_ids() IS
'Returns array of kelas IDs taught by current dosen';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Ensure fast lookups for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_user_id ON mahasiswa(user_id);
CREATE INDEX IF NOT EXISTS idx_dosen_user_id ON dosen(user_id);
CREATE INDEX IF NOT EXISTS idx_laboran_user_id ON laboran(user_id);
CREATE INDEX IF NOT EXISTS idx_kelas_mahasiswa_lookup ON kelas_mahasiswa(mahasiswa_id, kelas_id, is_active);
CREATE INDEX IF NOT EXISTS idx_kelas_dosen_lookup ON kelas(dosen_id);

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_dosen() TO authenticated;
GRANT EXECUTE ON FUNCTION is_laboran() TO authenticated;
GRANT EXECUTE ON FUNCTION is_mahasiswa() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_mahasiswa_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_dosen_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_laboran_id() TO authenticated;
GRANT EXECUTE ON FUNCTION mahasiswa_in_kelas(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dosen_teaches_kelas(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dosen_teaches_mahasiswa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mahasiswa_kelas_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dosen_kelas_ids() TO authenticated;

-- ============================================================================
-- TESTING QUERIES (commented out - for manual testing)
-- ============================================================================

-- Test get_user_role()
-- SELECT get_user_role();

-- Test role checkers
-- SELECT is_admin(), is_dosen(), is_laboran(), is_mahasiswa();

-- Test ID getters
-- SELECT get_current_mahasiswa_id(), get_current_dosen_id(), get_current_laboran_id();

-- Test ownership functions
-- SELECT mahasiswa_in_kelas('kelas-uuid-here');
-- SELECT dosen_teaches_kelas('kelas-uuid-here');
-- SELECT dosen_teaches_mahasiswa('mahasiswa-uuid-here');

-- Test array getters
-- SELECT get_mahasiswa_kelas_ids();
-- SELECT get_dosen_kelas_ids();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS
'RLS Helper Functions installed - Week 3 Day 1 Complete';
