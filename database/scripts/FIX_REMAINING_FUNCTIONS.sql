-- ============================================================================
-- FIX: Remaining Function Search Path Warnings
-- Run this script di Supabase SQL Editor
-- ============================================================================
-- This script forcefully drops ALL versions of problematic functions
-- and recreates them with proper search_path
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL OVERLOADED VERSIONS OF FUNCTIONS
-- ============================================================================

-- Drop ALL versions of create_user_profile (there are 2 versions)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'create_user_profile'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of cancel_jadwal_praktikum
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'cancel_jadwal_praktikum'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of get_jadwal_praktikum_mahasiswa
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_jadwal_praktikum_mahasiswa'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of safe_update_with_version
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'safe_update_with_version'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of log_conflict
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'log_conflict'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of suggest_kelas_for_semester
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'suggest_kelas_for_semester'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of get_resource_audit_trail
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_resource_audit_trail'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of get_failed_logins
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_failed_logins'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of calculate_final_grade
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'calculate_final_grade'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of validate_quiz_attempt
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'validate_quiz_attempt'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of increment_sync_attempt
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'increment_sync_attempt'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of review_sensitive_operation
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'review_sensitive_operation'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of archive_old_audit_logs
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'archive_old_audit_logs'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of log_audit_event
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'log_audit_event'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Drop ALL versions of log_sensitive_operation
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'log_sensitive_operation'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: RECREATE ALL FUNCTIONS WITH PROPER search_path
-- ============================================================================

-- create_user_profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_role TEXT,
    p_name TEXT,
    p_identifier TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    CASE p_role
        WHEN 'mahasiswa' THEN
            INSERT INTO public.mahasiswa (user_id, nama, nim)
            VALUES (p_user_id, p_name, p_identifier)
            RETURNING id INTO v_profile_id;
        WHEN 'dosen' THEN
            INSERT INTO public.dosen (user_id, nama, nip)
            VALUES (p_user_id, p_name, p_identifier)
            RETURNING id INTO v_profile_id;
        WHEN 'laboran' THEN
            INSERT INTO public.laboran (user_id, nama, nip)
            VALUES (p_user_id, p_name, p_identifier)
            RETURNING id INTO v_profile_id;
        ELSE
            RAISE EXCEPTION 'Invalid role: %', p_role;
    END CASE;
    RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- cancel_jadwal_praktikum
CREATE OR REPLACE FUNCTION public.cancel_jadwal_praktikum(p_jadwal_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.jadwal_praktikum
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = p_jadwal_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- get_jadwal_praktikum_mahasiswa
CREATE OR REPLACE FUNCTION public.get_jadwal_praktikum_mahasiswa(p_mahasiswa_id UUID)
RETURNS TABLE (
    jadwal_id UUID,
    tanggal DATE,
    waktu_mulai TIME,
    waktu_selesai TIME,
    ruangan TEXT,
    kelas_id UUID,
    kelas_nama TEXT,
    topik TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT jp.id, jp.tanggal, jp.waktu_mulai, jp.waktu_selesai, jp.ruangan, jp.kelas_id, k.nama, jp.topik
    FROM public.jadwal_praktikum jp
    JOIN public.kelas k ON k.id = jp.kelas_id
    JOIN public.kelas_mahasiswa km ON km.kelas_id = jp.kelas_id
    WHERE km.mahasiswa_id = p_mahasiswa_id
    AND km.is_active = TRUE
    AND jp.is_active = TRUE
    ORDER BY jp.tanggal, jp.waktu_mulai;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- safe_update_with_version
CREATE OR REPLACE FUNCTION public.safe_update_with_version(
    p_table_name TEXT,
    p_record_id UUID,
    p_data JSONB,
    p_client_version INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_server_version INTEGER;
BEGIN
    EXECUTE format('SELECT version FROM public.%I WHERE id = $1 FOR UPDATE', p_table_name)
    INTO v_server_version USING p_record_id;
    
    IF v_server_version > p_client_version THEN
        RETURN FALSE;
    END IF;
    
    EXECUTE format(
        'UPDATE public.%I SET version = version + 1, updated_at = NOW() WHERE id = $1',
        p_table_name
    ) USING p_record_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- log_conflict
CREATE OR REPLACE FUNCTION public.log_conflict(
    p_table_name TEXT,
    p_record_id UUID,
    p_client_data JSONB,
    p_server_data JSONB,
    p_resolution TEXT DEFAULT 'pending'
)
RETURNS UUID AS $$
DECLARE
    v_conflict_id UUID;
BEGIN
    INSERT INTO public.conflict_log (table_name, record_id, client_data, server_data, resolution, user_id)
    VALUES (p_table_name, p_record_id, p_client_data, p_server_data, p_resolution, (SELECT auth.uid()))
    RETURNING id INTO v_conflict_id;
    RETURN v_conflict_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- suggest_kelas_for_semester
CREATE OR REPLACE FUNCTION public.suggest_kelas_for_semester(p_semester TEXT)
RETURNS TABLE (
    kelas_id UUID,
    kelas_nama TEXT,
    mata_kuliah TEXT,
    dosen_nama TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT k.id, k.nama, mk.nama, d.nama
    FROM public.kelas k
    JOIN public.mata_kuliah mk ON mk.id = k.mata_kuliah_id
    JOIN public.dosen d ON d.id = k.dosen_id
    WHERE k.semester = p_semester
    AND k.is_active = TRUE
    ORDER BY mk.nama;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- get_resource_audit_trail
CREATE OR REPLACE FUNCTION public.get_resource_audit_trail(
    p_table_name TEXT,
    p_record_id UUID
)
RETURNS TABLE (
    id UUID,
    action TEXT,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT al.id, al.action, al.old_data, al.new_data, al.user_id, al.created_at
    FROM public.audit_log al
    WHERE al.table_name = p_table_name AND al.record_id = p_record_id
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- get_failed_logins
CREATE OR REPLACE FUNCTION public.get_failed_logins(p_email TEXT, p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 hour')
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.login_attempts
    WHERE email = p_email
    AND attempted_at > p_since
    AND success = FALSE;
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- calculate_final_grade
CREATE OR REPLACE FUNCTION public.calculate_final_grade(
    p_mahasiswa_id UUID,
    p_kelas_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    v_nilai RECORD;
    v_bobot RECORD;
    v_final NUMERIC;
BEGIN
    SELECT * INTO v_nilai FROM public.nilai
    WHERE mahasiswa_id = p_mahasiswa_id AND kelas_id = p_kelas_id;
    
    SELECT * INTO v_bobot FROM public.kelas
    WHERE id = p_kelas_id;
    
    v_final := (
        COALESCE(v_nilai.tugas, 0) * COALESCE(v_bobot.bobot_tugas, 25) / 100 +
        COALESCE(v_nilai.kuis, 0) * COALESCE(v_bobot.bobot_kuis, 25) / 100 +
        COALESCE(v_nilai.uts, 0) * COALESCE(v_bobot.bobot_uts, 25) / 100 +
        COALESCE(v_nilai.uas, 0) * COALESCE(v_bobot.bobot_uas, 25) / 100
    );
    
    RETURN ROUND(v_final, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- validate_quiz_attempt
CREATE OR REPLACE FUNCTION public.validate_quiz_attempt(p_kuis_id UUID, p_mahasiswa_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_attempt_count INTEGER;
    v_max_attempts INTEGER;
    v_is_active BOOLEAN;
BEGIN
    SELECT is_active, max_attempts INTO v_is_active, v_max_attempts
    FROM public.kuis WHERE id = p_kuis_id;
    
    IF NOT v_is_active THEN
        RETURN FALSE;
    END IF;
    
    SELECT COUNT(*) INTO v_attempt_count
    FROM public.attempt_kuis
    WHERE kuis_id = p_kuis_id AND mahasiswa_id = p_mahasiswa_id;
    
    RETURN v_attempt_count < COALESCE(v_max_attempts, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- increment_sync_attempt
CREATE OR REPLACE FUNCTION public.increment_sync_attempt(p_record_id UUID, p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.sync_queue
    SET attempt_count = COALESCE(attempt_count, 0) + 1,
        last_attempt_at = NOW()
    WHERE record_id = p_record_id AND table_name = p_table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- review_sensitive_operation
CREATE OR REPLACE FUNCTION public.review_sensitive_operation(
    p_log_id UUID,
    p_status TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.sensitive_operations_log
    SET status = p_status,
        reviewed_by = (SELECT auth.uid()),
        reviewed_at = NOW(),
        review_notes = p_notes
    WHERE id = p_log_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- archive_old_audit_logs
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs(p_days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.audit_log
        WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- log_audit_event
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (p_table_name, p_record_id, p_action, p_old_data, p_new_data, (SELECT auth.uid()))
    RETURNING id INTO v_audit_id;
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- log_sensitive_operation
CREATE OR REPLACE FUNCTION public.log_sensitive_operation(
    p_operation TEXT,
    p_details JSONB
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.sensitive_operations_log (operation, details, user_id)
    VALUES (p_operation, p_details, (SELECT auth.uid()))
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- STEP 3: VERIFY - Check all functions now have search_path
-- ============================================================================

SELECT 
    proname as function_name,
    CASE 
        WHEN proconfig::TEXT LIKE '%search_path%' 
        THEN '✅ Has search_path'
        ELSE '⚠️ Missing search_path'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN (
    'create_user_profile', 'cancel_jadwal_praktikum', 'get_jadwal_praktikum_mahasiswa',
    'safe_update_with_version', 'log_conflict', 'suggest_kelas_for_semester',
    'get_resource_audit_trail', 'get_failed_logins', 'calculate_final_grade',
    'validate_quiz_attempt', 'increment_sync_attempt', 'review_sensitive_operation',
    'archive_old_audit_logs', 'log_audit_event', 'log_sensitive_operation'
)
ORDER BY proname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ All remaining functions fixed!';
    RAISE NOTICE '✅ Old function versions dropped';
    RAISE NOTICE '✅ New functions created with SET search_path = public';
    RAISE NOTICE '';
    RAISE NOTICE '📝 For auth_leaked_password_protection:';
    RAISE NOTICE '   Go to Supabase Dashboard > Authentication > Settings';
    RAISE NOTICE '   Enable "Leaked Password Protection"';
END $$;
