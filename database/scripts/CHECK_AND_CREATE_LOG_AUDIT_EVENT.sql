-- ============================================================================
-- CHECK AND CREATE LOG_AUDIT_EVENT FUNCTION
-- ============================================================================
-- Problem: log_audit_event function does not exist
-- Solution: Create the function from migration 22_audit_logging_system.sql
-- ============================================================================

-- First, let's check what log_audit_event functions exist
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    pronargs as param_count
FROM pg_proc
WHERE proname = 'log_audit_event'
AND pronamespace = 'public'::regnamespace;

-- ============================================================================
-- CREATE THE CORRECT LOG_AUDIT_EVENT FUNCTION
-- ============================================================================

/**
 * Main audit logging function
 * Call this to log any security-relevant event
 */
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_func_count INTEGER;
BEGIN
    -- Check if function exists now
    SELECT COUNT(*) INTO v_func_count
    FROM pg_proc
    WHERE proname = 'log_audit_event'
    AND pronamespace = 'public'::regnamespace;

    IF v_func_count > 0 THEN
        RAISE NOTICE '✅ Function log_audit_event exists';
        RAISE NOTICE '   Found % overload(s)', v_func_count;
    ELSE
        RAISE NOTICE '❌ Function log_audit_event does NOT exist';
    END IF;

    -- Check audit_logs table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
    ) THEN
        RAISE NOTICE '✅ Table audit_logs exists';
    ELSE
        RAISE NOTICE '❌ Table audit_logs does NOT exist - CREATE IT FIRST!';
    END IF;
END $$;

-- ============================================================================
-- TEST THE FUNCTION (Optional - commented out)
-- ============================================================================

-- Uncomment to test
-- DO $$
-- DECLARE
--     test_id UUID;
-- BEGIN
--     test_id := public.log_audit_event(
--         'test',
--         'test_table',
--         gen_random_uuid(),
--         NULL,
--         NULL,
--         TRUE,
--         NULL,
--         '{}'::JSONB
--     );
--
--     RAISE NOTICE 'Test successful! Audit ID: %', test_id;
--
--     -- Cleanup
--     DELETE FROM public.audit_logs WHERE id = test_id;
-- END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '
    ============================================================
    ✅ LOG_AUDIT_EVENT FUNCTION CREATED
    ============================================================

    Function Signature:
    log_audit_event(
        p_action TEXT,
        p_resource_type TEXT,
        p_resource_id UUID DEFAULT NULL,
        p_old_values JSONB DEFAULT NULL,
        p_new_values JSONB DEFAULT NULL,
        p_success BOOLEAN DEFAULT TRUE,
        p_error_message TEXT DEFAULT NULL,
        p_metadata JSONB DEFAULT ''{}''::JSONB
    ) RETURNS UUID

    This function is used by:
    - audit_trigger_function (for automatic audit logging)
    - Manual audit logging in application code

    Next Steps:
    1. Verify the function exists (check above)
    2. Refresh browser
    3. Test "Sudah Kembali" button again

    ============================================================
    ';
END $$;
