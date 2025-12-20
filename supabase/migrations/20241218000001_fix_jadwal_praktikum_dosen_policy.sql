-- Migration: Fix jadwal_praktikum RLS policies for multi-dosen workflow
-- Purpose: Allow dosen to create schedules for any active kelas (including admin-created ones)
-- Author: System
-- Date: 2024-12-18

-- ============================================================================
-- STEP 1: Update dosen_teaches_kelas function to be more flexible
-- ============================================================================

-- Update the function to allow any dosen to work with any active kelas
-- This supports the multi-dosen workflow where multiple dosen can teach the same kelas
CREATE OR REPLACE FUNCTION dosen_teaches_kelas(p_kelas_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_kelas_exists BOOLEAN;
BEGIN
    -- Check if kelas exists and is active
    -- Allow any dosen to create schedules for any active kelas
    SELECT EXISTS (
        SELECT 1
        FROM kelas
        WHERE id = p_kelas_id
        AND is_active = TRUE
    ) INTO v_kelas_exists;

    RETURN COALESCE(v_kelas_exists, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 2: Update RLS policies for jadwal_praktikum
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "jadwal_praktikum_select_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON jadwal_praktikum;

-- Create new policies that allow any dosen to work with any active kelas
CREATE POLICY "jadwal_praktikum_select_dosen" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_dosen() AND EXISTS (
            SELECT 1 FROM kelas k
            WHERE k.id = jadwal_praktikum.kelas_id
            AND k.is_active = TRUE
        )
    );

CREATE POLICY "jadwal_praktikum_insert_dosen" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (
        is_dosen() AND EXISTS (
            SELECT 1 FROM kelas k
            WHERE k.id = kelas_id
            AND k.is_active = TRUE
        )
    );

CREATE POLICY "jadwal_praktikum_update_dosen" ON jadwal_praktikum
    FOR UPDATE
    USING (
        is_dosen() AND EXISTS (
            SELECT 1 FROM kelas k
            WHERE k.id = jadwal_praktikum.kelas_id
            AND k.is_active = TRUE
        )
    );

CREATE POLICY "jadwal_praktikum_delete_dosen" ON jadwal_praktikum
    FOR DELETE
    USING (
        is_dosen() AND EXISTS (
            SELECT 1 FROM kelas k
            WHERE k.id = jadwal_praktikum.kelas_id
            AND k.is_active = TRUE
        )
    );

-- ============================================================================
-- STEP 3: Update assignment system to track which dosen creates which jadwal
-- ============================================================================

-- Add dosen_id column to jadwal_praktikum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jadwal_praktikum'
        AND column_name = 'dosen_id'
    ) THEN
        ALTER TABLE jadwal_praktikum
        ADD COLUMN dosen_id UUID REFERENCES dosen(id) ON DELETE SET NULL;

        -- Create index for performance
        CREATE INDEX idx_jadwal_praktikum_dosen_id ON jadwal_praktikum(dosen_id);

        -- Add comment
        COMMENT ON COLUMN jadwal_praktikum.dosen_id IS 'Dosen who created this schedule';
    END IF;
END $$;

-- Update the jadwal_praktikum insert policy to set dosen_id automatically
DROP TRIGGER IF EXISTS set_jadwal_dosen_id ON jadwal_praktikum;

CREATE OR REPLACE FUNCTION set_jadwal_dosen_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-set dosen_id from current user if not provided
    IF NEW.dosen_id IS NULL AND is_dosen() THEN
        NEW.dosen_id := get_current_dosen_id();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_jadwal_dosen_id
    BEFORE INSERT OR UPDATE ON jadwal_praktikum
    FOR EACH ROW
    EXECUTE FUNCTION set_jadwal_dosen_id();

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    -- Check if policies exist
    policy_exists := EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'jadwal_praktikum'
        AND policyname = 'jadwal_praktikum_insert_dosen'
    );

    IF policy_exists THEN
        RAISE NOTICE '✅ Migration completed successfully!';
        RAISE NOTICE '- Updated dosen_teaches_kelas function for multi-dosen workflow';
        RAISE NOTICE '- Created new RLS policies for jadwal_praktikum';
        RAISE NOTICE '- Added dosen_id column to track schedule creators';
    ELSE
        RAISE WARNING '⚠️ Migration may not have completed properly';
    END IF;
END $$;

-- Comments for documentation
COMMENT ON FUNCTION dosen_teaches_kelas IS 'Allows any dosen to work with any active kelas - supports multi-dosen workflow';
COMMENT ON POLICY "jadwal_praktikum_insert_dosen" ON jadwal_praktikum IS 'Allow dosen to create schedules for any active kelas';