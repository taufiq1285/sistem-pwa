-- ============================================================================
-- FIX: Dosen cannot insert jadwal_praktikum (403 Forbidden)
-- ============================================================================
-- Issue: POST jadwal_praktikum returns 403 for dosen users
-- Root Cause: INSERT policy mungkin tidak ada atau is_dosen() function issue
-- ============================================================================

-- STEP 1: Verify RLS is enabled on jadwal_praktikum
SELECT
    '=== RLS STATUS ===' as check_section,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'jadwal_praktikum';

-- Expected: rls_enabled = true

-- ============================================================================
-- STEP 2: Check existing INSERT policies
-- ============================================================================

SELECT
    '=== CURRENT INSERT POLICIES ===' as check_section,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'jadwal_praktikum'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Expected: Should have "jadwal_praktikum_insert_dosen" policy

-- ============================================================================
-- STEP 3: Check is_dosen() function
-- ============================================================================

-- Test if is_dosen() function exists and works
SELECT
    '=== IS_DOSEN FUNCTION ===' as check_section,
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'is_dosen'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- STEP 4: FIX - Recreate INSERT policy for dosen
-- ============================================================================

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;

-- Create new INSERT policy for dosen
CREATE POLICY "jadwal_praktikum_insert_dosen"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (
    -- User must be a dosen
    EXISTS (
        SELECT 1
        FROM public.dosen
        WHERE dosen.user_id = auth.uid()
    )
);

-- ============================================================================
-- STEP 5: VERIFY - Check policy was created
-- ============================================================================

SELECT
    '=== VERIFICATION ===' as check_section,
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'jadwal_praktikum'
AND cmd = 'INSERT';

-- Expected: jadwal_praktikum_insert_dosen with EXISTS subquery

-- ============================================================================
-- STEP 6: TEST - Try INSERT as dosen (run this while logged in as dosen)
-- ============================================================================

/*
-- This is commented out - run manually in Supabase SQL Editor while logged in as dosen

-- Get a kelas_id and laboratorium_id for testing
SELECT
    k.id as kelas_id,
    l.id as lab_id
FROM kelas k
CROSS JOIN laboratorium l
LIMIT 1;

-- Try to insert test jadwal (replace UUIDs with actual values from above)
INSERT INTO jadwal_praktikum (
    kelas_id,
    laboratorium_id,
    hari,
    jam_mulai,
    jam_selesai,
    tanggal_praktikum,
    topik
) VALUES (
    '<KELAS_ID>',
    '<LAB_ID>',
    'senin',
    '08:00',
    '10:00',
    CURRENT_DATE + INTERVAL '1 day',
    'TEST INSERT - Please delete after test'
);

-- If successful, clean up:
-- DELETE FROM jadwal_praktikum WHERE topik = 'TEST INSERT - Please delete after test';
*/

-- ============================================================================
-- ALTERNATIVE FIX: If is_dosen() function is the problem
-- ============================================================================

-- If is_dosen() doesn't work, recreate it:
CREATE OR REPLACE FUNCTION public.is_dosen()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.dosen
        WHERE dosen.user_id = auth.uid()
    );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_dosen() TO authenticated;

-- ============================================================================
-- STEP 7: Re-create INSERT policy using is_dosen() function
-- ============================================================================

-- Drop and recreate with function
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_insert_dosen"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_dosen()
);

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

SELECT
    '=== FINAL CHECK ===' as check_section,
    'Policy' as item,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'jadwal_praktikum'
AND cmd = 'INSERT'
UNION ALL
SELECT
    '=== FINAL CHECK ===',
    'Function is_dosen()',
    COUNT(*)
FROM pg_proc
WHERE proname = 'is_dosen';

-- Expected:
-- Policy: 1
-- Function is_dosen(): 1

-- ============================================================================
-- NOTES
-- ============================================================================

-- Common causes of 403 Forbidden on INSERT:
-- 1. No INSERT policy exists
-- 2. INSERT policy WITH CHECK condition fails
-- 3. is_dosen() function doesn't exist or returns false
-- 4. User not actually logged in as dosen
-- 5. RLS not enabled (but would be different error)

-- To debug further:
-- 1. Check user's role in users table
-- 2. Check dosen record exists for user_id
-- 3. Try SELECT is_dosen() while logged in
-- 4. Check auth.uid() returns correct user ID

-- ============================================================================
-- END OF FIX
-- ============================================================================
