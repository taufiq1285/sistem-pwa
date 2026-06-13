-- ============================================================================
-- DROP ALL RLS POLICIES
-- ============================================================================
-- Description: Drop all existing RLS policies to allow clean re-creation
-- Purpose: Fix policy already exists errors
-- ============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies from all tables
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy: % on table %', pol.policyname, pol.tablename;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ All RLS policies have been dropped';
    RAISE NOTICE '========================================';
END $$;
