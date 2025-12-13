-- ============================================
-- COMPLETE FIX FOR REGISTRATION ORPHANED USER BUG
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Cleanup orphaned asti@test.com
-- ============================================
DELETE FROM public.users
WHERE email = 'asti@test.com';

-- Note: You still need to delete from auth.users manually:
-- Dashboard → Authentication → Users → Find asti@test.com → Delete

-- ============================================
-- STEP 2: Fix RLS Policies for Registration
-- ============================================

-- Fix users table
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_registration" ON users;

CREATE POLICY "users_insert_registration" ON users
    FOR INSERT
    WITH CHECK (
        auth.uid() = id OR auth.uid() IS NULL
    );

-- Fix mahasiswa table
DROP POLICY IF EXISTS "mahasiswa_insert_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_insert_registration" ON mahasiswa;

CREATE POLICY "mahasiswa_insert_registration" ON mahasiswa
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR auth.uid() IS NULL
    );

-- Fix dosen table
DROP POLICY IF EXISTS "dosen_insert_own" ON dosen;
DROP POLICY IF EXISTS "dosen_insert_registration" ON dosen;

CREATE POLICY "dosen_insert_registration" ON dosen
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR auth.uid() IS NULL
    );

-- Fix laboran table
DROP POLICY IF EXISTS "laboran_insert_own" ON laboran;
DROP POLICY IF EXISTS "laboran_insert_registration" ON laboran;

CREATE POLICY "laboran_insert_registration" ON laboran
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR auth.uid() IS NULL
    );

-- Fix admin table
DROP POLICY IF EXISTS "admin_insert_own" ON admin;
DROP POLICY IF EXISTS "admin_insert_registration" ON admin;

CREATE POLICY "admin_insert_registration" ON admin
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR auth.uid() IS NULL
    );

-- ============================================
-- STEP 3: Verify Changes Applied
-- ============================================

-- Check policies updated
SELECT
    tablename,
    policyname,
    cmd,
    CASE
        WHEN with_check::text LIKE '%auth.uid() IS NULL%' THEN '✅ FIXED'
        ELSE '❌ NOT FIXED'
    END as status
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'laboran', 'admin')
    AND policyname LIKE '%insert%'
ORDER BY tablename;

-- Check cleanup successful
SELECT
    'public.users' as table_name,
    COUNT(*) as orphaned_count
FROM public.users
WHERE email = 'asti@test.com';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ RLS POLICIES FIXED!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Delete asti@test.com from Dashboard UI:';
    RAISE NOTICE '   Authentication → Users → Delete';
    RAISE NOTICE '';
    RAISE NOTICE '2. Test registration at:';
    RAISE NOTICE '   http://localhost:5173/register';
    RAISE NOTICE '';
    RAISE NOTICE '3. Verify no orphaned users created';
    RAISE NOTICE '============================================';
END $$;
