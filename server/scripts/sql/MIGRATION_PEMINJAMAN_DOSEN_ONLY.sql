-- ============================================================================
-- MIGRATION: Ubah peminjaman system untuk DOSEN ONLY (bukan mahasiswa)
-- ============================================================================
--
-- TUJUAN: Peminjaman hanya bisa dilakukan oleh dosen, bukan mahasiswa
-- CARA: Change foreign key dari mahasiswa -> dosen
--
-- WARNING: Migration ini DESTRUCTIVE, pastikan backup database!
-- ============================================================================

-- ============================================================================
-- STEP 1: Create temporary column untuk migration data
-- ============================================================================

-- Check if column already exists
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'peminjaman' AND column_name = 'dosen_id_temp';

-- If needed, create backup of data
ALTER TABLE peminjaman
ADD COLUMN peminjam_id_backup UUID;

-- Copy existing peminjam_id to backup
UPDATE peminjaman
SET peminjam_id_backup = peminjam_id;

-- ============================================================================
-- STEP 2: Drop the old foreign key constraint
-- ============================================================================

ALTER TABLE peminjaman
DROP CONSTRAINT IF EXISTS peminjaman_peminjam_id_fkey;

-- ============================================================================
-- STEP 3: Delete problematic records (optional - jika ada foreign key violations)
-- ============================================================================

-- OPTIONAL: Jika ada peminjaman dengan peminjam_id yang invalid, delete
-- DELETE FROM peminjaman
-- WHERE peminjam_id NOT IN (SELECT id FROM dosen);

-- ============================================================================
-- STEP 4: Add new foreign key constraint ke dosen table
-- ============================================================================

ALTER TABLE peminjaman
ADD CONSTRAINT peminjaman_peminjam_id_fkey
FOREIGN KEY (peminjam_id)
REFERENCES dosen(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- ============================================================================
-- STEP 5: Verify migration
-- ============================================================================

-- Check foreign key was created
-- SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- WHERE table_name = 'peminjaman' AND constraint_name LIKE '%peminjam%';

-- Count records
-- SELECT COUNT(*) FROM peminjaman;

-- Check sample data
-- SELECT id, peminjam_id, dosen_id, status
-- FROM peminjaman LIMIT 5;

-- ============================================================================
-- STEP 6: Update application code (already done in dosen.api.ts)
-- ============================================================================

-- Code changes sudah di-lakukan di:
-- - src/lib/api/dosen.api.ts: createBorrowingRequest()
--   * Sekarang langsung pakai dosenData.id sebagai peminjam_id
--   * Tidak perlu cari mahasiswa record

-- ============================================================================
-- ROLLBACK (jika ada masalah)
-- ============================================================================

-- DROP CONSTRAINT peminjaman_peminjam_id_fkey;
-- ADD CONSTRAINT peminjaman_peminjam_id_fkey
--   FOREIGN KEY (peminjam_id) REFERENCES mahasiswa(id);
-- UPDATE peminjaman SET peminjam_id = peminjam_id_backup;
-- ALTER TABLE peminjaman DROP COLUMN peminjam_id_backup;

-- ============================================================================
-- AFTER MIGRATION
-- ============================================================================

-- 1. Drop backup column (after verify semua berjalan lancar)
-- ALTER TABLE peminjaman DROP COLUMN peminjam_id_backup;

-- 2. Update TypeScript types di src/types/database.types.ts
--    (sudah auto-sync dari Supabase)

-- 3. Restart aplikasi

-- ============================================================================
-- NOTES
-- ============================================================================
-- - peminjam_id sekarang reference ke dosen.id
-- - dosen_id tetap reference ke dosen.id (redundant tapi tetap keep)
-- - Ini memastikan peminjaman hanya bisa dilakukan oleh dosen
-- - Lebih sederhana dan lebih clean
