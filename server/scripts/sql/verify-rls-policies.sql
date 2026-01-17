-- ============================================================================
-- VERIFY RLS POLICIES FOR REGISTRATION
-- ============================================================================
-- Jalankan query ini di Supabase Dashboard > SQL Editor
-- untuk memastikan RLS policies sudah benar
-- ============================================================================

-- CHECK 1: Verify INSERT policies for all tables
SELECT
    tablename,
    policyname,
    cmd AS command,
    with_check AS check_condition
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'laboran', 'admin')
    AND cmd = 'INSERT'
ORDER BY tablename, policyname;

-- Expected result for each table:
-- tablename | policyname                    | command | check_condition
-- ----------|-------------------------------|---------|------------------
-- users     | users_insert_registration     | INSERT  | (auth.uid() = id) OR (auth.uid() IS NULL)
-- mahasiswa | mahasiswa_insert_registration | INSERT  | (user_id = auth.uid()) OR (auth.uid() IS NULL)
-- dosen     | dosen_insert_registration     | INSERT  | (user_id = auth.uid()) OR (auth.uid() IS NULL)
-- laboran   | laboran_insert_registration   | INSERT  | (user_id = auth.uid()) OR (auth.uid() IS NULL)
-- admin     | admin_insert_registration     | INSERT  | (user_id = auth.uid()) OR (auth.uid() IS NULL)

-- ============================================================================

-- CHECK 2: Test if current user can insert to users table
DO $$
BEGIN
    RAISE NOTICE 'Current auth.uid(): %', auth.uid();
END $$;

-- ============================================================================

-- CHECK 3: Verify SELECT policies (needed for createUserProfile)
SELECT
    tablename,
    policyname,
    cmd AS command,
    qual AS using_condition
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'laboran', 'admin')
    AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- ============================================================================

-- CHECK 4: List all policies for users table (detail)
SELECT
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================================================

-- JIKA POLICIES TIDAK ADA atau SALAH, APPLY MIGRATION 30
-- ============================================================================

/*
-- Uncomment dan jalankan jika policies tidak sesuai expected:

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
*/
