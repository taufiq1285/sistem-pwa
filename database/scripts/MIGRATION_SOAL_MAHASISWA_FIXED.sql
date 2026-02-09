-- ============================================================================
-- CREATE SOAL VIEW FOR MAHASISWA (WITHOUT ANSWERS) - FIXED VERSION
-- ============================================================================
-- Purpose: Prevent mahasiswa from seeing jawaban_benar while attempting quiz
-- Security: jawaban_benar only visible AFTER quiz submitted
-- ============================================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS soal_mahasiswa CASCADE;

-- Create view that excludes sensitive fields
-- ✅ FIXED: Using correct column names from database
CREATE VIEW soal_mahasiswa AS
SELECT
  id,
  kuis_id,
  pertanyaan,
  tipe,                      -- ✅ Correct name (not tipe_soal)
  poin,
  urutan,
  pilihan_jawaban,           -- ✅ Correct name (not opsi_jawaban)
  -- ✅ HIDE jawaban_benar (NULL for security)
  NULL::TEXT as jawaban_benar,
  -- ✅ HIDE pembahasan (only show after submit)
  NULL::TEXT as pembahasan,  -- ✅ Correct name (not penjelasan)
  created_at,
  updated_at
FROM soal;

-- Grant access to authenticated users
GRANT SELECT ON soal_mahasiswa TO authenticated;

-- Add comment
COMMENT ON VIEW soal_mahasiswa IS
'Secure view of soal table for mahasiswa during quiz attempt.
Excludes jawaban_benar and pembahasan to prevent cheating.
Use this view when mahasiswa is ATTEMPTING quiz.
Use original soal table when mahasiswa is VIEWING RESULTS.';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ View soal_mahasiswa created successfully!';
    RAISE NOTICE 'ℹ️  This view hides jawaban_benar during quiz attempt';
END $$;
