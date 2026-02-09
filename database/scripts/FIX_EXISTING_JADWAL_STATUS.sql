-- Update existing jadwal that has NULL status to be "approved"
UPDATE jadwal_praktikum
SET status = 'approved'
WHERE status IS NULL AND is_active = true;

-- Verify the update
SELECT id, status, is_active, tanggal_praktikum, jam_mulai, jam_selesai
FROM jadwal_praktikum
WHERE dosen_id = 'bde40def-b1cf-46ce-b225-18ead107726b';