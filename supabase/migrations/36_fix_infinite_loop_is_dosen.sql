-- ============================================================================
-- Migration 36: Fix Infinite Loop in is_dosen() Function
-- ============================================================================
-- Issue: INSERT on jadwal_praktikum HANGS (timeout after 10s)
-- Cause: is_dosen() function queries 'users' table which has RLS policies
--        This creates infinite recursion when called from RLS policy
-- Solution: Rewrite is_dosen() to use JWT claims directly (no table query)
-- ============================================================================

-- ============================================================================
-- BACKUP: Check current function definitions
-- ============================================================================

SELECT
  proname,
  prosrc
FROM pg_proc
WHERE proname IN ('is_dosen', 'get_user_role', 'is_admin', 'is_mahasiswa', 'is_laboran');

-- ============================================================================
-- FIX: Rewrite ALL role checker functions to use JWT claims (no DB queries)
-- ============================================================================

-- Get user role from JWT token (NOT from users table)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    -- Get role from JWT token user_metadata
    -- This DOES NOT query any table, preventing infinite recursion
    RETURN COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT,
        'mahasiswa' -- Default role if not set
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_role() IS
'Returns role from JWT token user_metadata (no table query - safe for RLS)';

-- Recreate all role checker functions (they now use JWT-based get_user_role)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_dosen()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'dosen', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_laboran()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'laboran', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_mahasiswa()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'mahasiswa', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON FUNCTION is_dosen() IS
'Returns TRUE if user role is dosen (from JWT token - no table query)';

COMMENT ON FUNCTION is_admin() IS
'Returns TRUE if user role is admin (from JWT token - no table query)';

COMMENT ON FUNCTION is_mahasiswa() IS
'Returns TRUE if user role is mahasiswa (from JWT token - no table query)';

COMMENT ON FUNCTION is_laboran() IS
'Returns TRUE if user role is laboran (from JWT token - no table query)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test the functions (run while logged in as dosen)
-- SELECT
--   is_dosen() as is_dosen,
--   is_admin() as is_admin,
--   get_user_role() as role_from_jwt;

-- Should return:
-- is_dosen: true
-- is_admin: false
-- role_from_jwt: 'dosen'

-- ============================================================================
-- IMPORTANT NOTE
-- ============================================================================

-- These functions now read from JWT token (user_metadata.role)
-- NOT from users table
-- This prevents infinite recursion in RLS policies
--
-- The role is set during registration in auth.users.raw_user_meta_data
-- and is included in the JWT token automatically
-- ============================================================================
