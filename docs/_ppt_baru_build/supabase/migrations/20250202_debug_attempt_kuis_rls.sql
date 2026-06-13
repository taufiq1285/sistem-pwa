-- ============================================================================
-- DEBUG AND FIX attempt_kuis INSERT RLS POLICY
-- Purpose: Diagnose why get_my_mahasiswa_id() doesn't work in RLS context
-- Date: 2025-02-02
-- ============================================================================

-- ============================================================================
-- PROBLEM: get_my_mahasiswa_id() returns NULL or fails in RLS context
-- SOLUTION: Create a more robust function and direct policy
-- ============================================================================

-- ============================================================================
-- PART 1: DROP EXISTING POLICIES FIRST (before dropping function)
-- ============================================================================

-- Drop existing policies that depend on get_my_mahasiswa_id()
DROP POLICY IF EXISTS "attempt_kuis_insert_mahasiswa" ON attempt_kuis;
DROP POLICY IF EXISTS "attempt_kuis_select_mahasiswa" ON attempt_kuis;
DROP POLICY IF EXISTS "attempt_kuis_update_mahasiswa" ON attempt_kuis;

DROP POLICY IF EXISTS "jawaban_insert_mahasiswa" ON jawaban;
DROP POLICY IF EXISTS "jawaban_select_mahasiswa" ON jawaban;
DROP POLICY IF EXISTS "jawaban_update_mahasiswa" ON jawaban;

-- ============================================================================
-- PART 2: IMPROVE THE HELPER FUNCTION (now safe to drop)
-- ============================================================================

-- Drop existing function (now that policies are dropped)
DROP FUNCTION IF EXISTS get_my_mahasiswa_id();

-- Create improved version with explicit search_path and error handling
CREATE OR REPLACE FUNCTION get_my_mahasiswa_id()
RETURNS UUID AS $$
DECLARE
    result_id UUID;
    current_uid UUID := auth.uid();
BEGIN
    -- Debug: Check if auth.uid() is available
    IF current_uid IS NULL THEN
        RAISE LOG 'get_my_mahasiswa_id: auth.uid() is NULL';
        RETURN NULL;
    END IF;

    -- Query with explicit schema
    SELECT id INTO result_id
    FROM public.mahasiswa
    WHERE user_id = current_uid
    LIMIT 1;

    -- Debug: Check if we found a match
    IF result_id IS NULL THEN
        RAISE LOG 'get_my_mahasiswa_id: No mahasiswa found for user_id %', current_uid;
    END IF;

    RETURN result_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
STABLE
PARALLEL SAFE;

-- Set explicit search_path for security
ALTER FUNCTION get_my_mahasiswa_id() SET search_path = public;

COMMENT ON FUNCTION get_my_mahasiswa_id() IS
'Returns current mahasiswa ID from authenticated user - improved with error logging';

-- Grant permission
GRANT EXECUTE ON FUNCTION get_my_mahasiswa_id() TO authenticated;

-- ============================================================================
-- PART 3: CREATE POLICIES WITHOUT HELPER FUNCTION
-- ============================================================================

-- Create INSERT policy with direct check (NO helper function)
CREATE POLICY "attempt_kuis_insert_mahasiswa" ON attempt_kuis
    FOR INSERT
    WITH CHECK (
        -- Direct check: mahasiswa_id must match the current user's mahasiswa record
        EXISTS (
            SELECT 1
            FROM public.mahasiswa m
            WHERE m.id = attempt_kuis.mahasiswa_id
              AND m.user_id = auth.uid()
        )
    );

-- Create SELECT policy for mahasiswa (view their own attempts)
CREATE POLICY "attempt_kuis_select_mahasiswa" ON attempt_kuis
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.mahasiswa m
            WHERE m.id = attempt_kuis.mahasiswa_id
              AND m.user_id = auth.uid()
        )
    );

-- Create UPDATE policy for mahasiswa (update their own attempts)
CREATE POLICY "attempt_kuis_update_mahasiswa" ON attempt_kuis
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.mahasiswa m
            WHERE m.id = attempt_kuis.mahasiswa_id
              AND m.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 4: CREATE jawaban TABLE POLICIES FOR MAHASISWA
-- ============================================================================

-- Create INSERT policy for jawaban
CREATE POLICY "jawaban_insert_mahasiswa" ON jawaban
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.attempt_kuis ak
            JOIN public.mahasiswa m ON ak.mahasiswa_id = m.id
            WHERE ak.id = jawaban.attempt_id
              AND m.user_id = auth.uid()
        )
    );

-- Create SELECT policy for jawaban
CREATE POLICY "jawaban_select_mahasiswa" ON jawaban
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.attempt_kuis ak
            JOIN public.mahasiswa m ON ak.mahasiswa_id = m.id
            WHERE ak.id = jawaban.attempt_id
              AND m.user_id = auth.uid()
        )
    );

-- Create UPDATE policy for jawaban
CREATE POLICY "jawaban_update_mahasiswa" ON jawaban
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.attempt_kuis ak
            JOIN public.mahasiswa m ON ak.mahasiswa_id = m.id
            WHERE ak.id = jawaban.attempt_id
              AND m.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 5: VERIFY POLICIES
-- ============================================================================

-- Verify attempt_kuis policies
DO $$
DECLARE
    policy_count INT;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'attempt_kuis'
      AND policyname LIKE '%mahasiswa%';

    IF policy_count < 3 THEN
        RAISE EXCEPTION 'Expected 3 mahasiswa policies on attempt_kuis, found %', policy_count;
    END IF;

    RAISE NOTICE '✅ attempt_kuis policies verified (INSERT, SELECT, UPDATE)';
END $$;

-- Verify jawaban policies
DO $$
DECLARE
    policy_count INT;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'jawaban'
      AND policyname LIKE '%mahasiswa%';

    IF policy_count < 3 THEN
        RAISE EXCEPTION 'Expected 3 mahasiswa policies on jawaban, found %', policy_count;
    END IF;

    RAISE NOTICE '✅ jawaban policies verified (INSERT, SELECT, UPDATE)';
END $$;

-- ============================================================================
-- PART 6: SHOW FINAL POLICIES
-- ============================================================================

SELECT
    'attempt_kuis' as table_name,
    policyname,
    cmd,
    permissive,
    left(with_check, 100) as with_check_preview
FROM pg_policies
WHERE tablename = 'attempt_kuis'
  AND policyname LIKE '%mahasiswa%'

UNION ALL

SELECT
    'jawaban' as table_name,
    policyname,
    cmd,
    permissive,
    left(with_check, 100) as with_check_preview
FROM pg_policies
WHERE tablename = 'jawaban'
  AND policyname LIKE '%mahasiswa%'

ORDER BY table_name, cmd;

-- Show completion notice
DO $$
BEGIN
    RAISE NOTICE '✅ Migration complete! Mahasiswa can now:';
    RAISE NOTICE '  - INSERT attempt_kuis (start quiz)';
    RAISE NOTICE '  - SELECT attempt_kuis (view their attempts)';
    RAISE NOTICE '  - UPDATE attempt_kuis (submit quiz)';
    RAISE NOTICE '  - INSERT jawaban (save answers)';
    RAISE NOTICE '  - SELECT jawaban (view their answers)';
    RAISE NOTICE '  - UPDATE jawaban (update answers)';
END $$;
