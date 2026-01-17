-- ============================================================================
-- DEBUG: Jadwal 403 Forbidden Error
-- Run queries ini satu per satu di Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Check Current User & Role
-- ============================================================================
SELECT
    auth.uid() as current_user_id,
    (SELECT role FROM users WHERE id = auth.uid()) as current_role,
    (SELECT full_name FROM users WHERE id = auth.uid()) as current_name;

-- Expected: Harus ada role (admin/dosen/laboran/mahasiswa)
-- Jika NULL → problem di auth atau user data


-- ============================================================================
-- STEP 2: Check Existing INSERT Policies
-- ============================================================================
SELECT
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check as check_clause
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Expected: Minimal ada 1 policy untuk INSERT
-- Jika kosong → RLS policy belum dibuat


-- ============================================================================
-- STEP 3: Check Helper Functions Exist
-- ============================================================================
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN (
    'is_admin',
    'is_dosen',
    'is_laboran',
    'get_current_dosen_id'
)
ORDER BY proname;

-- Expected: Semua 4 functions harus ada
-- Jika kurang → migration belum lengkap


-- ============================================================================
-- STEP 4: Test Helper Functions
-- ============================================================================
SELECT
    'is_admin()' as function_name,
    is_admin() as result
UNION ALL
SELECT
    'is_dosen()' as function_name,
    is_dosen() as result
UNION ALL
SELECT
    'is_laboran()' as function_name,
    is_laboran() as result;

-- Expected: Salah satu harus TRUE sesuai role Anda


-- ============================================================================
-- STEP 5: Check get_current_dosen_id() (if you're dosen)
-- ============================================================================
SELECT get_current_dosen_id() as my_dosen_id;

-- Expected: UUID jika Anda dosen, NULL jika bukan


-- ============================================================================
-- STEP 6: List ALL Policies for jadwal_praktikum
-- ============================================================================
SELECT
    policyname,
    cmd as operation,
    CASE
        WHEN cmd = 'SELECT' THEN '✅ Read'
        WHEN cmd = 'INSERT' THEN '➕ Create'
        WHEN cmd = 'UPDATE' THEN '✏️ Update'
        WHEN cmd = 'DELETE' THEN '🗑️ Delete'
    END as action,
    CASE
        WHEN qual IS NOT NULL THEN 'USING: ' || left(qual::text, 50)
        ELSE ''
    END as policy_details
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- Expected: Harus ada policies untuk INSERT, UPDATE, DELETE
-- Migration sebelumnya hanya buat SELECT policies!


-- ============================================================================
-- STEP 7: Check RLS Enabled
-- ============================================================================
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';

-- Expected: rls_enabled = true


-- ============================================================================
-- FIX: Create Missing INSERT/UPDATE/DELETE Policies
-- ============================================================================

-- Drop old policies (if any)
DROP POLICY IF EXISTS "jadwal_insert_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_dosen" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_update_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_dosen" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_delete_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_dosen" ON jadwal_praktikum;

-- ============================================================================
-- CREATE INSERT POLICIES
-- ============================================================================

-- Admin: Can insert all
CREATE POLICY "jadwal_insert_admin" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_admin());

-- Laboran: Can insert all (untuk create jadwal)
CREATE POLICY "jadwal_insert_laboran" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_laboran());

-- Dosen: Can insert for their own kelas
CREATE POLICY "jadwal_insert_dosen" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ============================================================================
-- CREATE UPDATE POLICIES
-- ============================================================================

-- Admin: Can update all
CREATE POLICY "jadwal_update_admin" ON jadwal_praktikum
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Laboran: Can update all (untuk approve/reject)
CREATE POLICY "jadwal_update_laboran" ON jadwal_praktikum
    FOR UPDATE
    USING (is_laboran())
    WITH CHECK (is_laboran());

-- Dosen: Can update their own kelas jadwal (yang pending)
CREATE POLICY "jadwal_update_dosen" ON jadwal_praktikum
    FOR UPDATE
    USING (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    )
    WITH CHECK (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ============================================================================
-- CREATE DELETE POLICIES
-- ============================================================================

-- Admin: Can delete all
CREATE POLICY "jadwal_delete_admin" ON jadwal_praktikum
    FOR DELETE
    USING (is_admin());

-- Laboran: Can delete pending jadwal (reject action)
CREATE POLICY "jadwal_delete_laboran" ON jadwal_praktikum
    FOR DELETE
    USING (
        is_laboran()
        AND is_active = false -- only pending ones
    );

-- Dosen: Can delete their own pending jadwal
CREATE POLICY "jadwal_delete_dosen" ON jadwal_praktikum
    FOR DELETE
    USING (
        is_dosen()
        AND is_active = false
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    );


-- ============================================================================
-- VERIFICATION: Check All Policies Created
-- ============================================================================
SELECT
    policyname,
    cmd as operation,
    CASE
        WHEN cmd = 'SELECT' THEN '✅'
        WHEN cmd = 'INSERT' THEN '➕'
        WHEN cmd = 'UPDATE' THEN '✏️'
        WHEN cmd = 'DELETE' THEN '🗑️'
    END as icon
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- Expected: Total 12 policies
-- - 4 SELECT (admin, dosen, laboran, mahasiswa)
-- - 3 INSERT (admin, dosen, laboran)
-- - 3 UPDATE (admin, dosen, laboran)
-- - 3 DELETE (admin, dosen, laboran - note: mahasiswa cannot delete)


-- ============================================================================
-- TEST INSERT (after fix)
-- ============================================================================
-- Try insert test data (adjust IDs to match your data)
-- Run this ONLY if you want to test

/*
INSERT INTO jadwal_praktikum (
    kelas_id,
    laboratorium_id,
    hari,
    jam_mulai,
    jam_selesai,
    topik,
    tanggal_praktikum
) VALUES (
    'YOUR_KELAS_ID',
    'YOUR_LAB_ID',
    'senin',
    '08:00',
    '10:00',
    'Test Permission Fix',
    CURRENT_DATE + INTERVAL '7 days'
);

-- Check inserted
SELECT id, topik, is_active, created_at
FROM jadwal_praktikum
WHERE topik = 'Test Permission Fix';
-- Expected: is_active = false (pending approval)
*/
