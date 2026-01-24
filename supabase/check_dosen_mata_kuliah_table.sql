-- ============================================================================
-- CEK TABEL DOSEN_MATA_KULIAH DI SUPABASE
-- Jalankan query ini di SQL Editor Supabase
-- ============================================================================

-- 1. Cek apakah tabel dosen_mata_kuliah ada
SELECT
    table_name,
    table_type,
    is_insertable_into
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'dosen_mata_kuliah';

-- 2. Jika tabel ada, cek struktur/kolomnya
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dosen_mata_kuliah'
ORDER BY ordinal_position;

-- 3. Cek apakah ada data di tabel
SELECT COUNT(*) as total_records
FROM "dosen_mata_kuliah";

-- 4. Cek sample data (jika ada)
SELECT *
FROM "dosen_mata_kuliah"
LIMIT 5;

-- 5. Cek RLS policies untuk tabel ini
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'dosen_mata_kuliah';

-- 6. Cek apakah user dosen bisa akses (jika ada policy)
-- Login sebagai dosen dulu, lalu jalankan:
SELECT *
FROM "dosen_mata_kuliah"
LIMIT 1;

-- ============================================================================
-- DIAGNOSIS ERROR
-- ============================================================================

-- 7. Cek error dari query yang gagal
-- Jika error "table does not exist", berarti tabel belum dibuat
-- Jika error "permission denied", berarti RLS policy belum disetup

-- ============================================================================
-- SOLUTION
-- ============================================================================

-- Opsi A: Jika tabel BELUM ADA, buat tabelnya:
/*
CREATE TABLE IF NOT EXISTS "dosen_mata_kuliah" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dosen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mata_kuliah_id UUID NOT NULL REFERENCES mata_kuliah(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_dosen_mk_dosen ON "dosen_mata_kuliah"(dosen_id);
CREATE INDEX IF NOT EXISTS idx_dosen_mk_mk ON "dosen_mata_kuliah"(mata_kuliah_id);

-- Enable RLS
ALTER TABLE "dosen_mata_kuliah" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: Dosen bisa lihat data mereka sendiri
CREATE POLICY "dosen_can_read_own_mata_kuliah"
ON "dosen_mata_kuliah"
FOR SELECT
USING (auth.uid() = dosen_id);

-- Policy: Dosen bisa insert data mereka sendiri
CREATE POLICY "dosen_can_insert_own_mata_kuliah"
ON "dosen_mata_kuliah"
FOR INSERT
WITH CHECK (auth.uid() = dosen_id);

-- Policy: Dosen bisa update data mereka sendiri
CREATE POLICY "dosen_can_update_own_mata_kuliah"
ON "dosen_mata_kuliah"
FOR UPDATE
USING (auth.uid() = dosen_id);

-- Policy: Dosen bisa delete data mereka sendiri
CREATE POLICY "dosen_can_delete_own_mata_kuliah"
ON "dosen_mata_kuliah"
FOR DELETE
USING (auth.uid() = dosen_id);

-- Policy: Admin bisa semua
CREATE POLICY "admin_full_access_dosen_mata_kuliah"
ON "dosen_mata_kuliah"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
*/

-- Opsi B: Jika tabel SUDAH ADA tapi tidak ada RLS policy
/*
-- Enable RLS jika belum
ALTER TABLE "dosen_mata_kuliah" ENABLE ROW LEVEL SECURITY;

-- Drop policies lama jika ada
DROP POLICY IF EXISTS "dosen_can_read_own_mata_kuliah" ON "dosen_mata_kuliah";
DROP POLICY IF EXISTS "dosen_can_insert_own_mata_kuliah" ON "dosen_mata_kuliah";
DROP POLICY IF EXISTS "dosen_can_update_own_mata_kuliah" ON "dosen_mata_kuliah";
DROP POLICY IF EXISTS "dosen_can_delete_own_mata_kuliah" ON "dosen_mata_kuliah";
DROP POLICY IF EXISTS "admin_full_access_dosen_mata_kuliah" ON "dosen_mata_kuliah";

-- Create policies baru (lihat Opsi A di atas)
*/
