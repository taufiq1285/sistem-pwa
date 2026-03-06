-- ============================================================================
-- FIX: Supabase lint 0010 - security_definer_view
-- Target:
--   1) public.soal_mahasiswa
--   2) public.v_dosen_grading_access
--   3) public.v_available_kelas
--   4) public.v_kelas_assignments
--
-- Tujuan: mengubah view menjadi SECURITY INVOKER tanpa drop/recreate view,
-- sehingga alur existing paling aman (minim risiko perubahan struktur).
-- ============================================================================

BEGIN;

-- Set SECURITY INVOKER jika view ada
DO $$
BEGIN
  IF to_regclass('public.soal_mahasiswa') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.soal_mahasiswa SET (security_invoker = true)';
  END IF;

  IF to_regclass('public.v_dosen_grading_access') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.v_dosen_grading_access SET (security_invoker = true)';
  END IF;

  IF to_regclass('public.v_available_kelas') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.v_available_kelas SET (security_invoker = true)';
  END IF;

  IF to_regclass('public.v_kelas_assignments') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.v_kelas_assignments SET (security_invoker = true)';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFIKASI HASIL
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  c.relname AS view_name,
  CASE
    WHEN c.reloptions::text ILIKE '%security_invoker=true%'
      THEN 'SECURITY INVOKER'
    ELSE 'CHECK MANUAL'
  END AS security_mode,
  c.reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND c.relname IN (
    'soal_mahasiswa',
    'v_dosen_grading_access',
    'v_available_kelas',
    'v_kelas_assignments'
  )
ORDER BY c.relname;

-- Opsional: cek ulang linter Supabase setelah script dijalankan.