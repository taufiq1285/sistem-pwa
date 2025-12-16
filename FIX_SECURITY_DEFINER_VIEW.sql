-- ============================================================================
-- FIX: Security Definer View Warning untuk soal_mahasiswa
-- Run this script di Supabase SQL Editor
-- ============================================================================
-- Issue: View `soal_mahasiswa` defined with SECURITY DEFINER
-- Solution: Recreate view with SECURITY INVOKER (default, explicit)
-- ============================================================================

-- Drop existing view
DROP VIEW IF EXISTS soal_mahasiswa CASCADE;

-- Recreate view WITH SECURITY INVOKER (uses caller's permissions)
CREATE VIEW soal_mahasiswa 
WITH (security_invoker = true)
AS
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
Use soal table when VIEWING RESULTS.
Note: Uses SECURITY INVOKER (caller permissions).';

-- ============================================================================
-- VERIFY
-- ============================================================================

-- Check view security setting
SELECT 
    schemaname,
    viewname,
    viewowner,
    CASE 
        WHEN definition LIKE '%security_invoker%' THEN '✅ SECURITY INVOKER'
        ELSE '⚠️ Check manually'
    END as security_mode
FROM pg_views 
WHERE viewname = 'soal_mahasiswa';

-- Verify columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'soal_mahasiswa'
ORDER BY ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ View soal_mahasiswa recreated with SECURITY INVOKER!';
    RAISE NOTICE '✅ Security warning should be resolved';
    RAISE NOTICE '📝 Refresh Supabase Performance Advisor to verify';
END $$;
