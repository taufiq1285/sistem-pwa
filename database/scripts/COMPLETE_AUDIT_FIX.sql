-- ============================================================================
-- COMPLETE AUDIT SYSTEM FIX
-- ============================================================================
-- This SQL creates everything needed for the audit system to work
-- Run this ONCE in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE AUDIT_LOGS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User information
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'dosen', 'laboran', 'mahasiswa', 'system')),
    user_email TEXT,
    user_name TEXT,

    -- Action details
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    resource_description TEXT,

    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changes JSONB,

    -- Context information
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method TEXT,

    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    error_code TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Create indexes if table was just created
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

COMMENT ON TABLE public.audit_logs IS
'Audit trail system - tracks all security-relevant events';

-- ============================================================================
-- 2. CREATE LOG_AUDIT_EVENT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_user_role TEXT;
    v_user_email TEXT;
    v_user_name TEXT;
    v_changes JSONB;
BEGIN
    -- Get current user info
    SELECT role, email, full_name
    INTO v_user_role, v_user_email, v_user_name
    FROM public.users
    WHERE id = auth.uid();

    -- If no user found, use 'system'
    v_user_role := COALESCE(v_user_role, 'system');

    -- Calculate changes (diff between old and new)
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        v_changes := jsonb_build_object(
            'old', p_old_values,
            'new', p_new_values
        );
    END IF;

    -- Insert audit log
    INSERT INTO public.audit_logs (
        user_id,
        user_role,
        user_email,
        user_name,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        changes,
        success,
        error_message,
        metadata
    ) VALUES (
        auth.uid(),
        v_user_role,
        v_user_email,
        v_user_name,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        v_changes,
        p_success,
        p_error_message,
        p_metadata
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION public.log_audit_event IS
'Main audit logging function - logs events to audit_logs table';

GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

-- ============================================================================
-- 3. CREATE AUDIT_TRIGGER_FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
    v_audit_id UUID;
BEGIN
    -- Determine action
    v_action := LOWER(TG_OP);

    -- Get old/new values
    IF TG_OP = 'DELETE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_old_values := NULL;
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    END IF;

    -- Call log_audit_event with explicit type casts
    v_audit_id := public.log_audit_event(
        v_action,
        TG_TABLE_NAME::TEXT,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        v_old_values,
        v_new_values,
        TRUE,
        NULL::TEXT,
        jsonb_build_object('triggered_by', 'audit_trigger_function')
    );

    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION public.audit_trigger_function IS
'Audit trigger function - automatically logs table changes';

-- ============================================================================
-- 4. CREATE TRIGGER ON PEMINJAMAN TABLE
-- ============================================================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS audit_peminjaman_changes ON public.peminjaman;

-- Create trigger
CREATE TRIGGER audit_peminjaman_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.peminjaman
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

COMMENT ON TRIGGER audit_peminjaman_changes ON public.peminjaman IS
'Audit trigger for peminjaman table';

-- ============================================================================
-- 5. ENABLE RLS ON AUDIT_LOGS (Optional - for security)
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON public.audit_logs;

-- Only admin can view audit logs
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- System can insert audit logs (for triggers)
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
    FOR INSERT
    WITH CHECK (TRUE);

-- ============================================================================
-- 6. VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_func_exists BOOLEAN;
    v_trigger_exists BOOLEAN;
BEGIN
    -- Check table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
    ) INTO v_table_exists;

    -- Check function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'log_audit_event'
        AND pronamespace = 'public'::regnamespace
    ) INTO v_func_exists;

    -- Check trigger
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'audit_peminjaman_changes'
        AND event_object_table = 'peminjaman'
    ) INTO v_trigger_exists;

    RAISE NOTICE '
    ============================================================
    📊 AUDIT SYSTEM VERIFICATION
    ============================================================
    ';

    IF v_table_exists THEN
        RAISE NOTICE '✅ Table audit_logs exists';
    ELSE
        RAISE NOTICE '❌ Table audit_logs MISSING';
    END IF;

    IF v_func_exists THEN
        RAISE NOTICE '✅ Function log_audit_event exists';
    ELSE
        RAISE NOTICE '❌ Function log_audit_event MISSING';
    END IF;

    IF v_trigger_exists THEN
        RAISE NOTICE '✅ Trigger audit_peminjaman_changes exists';
    ELSE
        RAISE NOTICE '❌ Trigger audit_peminjaman_changes MISSING';
    END IF;

    RAISE NOTICE '
    ============================================================
    ';

    IF v_table_exists AND v_func_exists AND v_trigger_exists THEN
        RAISE NOTICE '🎉 ALL COMPONENTS READY!';
        RAISE NOTICE '';
        RAISE NOTICE 'Next Steps:';
        RAISE NOTICE '1. Refresh browser (Ctrl+Shift+R)';
        RAISE NOTICE '2. Test "Sudah Kembali" button';
        RAISE NOTICE '3. Error should be GONE! ✨';
    ELSE
        RAISE NOTICE '⚠️  SOME COMPONENTS MISSING - Check errors above';
    END IF;

    RAISE NOTICE '
    ============================================================
    ';
END $$;

-- ============================================================================
-- 7. TEST THE SYSTEM (Optional - Uncomment to test)
-- ============================================================================

-- DO $$
-- DECLARE
--     test_id UUID;
-- BEGIN
--     RAISE NOTICE 'Testing audit system...';
--
--     test_id := public.log_audit_event(
--         'test',
--         'test_table',
--         gen_random_uuid(),
--         '{"before": "value"}'::jsonb,
--         '{"after": "value"}'::jsonb,
--         TRUE,
--         NULL,
--         '{"test": true}'::jsonb
--     );
--
--     RAISE NOTICE '✅ Test successful! Audit ID: %', test_id;
--
--     -- Cleanup
--     DELETE FROM public.audit_logs WHERE id = test_id;
--     RAISE NOTICE '✅ Test cleanup complete';
-- END $$;
