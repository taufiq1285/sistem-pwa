-- ============================================================================
-- FIX TYPE CASTING IN AUDIT_TRIGGER_FUNCTION
-- ============================================================================
-- Problem: Type mismatch when calling log_audit_event
--          - TG_TABLE_NAME is type 'name', not 'text'
--          - NULL is type 'unknown', not 'text'
-- Solution: Add explicit type casts
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

    -- Call log_audit_event with EXPLICIT TYPE CASTS
    v_audit_id := public.log_audit_event(
        v_action,                -- p_action (TEXT)
        TG_TABLE_NAME::TEXT,     -- p_resource_type (TEXT) - CAST name to TEXT
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,                     -- p_resource_id (UUID)
        v_old_values,            -- p_old_values (JSONB)
        v_new_values,            -- p_new_values (JSONB)
        TRUE,                    -- p_success (BOOLEAN)
        NULL::TEXT,              -- p_error_message (TEXT) - CAST NULL to TEXT
        jsonb_build_object('triggered_by', 'audit_trigger_function')  -- p_metadata (JSONB)
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
'Audit trigger function with proper type casting for log_audit_event';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ audit_trigger_function updated with proper type casting';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '  1. TG_TABLE_NAME cast to TEXT';
    RAISE NOTICE '  2. NULL cast to TEXT for error_message';
    RAISE NOTICE '';
    RAISE NOTICE 'This should fix the error:';
    RAISE NOTICE '  "function public.log_audit_event(...) does not exist"';
END $$;

-- ============================================================================
-- TEST THE FIX (Optional - commented out)
-- ============================================================================

-- Uncomment to test if you want to verify the function works
-- DO $$
-- DECLARE
--     test_audit_id UUID;
-- BEGIN
--     -- Test calling log_audit_event directly
--     test_audit_id := public.log_audit_event(
--         'test',              -- action
--         'test_table',        -- resource_type
--         gen_random_uuid(),   -- resource_id
--         NULL,                -- old_values
--         NULL,                -- new_values
--         TRUE,                -- success
--         NULL::TEXT,          -- error_message
--         '{}'::JSONB          -- metadata
--     );
--
--     RAISE NOTICE 'Test successful! Audit ID: %', test_audit_id;
--
--     -- Cleanup test entry
--     DELETE FROM audit_logs WHERE id = test_audit_id;
-- END $$;
