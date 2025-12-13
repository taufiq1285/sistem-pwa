-- ============================================================================
-- FIX: Update mahasiswa_nim_format constraint untuk format AKBID
-- Format: BD2401001 (2 huruf + 7 angka)
-- ============================================================================

-- Drop constraint lama (hanya terima 8-20 digit)
ALTER TABLE mahasiswa DROP CONSTRAINT mahasiswa_nim_format;

-- Create constraint baru untuk format AKBID (2 huruf + 7 angka)
-- Contoh: BD2401001, BD2401002, etc
ALTER TABLE mahasiswa
ADD CONSTRAINT mahasiswa_nim_format
CHECK (nim ~ '^[A-Z]{2}[0-9]{7}$');

-- Verify constraint sudah update
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'mahasiswa'
AND constraint_name = 'mahasiswa_nim_format';

-- Test: cek apakah format BD2401001 valid
SELECT 'BD2401001' ~ '^[A-Z]{2}[0-9]{7}$' as "BD2401001 valid?";

SELECT 'NIM constraint updated successfully for AKBID format (BD + 7 digits)!' as status;
