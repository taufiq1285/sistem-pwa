-- ============================================================================
-- CREATE SOAL VIEW FOR MAHASISWA (WITHOUT ANSWERS)
-- ============================================================================
-- Strategy: Create view with ALIASED columns to match TypeScript interface
-- This way we support both database column names AND TypeScript field names
-- ============================================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS soal_mahasiswa CASCADE;

-- Create view with column aliases to match TypeScript types
CREATE VIEW soal_mahasiswa AS
SELECT
  id,
  kuis_id,
  pertanyaan,
  -- Alias database columns to match TypeScript interface
  tipe as tipe_soal,                         -- DB: tipe → TS: tipe_soal
  poin,
  urutan,
  pilihan_jawaban as opsi_jawaban,           -- DB: pilihan_jawaban → TS: opsi_jawaban
  -- ✅ HIDE jawaban_benar (NULL for security)
  NULL::TEXT as jawaban_benar,
  -- ✅ HIDE pembahasan (only show after submit)
  NULL::TEXT as penjelasan,                  -- DB: pembahasan → TS: penjelasan
  created_at,
  updated_at
FROM soal;

-- Grant access to authenticated users
GRANT SELECT ON soal_mahasiswa TO authenticated;

-- Add comment
COMMENT ON VIEW soal_mahasiswa IS
'Secure view of soal table for mahasiswa during quiz attempt.
Excludes jawaban_benar and penjelasan to prevent cheating.
Column names are aliased to match TypeScript interface.
Use this view when mahasiswa is ATTEMPTING quiz.
Use original soal table when mahasiswa is VIEWING RESULTS.';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ View soal_mahasiswa created successfully!';
    RAISE NOTICE '✅ Column aliases applied to match TypeScript interface';
    RAISE NOTICE 'ℹ️  This view hides jawaban_benar during quiz attempt';
END $$;
