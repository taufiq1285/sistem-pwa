-- ============================================================================
-- FIX: Security Advisor Warnings - Function Search Path & Extensions
-- Run this script di Supabase SQL Editor
-- ============================================================================
-- Issues Fixed:
-- 1. function_search_path_mutable - Add SET search_path = public
-- 2. extension_in_public - Move pg_trgm to extensions schema
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE EXTENSIONS SCHEMA (if not exists)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- STEP 2: MOVE pg_trgm EXTENSION TO extensions SCHEMA
-- ============================================================================

-- Drop and recreate in extensions schema
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- ============================================================================
-- STEP 3: FIX FUNCTION SEARCH PATH - Core Helper Functions
-- ============================================================================

-- get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.users
    WHERE id = (SELECT auth.uid());
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(public.get_user_role() = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- is_dosen
CREATE OR REPLACE FUNCTION public.is_dosen()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(public.get_user_role() = 'dosen', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- is_laboran
CREATE OR REPLACE FUNCTION public.is_laboran()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(public.get_user_role() = 'laboran', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- is_mahasiswa
CREATE OR REPLACE FUNCTION public.is_mahasiswa()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(public.get_user_role() = 'mahasiswa', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- get_dosen_id
CREATE OR REPLACE FUNCTION public.get_dosen_id()
RETURNS UUID AS $$
DECLARE
    v_dosen_id UUID;
BEGIN
    SELECT id INTO v_dosen_id
    FROM public.dosen
    WHERE user_id = (SELECT auth.uid());
    RETURN v_dosen_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- get_current_dosen_id
CREATE OR REPLACE FUNCTION public.get_current_dosen_id()
RETURNS UUID AS $$
DECLARE
    v_dosen_id UUID;
BEGIN
    SELECT id INTO v_dosen_id
    FROM public.dosen
    WHERE user_id = (SELECT auth.uid());
    RETURN v_dosen_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- get_current_mahasiswa_id
CREATE OR REPLACE FUNCTION public.get_current_mahasiswa_id()
RETURNS UUID AS $$
DECLARE
    v_mahasiswa_id UUID;
BEGIN
    SELECT id INTO v_mahasiswa_id
    FROM public.mahasiswa
    WHERE user_id = (SELECT auth.uid());
    RETURN v_mahasiswa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- get_current_laboran_id
CREATE OR REPLACE FUNCTION public.get_current_laboran_id()
RETURNS UUID AS $$
DECLARE
    v_laboran_id UUID;
BEGIN
    SELECT id INTO v_laboran_id
    FROM public.laboran
    WHERE user_id = (SELECT auth.uid());
    RETURN v_laboran_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- get_mahasiswa_kelas_ids
CREATE OR REPLACE FUNCTION public.get_mahasiswa_kelas_ids()
RETURNS UUID[] AS $$
DECLARE
    kelas_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(kelas_id)
    INTO kelas_ids
    FROM public.kelas_mahasiswa
    WHERE mahasiswa_id = (SELECT public.get_current_mahasiswa_id())
    AND is_active = TRUE;
    RETURN COALESCE(kelas_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- get_dosen_kelas_ids
CREATE OR REPLACE FUNCTION public.get_dosen_kelas_ids()
RETURNS UUID[] AS $$
DECLARE
    kelas_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(id)
    INTO kelas_ids
    FROM public.kelas
    WHERE dosen_id = (SELECT public.get_current_dosen_id());
    RETURN COALESCE(kelas_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- ============================================================================
-- STEP 4: FIX FUNCTION SEARCH PATH - Validation & Helper Functions
-- ============================================================================

-- mahasiswa_in_kelas (drop first to change parameter name)
DROP FUNCTION IF EXISTS public.mahasiswa_in_kelas(UUID);
CREATE OR REPLACE FUNCTION public.mahasiswa_in_kelas(p_kelas_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_enrolled BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.kelas_mahasiswa
        WHERE kelas_id = p_kelas_id
        AND mahasiswa_id = (SELECT public.get_current_mahasiswa_id())
        AND is_active = TRUE
    ) INTO is_enrolled;
    RETURN COALESCE(is_enrolled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- dosen_teaches_kelas (drop first to change parameter name)
DROP FUNCTION IF EXISTS public.dosen_teaches_kelas(UUID);
CREATE OR REPLACE FUNCTION public.dosen_teaches_kelas(p_kelas_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_teacher BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.kelas
        WHERE id = p_kelas_id
        AND dosen_id = (SELECT public.get_current_dosen_id())
    ) INTO is_teacher;
    RETURN COALESCE(is_teacher, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- dosen_teaches_mahasiswa (drop first to change parameter name)
DROP FUNCTION IF EXISTS public.dosen_teaches_mahasiswa(UUID);
CREATE OR REPLACE FUNCTION public.dosen_teaches_mahasiswa(p_mahasiswa_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_teacher BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.kelas k
        INNER JOIN public.kelas_mahasiswa km ON k.id = km.kelas_id
        WHERE k.dosen_id = (SELECT public.get_current_dosen_id())
        AND km.mahasiswa_id = p_mahasiswa_id
        AND km.is_active = TRUE
    ) INTO is_teacher;
    RETURN COALESCE(is_teacher, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- ============================================================================
-- STEP 5: FIX FUNCTION SEARCH PATH - Trigger Functions
-- ============================================================================

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- update_permintaan_perbaikan_nilai_updated_at
CREATE OR REPLACE FUNCTION public.update_permintaan_perbaikan_nilai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================================
-- STEP 6: FIX FUNCTION SEARCH PATH - Business Logic Functions
-- ============================================================================

-- increment_version
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version IS NULL THEN
        NEW.version := 1;
    ELSE
        NEW.version := NEW.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- increment_bank_soal_usage (drop first to change parameter name)
DROP FUNCTION IF EXISTS public.increment_bank_soal_usage(UUID);
CREATE OR REPLACE FUNCTION public.increment_bank_soal_usage(p_bank_soal_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.bank_soal
    SET usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = p_bank_soal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- increment_sync_attempt (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.increment_sync_attempt(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.increment_sync_attempt(p_record_id UUID, p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Implementation depends on your sync_queue table structure
    UPDATE public.sync_queue
    SET attempt_count = COALESCE(attempt_count, 0) + 1,
        last_attempt_at = NOW()
    WHERE record_id = p_record_id AND table_name = p_table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- validate_bobot_nilai
CREATE OR REPLACE FUNCTION public.validate_bobot_nilai()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bobot_tugas + NEW.bobot_kuis + NEW.bobot_uts + NEW.bobot_uas != 100 THEN
        RAISE EXCEPTION 'Total bobot nilai harus 100%%';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================================
-- STEP 7: FIX FUNCTION SEARCH PATH - Audit Functions
-- ============================================================================

-- audit_trigger_function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        user_id,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        (SELECT auth.uid()),
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- log_audit_event (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB);
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
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (p_table_name, p_record_id, p_action, p_old_data, p_new_data, (SELECT auth.uid()))
    RETURNING id INTO v_audit_id;
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- get_resource_audit_trail (drop first to change return type)
DROP FUNCTION IF EXISTS public.get_resource_audit_trail(TEXT, UUID);
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
    FROM public.audit_logs al
    WHERE al.table_name = p_table_name AND al.record_id = p_record_id
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- archive_old_audit_logs (drop first to change parameter name)
DROP FUNCTION IF EXISTS public.archive_old_audit_logs(INTEGER);
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs(p_days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.audit_logs
        WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- log_sensitive_operation (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.log_sensitive_operation(TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.log_sensitive_operation(
    p_operation TEXT,
    p_details JSONB
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.sensitive_operations (operation, details, user_id)
    VALUES (p_operation, p_details, (SELECT auth.uid()))
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- review_sensitive_operation (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.review_sensitive_operation(UUID, TEXT, TEXT);
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

-- ============================================================================
-- STEP 8: FIX FUNCTION SEARCH PATH - User Management Functions
-- ============================================================================

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'mahasiswa'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- create_user_profile (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT);
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

-- get_failed_logins (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.get_failed_logins(TEXT, TIMESTAMPTZ);
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

-- ============================================================================
-- STEP 9: FIX FUNCTION SEARCH PATH - Normalization Functions
-- ============================================================================

-- normalize_users_data
CREATE OR REPLACE FUNCTION public.normalize_users_data()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email = LOWER(TRIM(NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- normalize_mahasiswa_data
CREATE OR REPLACE FUNCTION public.normalize_mahasiswa_data()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nama = TRIM(NEW.nama);
    NEW.nim = UPPER(TRIM(NEW.nim));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- normalize_dosen_data
CREATE OR REPLACE FUNCTION public.normalize_dosen_data()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nama = TRIM(NEW.nama);
    NEW.nip = UPPER(TRIM(NEW.nip));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- normalize_kelas_data
CREATE OR REPLACE FUNCTION public.normalize_kelas_data()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nama = TRIM(NEW.nama);
    NEW.kode = UPPER(TRIM(NEW.kode));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- normalize_mata_kuliah_data
CREATE OR REPLACE FUNCTION public.normalize_mata_kuliah_data()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nama = TRIM(NEW.nama);
    NEW.kode = UPPER(TRIM(NEW.kode));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================================
-- STEP 10: FIX FUNCTION SEARCH PATH - Quiz & Grade Functions
-- ============================================================================

-- validate_quiz_attempt (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.validate_quiz_attempt(UUID, UUID);
CREATE OR REPLACE FUNCTION public.validate_quiz_attempt(p_kuis_id UUID, p_mahasiswa_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_attempt_count INTEGER;
    v_max_attempts INTEGER;
    v_is_active BOOLEAN;
BEGIN
    -- Check if quiz is active
    SELECT is_active, max_attempts INTO v_is_active, v_max_attempts
    FROM public.kuis WHERE id = p_kuis_id;
    
    IF NOT v_is_active THEN
        RETURN FALSE;
    END IF;
    
    -- Check attempt count
    SELECT COUNT(*) INTO v_attempt_count
    FROM public.attempt_kuis
    WHERE kuis_id = p_kuis_id AND mahasiswa_id = p_mahasiswa_id;
    
    RETURN v_attempt_count < COALESCE(v_max_attempts, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- calculate_final_grade (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.calculate_final_grade(UUID, UUID);
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

-- get_active_kuis_for_mahasiswa (drop first to change return type)
DROP FUNCTION IF EXISTS public.get_active_kuis_for_mahasiswa(UUID);
CREATE OR REPLACE FUNCTION public.get_active_kuis_for_mahasiswa(p_mahasiswa_id UUID)
RETURNS TABLE (
    kuis_id UUID,
    judul TEXT,
    deskripsi TEXT,
    waktu_mulai TIMESTAMPTZ,
    waktu_selesai TIMESTAMPTZ,
    durasi_menit INTEGER,
    kelas_id UUID,
    kelas_nama TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT k.id, k.judul, k.deskripsi, k.waktu_mulai, k.waktu_selesai, k.durasi_menit, k.kelas_id, kl.nama
    FROM public.kuis k
    JOIN public.kelas kl ON kl.id = k.kelas_id
    JOIN public.kelas_mahasiswa km ON km.kelas_id = k.kelas_id
    WHERE km.mahasiswa_id = p_mahasiswa_id
    AND km.is_active = TRUE
    AND k.is_active = TRUE
    AND k.status = 'published'
    AND NOW() BETWEEN k.waktu_mulai AND k.waktu_selesai;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- get_quiz_attempt_details (drop first to change return type)
DROP FUNCTION IF EXISTS public.get_quiz_attempt_details(UUID);
CREATE OR REPLACE FUNCTION public.get_quiz_attempt_details(p_attempt_id UUID)
RETURNS TABLE (
    attempt_id UUID,
    kuis_id UUID,
    mahasiswa_id UUID,
    status TEXT,
    score NUMERIC,
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.kuis_id, a.mahasiswa_id, a.status, a.score, a.started_at, a.submitted_at
    FROM public.attempt_kuis a
    WHERE a.id = p_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- ============================================================================
-- STEP 11: FIX FUNCTION SEARCH PATH - Jadwal Functions
-- ============================================================================

-- cancel_jadwal_praktikum (drop first to change parameter name)
DROP FUNCTION IF EXISTS public.cancel_jadwal_praktikum(UUID);
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

-- reactivate_jadwal_praktikum (drop first to change parameter name)
DROP FUNCTION IF EXISTS public.reactivate_jadwal_praktikum(UUID);
CREATE OR REPLACE FUNCTION public.reactivate_jadwal_praktikum(p_jadwal_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.jadwal_praktikum
    SET is_active = TRUE, updated_at = NOW()
    WHERE id = p_jadwal_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- get_jadwal_praktikum_mahasiswa (drop first to change return type)
DROP FUNCTION IF EXISTS public.get_jadwal_praktikum_mahasiswa(UUID);
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

-- suggest_kelas_for_semester (drop first to change return type)
DROP FUNCTION IF EXISTS public.suggest_kelas_for_semester(TEXT);
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

-- track_semester_saat_enroll
CREATE OR REPLACE FUNCTION public.track_semester_saat_enroll()
RETURNS TRIGGER AS $$
BEGIN
    SELECT semester INTO NEW.semester_saat_enroll
    FROM public.kelas WHERE id = NEW.kelas_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================================
-- STEP 12: FIX FUNCTION SEARCH PATH - Conflict & Version Functions
-- ============================================================================

-- check_version_conflict (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.check_version_conflict(TEXT, UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.check_version_conflict(
    p_table_name TEXT,
    p_record_id UUID,
    p_client_version INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_server_version INTEGER;
BEGIN
    EXECUTE format('SELECT version FROM public.%I WHERE id = $1', p_table_name)
    INTO v_server_version USING p_record_id;
    RETURN v_server_version > p_client_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- log_conflict (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.log_conflict(TEXT, UUID, JSONB, JSONB, TEXT);
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

-- safe_update_with_version (drop first to change parameter names)
DROP FUNCTION IF EXISTS public.safe_update_with_version(TEXT, UUID, JSONB, INTEGER);
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
    -- Check version conflict
    EXECUTE format('SELECT version FROM public.%I WHERE id = $1 FOR UPDATE', p_table_name)
    INTO v_server_version USING p_record_id;
    
    IF v_server_version > p_client_version THEN
        RETURN FALSE;
    END IF;
    
    -- Update with incremented version
    EXECUTE format(
        'UPDATE public.%I SET version = version + 1, updated_at = NOW() WHERE id = $1',
        p_table_name
    ) USING p_record_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- STEP 13: FIX FUNCTION SEARCH PATH - Inventory & File Functions
-- ============================================================================

-- update_inventory_availability
CREATE OR REPLACE FUNCTION public.update_inventory_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE public.inventory
        SET available_quantity = available_quantity - NEW.quantity
        WHERE id = NEW.inventory_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'returned' AND NEW.status = 'returned' THEN
        UPDATE public.inventory
        SET available_quantity = available_quantity + NEW.quantity
        WHERE id = NEW.inventory_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- can_access_materi_file (drop first to change parameter name)
DROP FUNCTION IF EXISTS public.can_access_materi_file(TEXT);
CREATE OR REPLACE FUNCTION public.can_access_materi_file(p_file_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_materi_id UUID;
    v_kelas_id UUID;
BEGIN
    -- Extract materi_id from file path
    SELECT id, kelas_id INTO v_materi_id, v_kelas_id
    FROM public.materi
    WHERE file_url LIKE '%' || p_file_path || '%';
    
    IF v_materi_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check access
    RETURN (SELECT public.is_admin()) OR
           (SELECT public.is_laboran()) OR
           (SELECT public.dosen_teaches_kelas(v_kelas_id)) OR
           (SELECT public.mahasiswa_in_kelas(v_kelas_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- ============================================================================
-- STEP 14: FIX FUNCTION SEARCH PATH - Approval Functions
-- ============================================================================

-- auto_update_nilai_on_approval
CREATE OR REPLACE FUNCTION public.auto_update_nilai_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        UPDATE public.nilai
        SET 
            tugas = COALESCE(NEW.nilai_tugas_baru, tugas),
            kuis = COALESCE(NEW.nilai_kuis_baru, kuis),
            uts = COALESCE(NEW.nilai_uts_baru, uts),
            uas = COALESCE(NEW.nilai_uas_baru, uas),
            updated_at = NOW()
        WHERE mahasiswa_id = NEW.mahasiswa_id AND kelas_id = NEW.kelas_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- STEP 15: VERIFY - Check functions with search_path
-- ============================================================================

SELECT 
    proname as function_name,
    CASE 
        WHEN prosrc LIKE '%search_path%' OR proconfig::TEXT LIKE '%search_path%' 
        THEN '✅ Has search_path'
        ELSE '⚠️ Missing search_path'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN (
    'get_user_role', 'is_admin', 'is_dosen', 'is_laboran', 'is_mahasiswa',
    'get_dosen_id', 'get_current_mahasiswa_id', 'get_mahasiswa_kelas_ids',
    'update_updated_at_column', 'handle_new_user'
)
ORDER BY proname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Security fixes applied!';
    RAISE NOTICE '✅ All functions now have SET search_path = public';
    RAISE NOTICE '✅ pg_trgm moved to extensions schema';
    RAISE NOTICE '📝 For auth_leaked_password_protection: Enable in Supabase Dashboard > Authentication > Settings';
END $$;
