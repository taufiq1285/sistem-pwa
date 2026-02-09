-- ============================================================================
-- CREATE SOAL_MAHASISWA VIEW - FINAL VERSION
-- ============================================================================
-- Berdasarkan struktur database yang sebenarnya:
-- - Database: tipe, pilihan_jawaban, pembahasan
-- - TypeScript: tipe_soal, opsi_jawaban, penjelasan
-- Strategy: Use aliases to match TypeScript interface
-- ============================================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS soal_mahasiswa CASCADE;

-- Create secure view with aliased columns
CREATE VIEW soal_mahasiswa AS
SELECT
  id,
  kuis_id,
  pertanyaan,
  -- Alias to match TypeScript interface
  tipe as tipe_soal,
  poin,
  urutan,
  pilihan_jawaban as opsi_jawaban,
  -- ✅ HIDE jawaban_benar (security)
  NULL::TEXT as jawaban_benar,
  -- Include rubrik_penilaian (not sensitive)
  rubrik_penilaian,
  -- ✅ HIDE pembahasan (only show after submit)
  NULL::TEXT as penjelasan,
  media_url,
  created_at,
  updated_at
FROM soal;

-- Grant access to authenticated users
GRANT SELECT ON soal_mahasiswa TO authenticated;

-- Add comment
COMMENT ON VIEW soal_mahasiswa IS
'Secure view for mahasiswa during quiz attempt.
Hides: jawaban_benar, pembahasan.
Aliases: tipe→tipe_soal, pilihan_jawaban→opsi_jawaban, pembahasan→penjelasan.
Use this when ATTEMPTING quiz.
Use soal table when VIEWING RESULTS.';

-- ============================================================================
-- VERIFY
-- ============================================================================

-- Check view was created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'soal_mahasiswa') THEN
        RAISE NOTICE '✅ View soal_mahasiswa created successfully!';
    ELSE
        RAISE EXCEPTION '❌ Failed to create view soal_mahasiswa';
    END IF;
END $$;

-- Show columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'soal_mahasiswa'
ORDER BY ordinal_position;
