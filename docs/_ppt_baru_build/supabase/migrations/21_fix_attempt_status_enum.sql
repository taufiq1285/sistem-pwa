-- ============================================================================
-- FIX ATTEMPT_STATUS ENUM
-- ============================================================================
-- Description: Fix attempt_status enum values
-- Issue: Database has old enum values, need to update
-- ============================================================================

-- First, check current enum values
DO $$
DECLARE
    enum_value TEXT;
BEGIN
    RAISE NOTICE 'Current attempt_status enum values:';
    FOR enum_value IN
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = 'attempt_status'::regtype
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  - %', enum_value;
    END LOOP;
END $$;

-- ============================================================================
-- OPTION 1: Add missing values to existing enum (if possible)
-- ============================================================================

-- Add 'pending' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'attempt_status'::regtype
        AND enumlabel = 'pending'
    ) THEN
        ALTER TYPE attempt_status ADD VALUE 'pending';
        RAISE NOTICE 'Added "pending" to attempt_status enum';
    ELSE
        RAISE NOTICE '"pending" already exists in attempt_status enum';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add "pending": %', SQLERRM;
END $$;

-- Add 'in_progress' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'attempt_status'::regtype
        AND enumlabel = 'in_progress'
    ) THEN
        ALTER TYPE attempt_status ADD VALUE 'in_progress';
        RAISE NOTICE 'Added "in_progress" to attempt_status enum';
    ELSE
        RAISE NOTICE '"in_progress" already exists in attempt_status enum';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add "in_progress": %', SQLERRM;
END $$;

-- Add 'completed' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'attempt_status'::regtype
        AND enumlabel = 'completed'
    ) THEN
        ALTER TYPE attempt_status ADD VALUE 'completed';
        RAISE NOTICE 'Added "completed" to attempt_status enum';
    ELSE
        RAISE NOTICE '"completed" already exists in attempt_status enum';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add "completed": %', SQLERRM;
END $$;

-- Add 'graded' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'attempt_status'::regtype
        AND enumlabel = 'graded'
    ) THEN
        ALTER TYPE attempt_status ADD VALUE 'graded';
        RAISE NOTICE 'Added "graded" to attempt_status enum';
    ELSE
        RAISE NOTICE '"graded" already exists in attempt_status enum';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add "graded": %', SQLERRM;
END $$;

-- Add 'abandoned' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'attempt_status'::regtype
        AND enumlabel = 'abandoned'
    ) THEN
        ALTER TYPE attempt_status ADD VALUE 'abandoned';
        RAISE NOTICE 'Added "abandoned" to attempt_status enum';
    ELSE
        RAISE NOTICE '"abandoned" already exists in attempt_status enum';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add "abandoned": %', SQLERRM;
END $$;

-- Show final enum values
DO $$
DECLARE
    enum_value TEXT;
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Final attempt_status enum values:';
    FOR enum_value IN
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = 'attempt_status'::regtype
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  ✓ %', enum_value;
    END LOOP;
    RAISE NOTICE '=================================================';
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ attempt_status enum has been fixed!';
    RAISE NOTICE 'You can now run 21_enhanced_rls_policies.sql';
END $$;
