-- Migration: Fix semester column and trigger
-- Purpose: Ensure semester column exists in mahasiswa table and fix the trigger
-- Author: System
-- Date: 2024-12-18

-- ============================================================================
-- STEP 1: Ensure semester column exists in mahasiswa table
-- ============================================================================

-- Add semester column if it doesn't exist (DO NOTHING if it already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'mahasiswa'
        AND column_name = 'semester'
    ) THEN
        ALTER TABLE mahasiswa
        ADD COLUMN semester INTEGER NOT NULL DEFAULT 1;

        RAISE NOTICE 'Added semester column to mahasiswa table';
    ELSE
        RAISE NOTICE 'Semester column already exists in mahasiswa table';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure kelas_mahasiswa has the semester tracking columns
-- ============================================================================

-- Add semester_saat_enroll column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'kelas_mahasiswa'
        AND column_name = 'semester_saat_enroll'
    ) THEN
        ALTER TABLE kelas_mahasiswa
        ADD COLUMN semester_saat_enroll INTEGER;

        RAISE NOTICE 'Added semester_saat_enroll column to kelas_mahasiswa table';
    ELSE
        RAISE NOTICE 'semester_saat_enroll column already exists in kelas_mahasiswa table';
    END IF;
END $$;

-- Add semester_terakhir column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'kelas_mahasiswa'
        AND column_name = 'semester_terakhir'
    ) THEN
        ALTER TABLE kelas_mahasiswa
        ADD COLUMN semester_terakhir INTEGER;

        RAISE NOTICE 'Added semester_terakhir column to kelas_mahasiswa table';
    ELSE
        RAISE NOTICE 'semester_terakhir column already exists in kelas_mahasiswa table';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Recreate the trigger function with proper error handling
-- ============================================================================

DROP FUNCTION IF EXISTS track_semester_saat_enroll() CASCADE;

CREATE OR REPLACE FUNCTION track_semester_saat_enroll()
RETURNS TRIGGER AS $$
BEGIN
    -- Set semester_saat_enroll from mahasiswa table saat INSERT
    -- Only set if the columns exist and semester_saat_enroll is NULL
    IF TG_OP = 'INSERT' AND NEW.semester_saat_enroll IS NULL THEN
        -- Check if mahasiswa table has semester column
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'mahasiswa'
            AND column_name = 'semester'
        ) THEN
            -- Get semester from mahasiswa table
            BEGIN
                SELECT m.semester INTO NEW.semester_saat_enroll
                FROM mahasiswa m
                WHERE m.id = NEW.mahasiswa_id;

                -- Also set semester_terakhir to the same value initially
                NEW.semester_terakhir := NEW.semester_saat_enroll;

                RAISE NOTICE 'Set semester_saat_enroll to % for mahasiswa_id %',
                    NEW.semester_saat_enroll, NEW.mahasiswa_id;
            EXCEPTION
                WHEN NO_DATA_FOUND THEN
                    RAISE WARNING 'Mahasiswa with id % not found', NEW.mahasiswa_id;
                WHEN OTHERS THEN
                    RAISE WARNING 'Error getting semester for mahasiswa_id %: %',
                        NEW.mahasiswa_id, SQLERRM;
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Recreate the trigger
-- ============================================================================

DROP TRIGGER IF EXISTS track_semester_enrollment ON kelas_mahasiswa;

CREATE TRIGGER track_semester_enrollment
BEFORE INSERT OR UPDATE ON kelas_mahasiswa
FOR EACH ROW
EXECUTE FUNCTION track_semester_saat_enroll();

-- ============================================================================
-- STEP 5: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN mahasiswa.semester IS 'Current semester of the student (1-14)';
COMMENT ON COLUMN kelas_mahasiswa.semester_saat_enroll IS 'Semester mahasiswa saat pertama kali enroll ke kelas ini (audit trail)';
COMMENT ON COLUMN kelas_mahasiswa.semester_terakhir IS 'Latest semester for tracking progression';
COMMENT ON FUNCTION track_semester_saat_enroll IS 'Automatically track semester when mahasiswa enrolls in kelas';

-- ============================================================================
-- STEP 6: Verify the setup
-- ============================================================================

DO $$
DECLARE
    mahasiswa_has_semester BOOLEAN;
    kelas_has_semester_columns BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if mahasiswa has semester column
    mahasiswa_has_semester := EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'mahasiswa'
        AND column_name = 'semester'
    );

    -- Check if kelas_mahasiswa has semester columns
    kelas_has_semester_columns := EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'kelas_mahasiswa'
        AND column_name = 'semester_saat_enroll'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'kelas_mahasiswa'
        AND column_name = 'semester_terakhir'
    );

    -- Check if trigger exists
    trigger_exists := EXISTS (
        SELECT 1
        FROM information_schema.triggers
        WHERE trigger_name = 'track_semester_enrollment'
        AND event_object_table = 'kelas_mahasiswa'
    );

    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- mahasiswa.semester column exists: %', mahasiswa_has_semester;
    RAISE NOTICE '- kelas_mahasiswa semester columns exist: %', kelas_has_semester_columns;
    RAISE NOTICE '- track_semester_enrollment trigger exists: %', trigger_exists;

    IF mahasiswa_has_semester AND kelas_has_semester_columns AND trigger_exists THEN
        RAISE NOTICE '✅ Migration completed successfully!';
    ELSE
        RAISE WARNING '⚠️ Migration completed with warnings - some components may be missing';
    END IF;
END $$;