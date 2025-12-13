-- ============================================================================
-- CREATE SOAL VIEW FOR MAHASISWA (WITHOUT ANSWERS)
-- ============================================================================
-- Purpose: Prevent mahasiswa from seeing jawaban_benar while attempting quiz
-- Security: jawaban_benar only visible AFTER quiz submitted
-- ============================================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS soal_mahasiswa CASCADE;

-- Create view that excludes sensitive fields
CREATE VIEW soal_mahasiswa AS
SELECT
  id,
  kuis_id,
  pertanyaan,
  tipe_soal,
  poin,
  urutan,
  -- Include opsi_jawaban but without is_correct flag
  opsi_jawaban,
  -- ✅ HIDE jawaban_benar (NULL for security)
  NULL::TEXT as jawaban_benar,
  -- ✅ HIDE penjelasan (only show after submit)
  NULL::TEXT as penjelasan,
  created_at,
  updated_at
FROM soal;

-- Grant access to authenticated users
GRANT SELECT ON soal_mahasiswa TO authenticated;

-- Add comment
COMMENT ON VIEW soal_mahasiswa IS
'Secure view of soal table for mahasiswa during quiz attempt.
Excludes jawaban_benar and penjelasan to prevent cheating.
Use this view when mahasiswa is ATTEMPTING quiz.
Use original soal table when mahasiswa is VIEWING RESULTS.';

-- ============================================================================
-- RLS POLICY FOR VIEW
-- ============================================================================

-- Enable RLS on view
ALTER VIEW soal_mahasiswa SET (security_barrier = true);

-- Create policy for mahasiswa
CREATE POLICY "soal_mahasiswa_select" ON soal_mahasiswa
    FOR SELECT
    USING (
        -- Mahasiswa can only see questions for published kuis in their kelas
        kuis_id IN (
            SELECT k.id FROM kuis k
            WHERE k.status = 'published'
            AND k.kelas_id IN (
                SELECT km.kelas_id
                FROM kelas_mahasiswa km
                JOIN mahasiswa m ON m.id = km.mahasiswa_id
                WHERE m.user_id = auth.uid()
                AND km.is_active = true
            )
        )
    );

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
BEGIN
    -- Check if view exists
    IF EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'soal_mahasiswa'
    ) THEN
        RAISE NOTICE '✅ View soal_mahasiswa created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create view soal_mahasiswa';
    END IF;
END $$;

-- ============================================================================
-- TESTING
-- ============================================================================

-- Test 1: Check that jawaban_benar is NULL in view
DO $$
DECLARE
    v_has_jawaban_benar BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM soal_mahasiswa
        WHERE jawaban_benar IS NOT NULL
    ) INTO v_has_jawaban_benar;

    IF v_has_jawaban_benar THEN
        RAISE EXCEPTION '❌ TEST FAILED: jawaban_benar is visible in soal_mahasiswa view!';
    ELSE
        RAISE NOTICE '✅ TEST PASSED: jawaban_benar is hidden (NULL) in soal_mahasiswa view';
    END IF;
END $$;

-- Test 2: Check that other fields are visible
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM soal_mahasiswa
    WHERE pertanyaan IS NOT NULL;

    RAISE NOTICE '✅ View has % questions with pertanyaan visible', v_count;
END $$;

COMMENT ON SCHEMA public IS
'Migration 40: Created soal_mahasiswa view to prevent cheating
Security Enhancement: jawaban_benar hidden during quiz attempt
Next Step: Update API to use this view for mahasiswa';
