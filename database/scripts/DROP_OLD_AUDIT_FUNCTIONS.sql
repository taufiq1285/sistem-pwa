-- ============================================================================
-- DROP OLD AUDIT FUNCTIONS
-- ============================================================================
-- This will remove all old versions of audit functions
-- Run this FIRST, then run COMPLETE_AUDIT_FIX.sql
-- ============================================================================

-- List all existing log_audit_event functions before dropping
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'log_audit_event'
AND pronamespace = 'public'::regnamespace;

-- ============================================================================
-- DROP ALL OVERLOADS OF log_audit_event
-- ============================================================================

-- Drop all versions of log_audit_event (CASCADE will drop dependent triggers)
DROP FUNCTION IF EXISTS public.log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB, BOOLEAN, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_event CASCADE;

-- Drop old audit_trigger_function if exists
DROP FUNCTION IF EXISTS public.audit_trigger_function() CASCADE;

-- Drop old get_audit_trail if exists
DROP FUNCTION IF EXISTS public.get_audit_trail(TEXT, UUID) CASCADE;

-- Drop old get_resource_audit_trail if exists
DROP FUNCTION IF EXISTS public.get_resource_audit_trail(TEXT, UUID) CASCADE;

-- Drop old archive_old_audit_logs if exists
DROP FUNCTION IF EXISTS public.archive_old_audit_logs(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.archive_old_audit_logs() CASCADE;

-- Drop old log_sensitive_operation if exists
DROP FUNCTION IF EXISTS public.log_sensitive_operation(TEXT, JSONB) CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_func_count INTEGER;
BEGIN
    -- Check if any log_audit_event functions still exist
    SELECT COUNT(*) INTO v_func_count
    FROM pg_proc
    WHERE proname = 'log_audit_event'
    AND pronamespace = 'public'::regnamespace;

    RAISE NOTICE '
    ============================================================
    🗑️  OLD FUNCTIONS CLEANUP
    ============================================================
    ';

    IF v_func_count = 0 THEN
        RAISE NOTICE '✅ All old log_audit_event functions removed';
        RAISE NOTICE '';
        RAISE NOTICE 'Next Steps:';
        RAISE NOTICE '1. Now run COMPLETE_AUDIT_FIX.sql';
        RAISE NOTICE '2. This will create fresh, clean functions';
    ELSE
        RAISE NOTICE '⚠️  Still found % log_audit_event function(s)', v_func_count;
        RAISE NOTICE '   They may have different signatures';
    END IF;

    RAISE NOTICE '
    ============================================================
    ';
END $$;

-- List remaining functions (should be empty)
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%audit%'
AND pronamespace = 'public'::regnamespace
ORDER BY proname;
