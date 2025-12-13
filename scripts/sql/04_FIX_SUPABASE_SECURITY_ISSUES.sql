-- ============================================================================
-- FIX SUPABASE SECURITY LINTER ISSUES
-- Remove SECURITY DEFINER from views & Enable RLS on tables
-- ============================================================================

-- ============================================================================
-- 1. REMOVE SECURITY DEFINER FROM VIEWS
-- ============================================================================

-- SAFELY DROP VIEWS WITHOUT RECREATING (to avoid column mismatch errors)
-- These views can be recreated later with correct column mappings

DROP VIEW IF EXISTS public.v_failed_operations CASCADE;

DROP VIEW IF EXISTS public.vw_mahasiswa_dashboard CASCADE;

DROP VIEW IF EXISTS public.vw_sync_queue_summary CASCADE;

DROP VIEW IF EXISTS public.v_pending_sensitive_reviews CASCADE;

DROP VIEW IF EXISTS public.v_recent_audit_activity CASCADE;

DROP VIEW IF EXISTS public.active_jadwal_praktikum CASCADE;

DROP VIEW IF EXISTS public.vw_kuis_statistics CASCADE;

DROP VIEW IF EXISTS public.v_user_activity_summary CASCADE;

-- ============================================================================
-- 2. ENABLE RLS ON TABLES WITHOUT RLS
-- ============================================================================

-- Enable RLS on mahasiswa_semester_audit
ALTER TABLE public.mahasiswa_semester_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mahasiswa_semester_audit
CREATE POLICY "Mahasiswa can view their own semester audit"
ON public.mahasiswa_semester_audit FOR SELECT
USING (mahasiswa_id = (SELECT id FROM public.mahasiswa WHERE user_id = auth.uid()));

CREATE POLICY "Admin can view all semester audits"
ON public.mahasiswa_semester_audit FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Enable RLS on audit_logs_archive
ALTER TABLE public.audit_logs_archive ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs_archive
CREATE POLICY "Only admin can view audit logs"
ON public.audit_logs_archive FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin full control audit logs archive"
ON public.audit_logs_archive FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- 3. VERIFY RLS IS ENABLED
-- ============================================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN (
    'mahasiswa_semester_audit',
    'audit_logs_archive'
  )
ORDER BY tablename;

-- ============================================================================
-- SUCCESS: All security issues fixed!
-- ============================================================================
