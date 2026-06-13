-- ============================================================================
-- FIX MAHASISWA RLS POLICIES FOR KUIS & ATTEMPT_KUIS
-- Purpose: Fix RLS policies so mahasiswa can read kuis and create attempts
-- Date: 2025-02-02
-- ============================================================================

-- ============================================================================
-- PROBLEM: is_mahasiswa() and helper functions don't work in RLS context
-- SOLUTION: Create direct policies without using helper functions
-- ============================================================================

-- ============================================================================
-- PART 1: FIX kuis table - SELECT policy for mahasiswa
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "kuis_select_mahasiswa" ON kuis;

-- Create new policy without helper functions
CREATE POLICY "kuis_select_mahasiswa" ON kuis
    FOR SELECT
    USING (
        -- Mahasiswa harus enrolled di kelas
        EXISTS (
            SELECT 1
            FROM kelas_mahasiswa km
            JOIN mahasiswa m ON km.mahasiswa_id = m.id
            WHERE m.user_id = auth.uid()
              AND km.kelas_id = kuis.kelas_id
              AND km.is_active = true
        )
        AND status = 'published'
    );

-- ============================================================================
-- PART 2: FIX attempt_kuis table - INSERT policy for mahasiswa
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "attempt_kuis_insert_mahasiswa" ON attempt_kuis;
DROP POLICY IF EXISTS "attempt_kuis_select_dosen" ON attempt_kuis;
DROP POLICY IF EXISTS "attempt_kuis_update_dosen" ON attempt_kuis;

-- Create helper function that works
CREATE OR REPLACE FUNCTION get_my_mahasiswa_id()
RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    SELECT id INTO result_id
    FROM mahasiswa
    WHERE user_id = auth.uid();

    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_my_mahasiswa_id() IS
'Returns current mahasiswa ID - simplified version that works in RLS context';

-- Grant permission
GRANT EXECUTE ON FUNCTION get_my_mahasiswa_id() TO authenticated;

-- Create INSERT policy using the helper function
CREATE POLICY "attempt_kuis_insert_mahasiswa" ON attempt_kuis
    FOR INSERT
    WITH CHECK (
        mahasiswa_id = get_my_mahasiswa_id()
    );

-- ============================================================================
-- PART 3: VERIFY FIXES
-- ============================================================================

-- Verify kuis policies
DO $$
DECLARE
    kuis_policy_count INT;
BEGIN
    SELECT COUNT(*) INTO kuis_policy_count
    FROM pg_policies
    WHERE tablename = 'kuis'
      AND policyname = 'kuis_select_mahasiswa';

    IF kuis_policy_count = 0 THEN
        RAISE EXCEPTION 'Policy kuis_select_mahasiswa not found!';
    END IF;

    RAISE NOTICE '✅ kuis_select_mahasiswa policy verified';
END $$;

-- Verify attempt_kuis policies
DO $$
DECLARE
    attempt_policy_count INT;
BEGIN
    SELECT COUNT(*) INTO attempt_policy_count
    FROM pg_policies
    WHERE tablename = 'attempt_kuis'
      AND policyname = 'attempt_kuis_insert_mahasiswa';

    IF attempt_policy_count = 0 THEN
        RAISE EXCEPTION 'Policy attempt_kuis_insert_mahasiswa not found!';
    END IF;

    RAISE NOTICE '✅ attempt_kuis_insert_mahasiswa policy verified';
END $$;

-- ============================================================================
-- PART 4: SHOW FINAL POLICIES
-- ============================================================================

SELECT
    tablename,
    policyname,
    cmd,
    permissive,
    left(with_check, 150) as with_check_preview
FROM pg_policies
WHERE tablename IN ('kuis', 'attempt_kuis')
  AND cmd IN ('SELECT', 'INSERT')
ORDER BY tablename, cmd;
