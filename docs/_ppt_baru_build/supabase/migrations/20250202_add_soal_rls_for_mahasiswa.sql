-- ============================================================================
-- ADD RLS POLICIES FOR MAHASISWA ON soal TABLE
-- Purpose: Allow mahasiswa to read questions from published quizzes
-- Date: 2025-02-02
-- ============================================================================

-- ============================================================================
-- PROBLEM: Mahasiswa cannot see questions when starting quiz
-- SOLUTION: Add SELECT policy for soal table
-- ============================================================================

-- ============================================================================
-- PART 1: CHECK RLS IS ENABLED
-- ============================================================================

ALTER TABLE soal ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: CREATE POLICIES FOR MAHASISWA
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "soal_select_mahasiswa" ON soal;

-- Create SELECT policy for mahasiswa
-- Mahasiswa can read questions from published quizzes in their enrolled classes
CREATE POLICY "soal_select_mahasiswa" ON soal
    FOR SELECT
    USING (
        EXISTS (
            -- Mahasiswa harus enrolled di kelas
            SELECT 1
            FROM kelas_mahasiswa km
            JOIN mahasiswa m ON km.mahasiswa_id = m.id
            JOIN kuis k ON soal.kuis_id = k.id
            WHERE m.user_id = auth.uid()
              AND km.kelas_id = k.kelas_id
              AND km.is_active = true
              AND k.status = 'published'
        )
    );

-- ============================================================================
-- PART 3: VERIFY POLICY
-- ============================================================================

-- Verify policy was created
DO $$
DECLARE
    policy_count INT;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'soal'
      AND policyname = 'soal_select_mahasiswa';

    IF policy_count = 0 THEN
        RAISE EXCEPTION 'Policy soal_select_mahasiswa not found!';
    END IF;

    RAISE NOTICE '✅ soal_select_mahasiswa policy verified';
END $$;

-- ============================================================================
-- PART 4: SHOW FINAL POLICY
-- ============================================================================

SELECT
    tablename,
    policyname,
    cmd,
    permissive,
    left(qual, 150) as qual_preview
FROM pg_policies
WHERE tablename = 'soal'
  AND policyname = 'soal_select_mahasiswa';

-- Show completion notice
DO $$
BEGIN
    RAISE NOTICE '✅ Migration complete! Mahasiswa can now:';
    RAISE NOTICE '  - SELECT soal (view questions from published quizzes)';
END $$;
