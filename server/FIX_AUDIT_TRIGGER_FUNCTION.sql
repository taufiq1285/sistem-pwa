-- ============================================================================
-- FIX AUDIT_TRIGGER_FUNCTION - CRITICAL FIX
-- ============================================================================
-- Problem: audit_trigger_function still references audit_log (singular)
--          This causes "relation public.audit_log does not exist" error
--          when updating peminjaman table
-- Solution: Update trigger function to use audit_logs with correct columns
-- ============================================================================

-- Drop old audit_trigger_function if it exists
DROP FUNCTION IF EXISTS public.audit_trigger_function() CASCADE;

-- Note: The correct audit_trigger_function from migration 22 already exists
-- It's defined in 22_audit_logging_system.sql and uses the log_audit_event function
-- We don't need to recreate it since it calls log_audit_event which inserts into audit_logs

-- However, if you have an OLD version that directly inserts, here's the fix:
-- This version is compatible with the OLD audit_log schema but writes to audit_logs

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

    -- Use the new log_audit_event function from migration 22
    -- This function correctly inserts into audit_logs table
    v_audit_id := public.log_audit_event(
        v_action,           -- action
        TG_TABLE_NAME,      -- resource_type
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,                -- resource_id
        v_old_values,       -- old_values
        v_new_values,       -- new_values
        TRUE,               -- success
        NULL,               -- error_message
        jsonb_build_object('triggered_by', 'audit_trigger_function')  -- metadata
    );

    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.audit_trigger_function IS
'Updated audit trigger - uses audit_logs table via log_audit_event function';

-- ============================================================================
-- FIX get_resource_audit_trail function
-- ============================================================================

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
    SELECT
        al.id,
        al.action,
        al.old_values,  -- FIXED: old_data -> old_values
        al.new_values,  -- FIXED: new_data -> new_values
        al.user_id,
        al.created_at
    FROM public.audit_logs al  -- FIXED: audit_log -> audit_logs
    WHERE al.resource_type = p_table_name  -- FIXED: table_name -> resource_type
    AND al.resource_id = p_record_id       -- FIXED: record_id -> resource_id
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

COMMENT ON FUNCTION public.get_resource_audit_trail IS
'Get audit trail for a resource - uses audit_logs table with correct column names';

-- ============================================================================
-- RECREATE TRIGGERS ON PEMINJAMAN TABLE
-- ============================================================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS audit_peminjaman_changes ON peminjaman;

-- Recreate trigger using the fixed function
CREATE TRIGGER audit_peminjaman_changes
    AFTER INSERT OR UPDATE OR DELETE ON peminjaman
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

COMMENT ON TRIGGER audit_peminjaman_changes ON peminjaman IS
'Audit trigger for peminjaman table - uses fixed audit_trigger_function';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_trigger_count INTEGER;
BEGIN
    -- Check if trigger exists
    SELECT COUNT(*) INTO v_trigger_count
    FROM information_schema.triggers
    WHERE trigger_name = 'audit_peminjaman_changes'
    AND event_object_table = 'peminjaman';

    IF v_trigger_count > 0 THEN
        RAISE NOTICE '✅ Trigger audit_peminjaman_changes exists on peminjaman table';
    ELSE
        RAISE NOTICE '❌ Trigger audit_peminjaman_changes NOT found';
    END IF;

    -- Check audit_logs table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE NOTICE '✅ Table audit_logs exists';
    ELSE
        RAISE NOTICE '❌ Table audit_logs does NOT exist';
    END IF;

    -- Check log_audit_event function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_event') THEN
        RAISE NOTICE '✅ Function log_audit_event exists';
    ELSE
        RAISE NOTICE '❌ Function log_audit_event does NOT exist';
    END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '
    ============================================================
    ✅ AUDIT_TRIGGER_FUNCTION FIX APPLIED
    ============================================================

    Fixed:
    ✓ audit_trigger_function - now calls log_audit_event
    ✓ get_resource_audit_trail - now uses audit_logs table
    ✓ Trigger recreated on peminjaman table

    This should fix the error:
    "relation public.audit_log does not exist"

    Next Steps:
    1. Refresh your browser (Ctrl+Shift+R)
    2. Try "Sudah Kembali" button again
    3. Error should be gone! ✨

    ============================================================
    ';
END $$;
