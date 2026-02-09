-- ============================================================================
-- COMPLETE FIX: Kehadiran System + Export CSV
-- Jalankan file ini di Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- ============================================================================
-- PART 1: HYBRID KEHADIRAN SYSTEM
-- ============================================================================

-- Add kelas_id column
ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS kelas_id UUID;

-- Add tanggal column
ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS tanggal DATE;

-- Add foreign key constraint for kelas_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'kehadiran_kelas_id_fkey'
    ) THEN
        ALTER TABLE kehadiran
        ADD CONSTRAINT kehadiran_kelas_id_fkey
        FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Populate kelas_id and tanggal for existing kehadiran records
UPDATE kehadiran k
SET
    kelas_id = j.kelas_id,
    tanggal = COALESCE(j.tanggal_praktikum, CURRENT_DATE)
FROM jadwal_praktikum j
WHERE k.jadwal_id = j.id
  AND k.kelas_id IS NULL;

-- Make jadwal_id optional
DO $$
BEGIN
    -- Check if column is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kehadiran'
          AND column_name = 'jadwal_id'
          AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE kehadiran ALTER COLUMN jadwal_id DROP NOT NULL;
    END IF;
END $$;

-- Drop old unique constraint if exists
ALTER TABLE kehadiran
DROP CONSTRAINT IF EXISTS kehadiran_unique;

-- Add new unique constraint (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'kehadiran_unique_hybrid'
    ) THEN
        ALTER TABLE kehadiran
        ADD CONSTRAINT kehadiran_unique_hybrid
        UNIQUE NULLS NOT DISTINCT (jadwal_id, kelas_id, tanggal, mahasiswa_id);
    END IF;
END $$;

-- Add CHECK constraint (only if not exists)
DO $$
BEGIN
    -- Drop old constraint first
    ALTER TABLE kehadiran DROP CONSTRAINT IF EXISTS kehadiran_identifier_check;

    -- Add new constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'kehadiran_identifier_check'
    ) THEN
        ALTER TABLE kehadiran
        ADD CONSTRAINT kehadiran_identifier_check CHECK (
            (jadwal_id IS NOT NULL AND kelas_id IS NULL AND tanggal IS NULL) OR
            (jadwal_id IS NULL AND kelas_id IS NOT NULL AND tanggal IS NOT NULL) OR
            (jadwal_id IS NOT NULL AND kelas_id IS NOT NULL AND tanggal IS NOT NULL)
        );
    END IF;
END $$;

-- Create indexes (safe - IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_kehadiran_kelas_id
ON kehadiran(kelas_id)
WHERE kelas_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kehadiran_tanggal
ON kehadiran(tanggal)
WHERE tanggal IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kehadiran_kelas_tanggal
ON kehadiran(kelas_id, tanggal)
WHERE kelas_id IS NOT NULL AND tanggal IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kehadiran_mahasiswa_kelas
ON kehadiran(mahasiswa_id, kelas_id)
WHERE kelas_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kehadiran_status
ON kehadiran(status)
WHERE status IS NOT NULL;

-- ============================================================================
-- PART 2: ADD MATA_KULIAH_ID TO KEHADIRAN
-- ============================================================================

-- Add mata_kuliah_id column
ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS mata_kuliah_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'kehadiran_mata_kuliah_id_fkey'
    ) THEN
        ALTER TABLE kehadiran
        ADD CONSTRAINT kehadiran_mata_kuliah_id_fkey
        FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_kehadiran_mata_kuliah_id
ON kehadiran(mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

-- Add comment
DO $$
BEGIN
    EXECUTE 'COMMENT ON COLUMN kehadiran.mata_kuliah_id IS ''Mata kuliah yang dipilih dosen saat input kehadiran (independent dari kelas)''';
END $$;

-- ============================================================================
-- PART 3: UPDATE RLS POLICIES
-- ============================================================================

-- Policy untuk dosen view kehadiran (semua kelas)
DROP POLICY IF EXISTS "kehadiran_select_dosen" ON kehadiran;
CREATE POLICY "kehadiran_select_dosen" ON kehadiran
    FOR SELECT
    USING (is_dosen());

COMMENT ON POLICY "kehadiran_select_dosen" ON kehadiran IS
'Allow dosen to view all attendance records (dosen bebas pilih kelas)';

-- Policy untuk dosen insert kehadiran (semua kelas)
DROP POLICY IF EXISTS "kehadiran_insert_dosen" ON kehadiran;
CREATE POLICY "kehadiran_insert_dosen" ON kehadiran
    FOR INSERT
    WITH CHECK (is_dosen());

COMMENT ON POLICY "kehadiran_insert_dosen" ON kehadiran IS
'Allow dosen to create attendance for any class';

-- Policy untuk dosen update kehadiran (semua kelas)
DROP POLICY IF EXISTS "kehadiran_update_dosen" ON kehadiran;
CREATE POLICY "kehadiran_update_dosen" ON kehadiran
    FOR UPDATE
    USING (is_dosen());

COMMENT ON POLICY "kehadiran_update_dosen" ON kehadiran IS
'Allow dosen to update attendance for any class';

-- Policy untuk mahasiswa view kehadiran mereka sendiri
DROP POLICY IF EXISTS "kehadiran_select_mahasiswa" ON kehadiran;
CREATE POLICY "kehadiran_select_mahasiswa" ON kehadiran
    FOR SELECT
    USING (
        is_mahasiswa() AND
        mahasiswa_id = get_mahasiswa_id()
    );

COMMENT ON POLICY "kehadiran_select_mahasiswa" ON kehadiran IS
'Allow mahasiswa to view their own attendance records';

-- Admin full access
DROP POLICY IF EXISTS "kehadiran_admin_all" ON kehadiran;
CREATE POLICY "kehadiran_admin_all" ON kehadiran
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "kehadiran_admin_all" ON kehadiran IS
'Allow admin full access to all attendance records';

-- ============================================================================
-- PART 4: VERIFICATION
-- ============================================================================

-- Verify columns added
DO $$
DECLARE
    kelas_id_exists BOOLEAN;
    tanggal_exists BOOLEAN;
    mk_id_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kehadiran' AND column_name = 'kelas_id'
    ) INTO kelas_id_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kehadiran' AND column_name = 'tanggal'
    ) INTO tanggal_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kehadiran' AND column_name = 'mata_kuliah_id'
    ) INTO mk_id_exists;

    RAISE NOTICE '
    ============================================================
    ✅ VERIFICATION RESULTS
    ============================================================

    Columns Added:
    - kelas_id: %
    - tanggal: %
    - mata_kuliah_id: %

    ',
    CASE WHEN kelas_id_exists THEN '✓' ELSE '✗' END,
    CASE WHEN tanggal_exists THEN '✓' ELSE '✗' END,
    CASE WHEN mk_id_exists THEN '✓' ELSE '✗' END;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '
    ============================================================
    ✅ COMPLETE FIX MIGRATION SUCCESS
    ============================================================

    📊 Changes Applied:
    ✓ Added kelas_id column to kehadiran
    ✓ Added tanggal column to kehadiran
    ✓ Added mata_kuliah_id column to kehadiran
    ✓ Made jadwal_id nullable
    ✓ Updated unique constraints
    ✓ Created performance indexes
    ✓ Updated RLS policies (dosen can access all classes)

    🎯 Features Enabled:
    - Hybrid kehadiran (jadwal OR kelas+tanggal)
    - Mata kuliah stored in kehadiran record
    - Dosen bebas pilih mata kuliah + kelas
    - Export CSV will show correct mata kuliah

    📝 Next Steps:
    1. Refresh your browser
    2. Test input kehadiran
    3. Test export CSV
    4. Verify mata kuliah appears in export

    ============================================================
    ';
END $$;
