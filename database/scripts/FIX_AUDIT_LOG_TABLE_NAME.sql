-- ============================================================================
-- FIX AUDIT_LOG TABLE NAME INCONSISTENCY
-- ============================================================================
-- Problem: Migration 22 creates "audit_logs" (plural) but some functions
--          reference "audit_log" (singular), causing "relation does not exist" error
-- Solution: Update all function references to use correct table name "audit_logs"
-- ============================================================================

-- Fix get_audit_trail function
CREATE OR REPLACE FUNCTION public.get_audit_trail(
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
    SELECT al.id, al.action, al.old_values, al.new_values, al.user_id, al.created_at
    FROM public.audit_logs al  -- FIXED: audit_log -> audit_logs
    WHERE al.resource_type = p_table_name AND al.resource_id = p_record_id
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Fix archive_old_audit_logs function
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs(p_days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.audit_logs  -- FIXED: audit_log -> audit_logs
        WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix log_audit_event function (if it exists with old signature)
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
    -- Use the new log_audit_event from migration 22 which has correct signature
    -- This is just a wrapper for backward compatibility
    v_audit_id := public.log_audit_event(
        p_action,           -- action
        p_table_name,       -- resource_type
        p_record_id,        -- resource_id
        p_old_data,         -- old_values
        p_new_data,         -- new_values
        TRUE,               -- success
        NULL,               -- error_message
        '{}'::JSONB         -- metadata
    );
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if audit_logs table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Table audit_logs exists';
    ELSE
        RAISE NOTICE '❌ Table audit_logs does NOT exist';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log' AND table_schema = 'public') THEN
        RAISE NOTICE '⚠️  Old table audit_log still exists (should be removed or renamed)';
    END IF;
END $$;

-- List all functions that might reference audit_log
SELECT
    proname as function_name,
    prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND prosrc LIKE '%audit_log%'
ORDER BY proname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '
    ============================================================
    ✅ AUDIT_LOG TABLE NAME FIX APPLIED
    ============================================================

    Fixed Functions:
    ✓ get_audit_trail - now uses audit_logs table
    ✓ archive_old_audit_logs - now uses audit_logs table
    ✓ log_audit_event - backward compatible wrapper

    Next Steps:
    1. Run the verification queries above to check
    2. Test marking borrowing as returned
    3. Check browser console for any remaining errors

    ============================================================
    ';
END $$;
