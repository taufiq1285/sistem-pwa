-- ============================================================================
-- MIGRATION: Create Helper Functions for RLS Policies
-- Date: 2024-12-18
-- Description: Create utility functions needed by RLS policies
-- ============================================================================
-- This migration creates essential helper functions that are used by
-- Row Level Security (RLS) policies across the database.
--
-- Functions created:
-- 1. is_admin() - Check if current user is admin
-- 2. is_dosen() - Check if current user is dosen
-- 3. is_mahasiswa() - Check if current user is mahasiswa
-- 4. is_laboran() - Check if current user is laboran
-- 5. get_dosen_id() - Get dosen ID for current user
-- 6. get_mahasiswa_id() - Get mahasiswa ID for current user
-- 7. get_laboran_id() - Get laboran ID for current user
-- ============================================================================

-- ============================================================================
-- PART 1: ROLE CHECK FUNCTIONS
-- ============================================================================

-- Function: is_admin()
-- Returns TRUE if current user has admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin() IS
'Check if current authenticated user has admin role';

-- Function: is_dosen()
-- Returns TRUE if current user has dosen role
CREATE OR REPLACE FUNCTION is_dosen()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
          AND role = 'dosen'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_dosen() IS
'Check if current authenticated user has dosen role';

-- Function: is_mahasiswa()
-- Returns TRUE if current user has mahasiswa role
CREATE OR REPLACE FUNCTION is_mahasiswa()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
          AND role = 'mahasiswa'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_mahasiswa() IS
'Check if current authenticated user has mahasiswa role';

-- Function: is_laboran()
-- Returns TRUE if current user has laboran role
CREATE OR REPLACE FUNCTION is_laboran()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
          AND role = 'laboran'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_laboran() IS
'Check if current authenticated user has laboran role';

-- ============================================================================
-- PART 2: ID GETTER FUNCTIONS
-- ============================================================================

-- Function: get_dosen_id()
-- Returns the dosen.id for current user (NULL if not a dosen)
CREATE OR REPLACE FUNCTION get_dosen_id()
RETURNS uuid AS $$
BEGIN
    RETURN (
        SELECT id
        FROM dosen
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_dosen_id() IS
'Get dosen ID for current authenticated user. Returns NULL if user is not a dosen.';

-- Function: get_mahasiswa_id()
-- Returns the mahasiswa.id for current user (NULL if not a mahasiswa)
CREATE OR REPLACE FUNCTION get_mahasiswa_id()
RETURNS uuid AS $$
BEGIN
    RETURN (
        SELECT id
        FROM mahasiswa
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_mahasiswa_id() IS
'Get mahasiswa ID for current authenticated user. Returns NULL if user is not a mahasiswa.';

-- Function: get_laboran_id()
-- Returns the laboran.id for current user (NULL if not a laboran)
CREATE OR REPLACE FUNCTION get_laboran_id()
RETURNS uuid AS $$
BEGIN
    RETURN (
        SELECT id
        FROM laboran
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_laboran_id() IS
'Get laboran ID for current authenticated user. Returns NULL if user is not a laboran.';

-- ============================================================================
-- PART 3: VERIFICATION
-- ============================================================================

-- Verify all functions were created successfully
DO $$
DECLARE
    func_count INTEGER;
    expected_count INTEGER := 7; -- Total functions created
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'is_admin',
        'is_dosen',
        'is_mahasiswa',
        'is_laboran',
        'get_dosen_id',
        'get_mahasiswa_id',
        'get_laboran_id'
      );

    IF func_count = expected_count THEN
        RAISE NOTICE '✅ Successfully created % helper functions', func_count;
    ELSE
        RAISE WARNING '⚠️  Expected % functions but found %', expected_count, func_count;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '=== CREATED FUNCTIONS ===';
    RAISE NOTICE '• is_admin() - Check admin role';
    RAISE NOTICE '• is_dosen() - Check dosen role';
    RAISE NOTICE '• is_mahasiswa() - Check mahasiswa role';
    RAISE NOTICE '• is_laboran() - Check laboran role';
    RAISE NOTICE '• get_dosen_id() - Get dosen ID';
    RAISE NOTICE '• get_mahasiswa_id() - Get mahasiswa ID';
    RAISE NOTICE '• get_laboran_id() - Get laboran ID';
    RAISE NOTICE '========================';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20241218999999_create_helper_functions completed successfully!';
    RAISE NOTICE 'Helper functions are now available for use in RLS policies.';
END $$;
