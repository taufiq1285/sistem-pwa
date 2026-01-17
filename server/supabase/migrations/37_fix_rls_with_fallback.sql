-- ============================================================================
-- Migration 37-FIX: Restore Fallback to Users Table for RLS Role Checking
-- ============================================================================
-- Issue: Migration 36 removed table queries from role functions, but
--        if JWT doesn't include role metadata, is_dosen() returns FALSE
-- Solution: Add fallback to check users.role column (with SECURITY DEFINER)
-- ============================================================================

-- ============================================================================
-- FIX: Rewrite get_user_role() with fallback to users table
-- ============================================================================
-- This uses SECURITY DEFINER so it can query users table safely,
-- but we must be careful not to trigger RLS recursion

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    jwt_role TEXT;
    fallback_role TEXT;
BEGIN
    -- Try to get role from JWT token first
    jwt_role := COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT,
        (auth.jwt() -> 'app_metadata' ->> 'role')::TEXT
    );
    
    -- If JWT has role, return it
    IF jwt_role IS NOT NULL THEN
        RETURN jwt_role;
    END IF;
    
    -- Fallback: Get role from users table (ONLY if JWT didn't have it)
    -- Use a direct table read WITHOUT going through RLS policies
    BEGIN
        SELECT role INTO fallback_role
        FROM auth.users
        WHERE id = auth.uid()
        LIMIT 1;
        
        RETURN COALESCE(fallback_role, 'mahasiswa');
    EXCEPTION WHEN OTHERS THEN
        -- If even this fails, default to mahasiswa
        RETURN 'mahasiswa';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_role() IS
'Returns role from JWT token (preferred) or falls back to users.role column. SECURITY DEFINER prevents RLS recursion.';

-- ============================================================================
-- Recreate role checker functions (they use the new get_user_role)
-- ============================================================================

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
'Returns TRUE if user role is dosen (from JWT with fallback to users.role)';

COMMENT ON FUNCTION is_admin() IS
'Returns TRUE if user role is admin (from JWT with fallback to users.role)';

COMMENT ON FUNCTION is_mahasiswa() IS
'Returns TRUE if user role is mahasiswa (from JWT with fallback to users.role)';

COMMENT ON FUNCTION is_laboran() IS
'Returns TRUE if user role is laboran (from JWT with fallback to users.role)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test 1: Check if functions exist and work
-- SELECT is_dosen() as is_dosen, is_admin() as is_admin, get_user_role() as role;

-- Test 2: Check which roles are set in auth.users
SELECT
  u.id,
  u.email,
  u.role as users_role_column,
  u.raw_user_meta_data ->> 'role' as metadata_role,
  CASE
    WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = u.id) THEN 'dosen'
    WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = u.id) THEN 'admin'
    WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = u.id) THEN 'laboran'
    ELSE 'other'
  END as actual_role
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 10;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. This function now has a fallback to users.role column
-- 2. It will NOT cause infinite recursion because it uses SECURITY DEFINER
-- 3. JWT is preferred (faster), but users.role is used as fallback
-- 4. For production, ensure JWT includes role metadata during login
-- ============================================================================
