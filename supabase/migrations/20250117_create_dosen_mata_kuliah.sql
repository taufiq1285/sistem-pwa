-- ============================================================================
-- MIGRATION: CREATE TABLE dosen_mata_kuliah
-- Purpose: Mapping dosen dengan mata kuliah yang diajar
-- Features:
-- - Mapping dosen-mata kuliah
-- - Track dosen aktif mengajar
-- - Support multi-dosen dalam 1 mata kuliah
-- ============================================================================

-- 1. Create Table
CREATE TABLE IF NOT EXISTS "dosen_mata_kuliah" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dosen_id UUID NOT NULL,
    mata_kuliah_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_dosen_mk_dosen
        FOREIGN KEY (dosen_id)
        REFERENCES dosen(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_dosen_mk_mata_kuliah
        FOREIGN KEY (mata_kuliah_id)
        REFERENCES mata_kuliah(id)
        ON DELETE CASCADE,

    -- Unique constraint: 1 dosen tidak bisa mengajar mata kuliah yang sama 2x
    CONSTRAINT unique_dosen_mata_kuliah
        UNIQUE (dosen_id, mata_kuliah_id)
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_dosen_mk_dosen ON "dosen_mata_kuliah"(dosen_id);
CREATE INDEX IF NOT EXISTS idx_dosen_mk_mata_kuliah ON "dosen_mata_kuliah"(mata_kuliah_id);
CREATE INDEX IF NOT EXISTS idx_dosen_mk_is_active ON "dosen_mata_kuliah"(is_active);
CREATE INDEX IF NOT EXISTS idx_dosen_mk_updated_at ON "dosen_mata_kuliah"(updated_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE "dosen_mata_kuliah" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy 1: Dosen bisa lihat data mereka sendiri
-- Note: auth.uid() = users.id, jadi perlu join ke tabel dosen
CREATE POLICY "dosen_can_read_own_mata_kuliah"
ON "dosen_mata_kuliah"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM dosen
        WHERE dosen.user_id = auth.uid()
        AND dosen.id = "dosen_mata_kuliah".dosen_id
    )
);

-- Policy 2: Dosen bisa insert data mereka sendiri
CREATE POLICY "dosen_can_insert_own_mata_kuliah"
ON "dosen_mata_kuliah"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM dosen
        WHERE dosen.user_id = auth.uid()
        AND dosen.id = dosen_id
    )
);

-- Policy 3: Dosen bisa update data mereka sendiri
CREATE POLICY "dosen_can_update_own_mata_kuliah"
ON "dosen_mata_kuliah"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM dosen
        WHERE dosen.user_id = auth.uid()
        AND dosen.id = "dosen_mata_kuliah".dosen_id
    )
);

-- Policy 4: Dosen bisa delete data mereka sendiri
CREATE POLICY "dosen_can_delete_own_mata_kuliah"
ON "dosen_mata_kuliah"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM dosen
        WHERE dosen.user_id = auth.uid()
        AND dosen.id = "dosen_mata_kuliah".dosen_id
    )
);

-- Policy 5: Admin bisa semua operasi
CREATE POLICY "admin_full_access_dosen_mata_kuliah"
ON "dosen_mata_kuliah"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin
        WHERE admin.user_id = auth.uid()
    )
);

-- Policy 6: Service role bisa semua (untuk triggers/background jobs)
CREATE POLICY "service_role_all_access_dosen_mata_kuliah"
ON "dosen_mata_kuliah"
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dosen_mk_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto update updated_at
CREATE TRIGGER trigger_update_dosen_mk_updated_at
    BEFORE UPDATE ON "dosen_mata_kuliah"
    FOR EACH ROW
    EXECUTE FUNCTION update_dosen_mk_updated_at();

-- ============================================================================
-- VERIFY
-- ============================================================================

-- Cek tabel
SELECT
    'Table created' as status,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'dosen_mata_kuliah';

-- Cek policies
SELECT
    'Policies created' as status,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'dosen_mata_kuliah';

-- Cek indexes
SELECT
    'Indexes created' as status,
    indexname
FROM pg_indexes
WHERE tablename = 'dosen_mata_kuliah';

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - UNCOMMENT TO INSERT TEST DATA)
-- ============================================================================

/*
-- Sample: Insert test data
-- Catatan: Pastikan sudah ada data di tabel dosen dan mata_kuliah
INSERT INTO "dosen_mata_kuliah" (dosen_id, mata_kuliah_id, is_active)
SELECT
    d.id as dosen_id,
    mk.id as mata_kuliah_id,
    true as is_active
FROM dosen d
CROSS JOIN mata_kuliah mk
LIMIT 5;

-- View sample data
SELECT
    dm.id,
    dm.is_active,
    dm.created_at,
    u.email as dosen_email,
    d.nip as dosen_nip,
    d.gelar_depan,
    d.gelar_belakang,
    mk.nama_mk,
    mk.kode_mk
FROM "dosen_mata_kuliah" dm
JOIN dosen d ON d.id = dm.dosen_id
JOIN users u ON u.id = d.user_id
JOIN mata_kuliah mk ON mk.id = dm.mata_kuliah_id
LIMIT 5;
*/
