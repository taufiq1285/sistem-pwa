-- Fix RLS policies to allow user registration
-- Problem: auth.uid() is NULL during registration, blocking INSERT operations
-- Solution: Allow INSERT when auth.uid() IS NULL (registration) OR matches user_id (self-insert)

-- ============================================
-- FIX: users table INSERT policy
-- ============================================
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_registration" ON users;

CREATE POLICY "users_insert_registration" ON users
    FOR INSERT
    WITH CHECK (
        auth.uid() = id OR auth.uid() IS NULL
    );

-- ============================================
-- FIX: mahasiswa table INSERT policy
-- ============================================
DROP POLICY IF EXISTS "mahasiswa_insert_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_insert_registration" ON mahasiswa;

CREATE POLICY "mahasiswa_insert_registration" ON mahasiswa
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR auth.uid() IS NULL
    );

-- ============================================
-- FIX: dosen table INSERT policy
-- ============================================
DROP POLICY IF EXISTS "dosen_insert_own" ON dosen;
DROP POLICY IF EXISTS "dosen_insert_registration" ON dosen;

CREATE POLICY "dosen_insert_registration" ON dosen
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR auth.uid() IS NULL
    );

-- ============================================
-- FIX: laboran table INSERT policy
-- ============================================
DROP POLICY IF EXISTS "laboran_insert_own" ON laboran;
DROP POLICY IF EXISTS "laboran_insert_registration" ON laboran;

CREATE POLICY "laboran_insert_registration" ON laboran
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR auth.uid() IS NULL
    );

-- ============================================
-- FIX: admin table INSERT policy
-- ============================================
DROP POLICY IF EXISTS "admin_insert_own" ON admin;
DROP POLICY IF EXISTS "admin_insert_registration" ON admin;

CREATE POLICY "admin_insert_registration" ON admin
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR auth.uid() IS NULL
    );

-- ============================================
-- Verify policies updated
-- ============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'laboran', 'admin')
    AND policyname LIKE '%insert%'
ORDER BY tablename, policyname;
