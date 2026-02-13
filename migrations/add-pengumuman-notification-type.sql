-- ==========================================
-- FIX: ADD "pengumuman" TO NOTIFICATION TYPE CONSTRAINT
-- ==========================================

-- Drop constraint lama
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add constraint baru DENGAN "pengumuman"
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  -- Tipe lama
  'info', 'warning', 'error', 'success', 'quiz', 'grade', 'announcement', 'booking',
  -- HIGH PRIORITY notification types
  'jadwal_baru', 'jadwal_diupdate', 'jadwal_pending_approval', 'jadwal_dibatalkan',
  'peminjaman_baru', 'peminjaman_disetujui', 'peminjaman_ditolak', 'peminjaman_terlambat',
  'kuis_published',
  'logbook_submitted', 'logbook_approved', 'logbook_rejected', 'logbook_revision',
  'test_notification',
  -- PENTING: Tambahkan "pengumuman" untuk fitur Announcement
  'pengumuman'
));

-- Verifikasi
SELECT
  '✅ Constraint updated' as status,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'notifications_type_check';

SELECT
  '============================================' as info,
  '✅ FIX SELESAI!' as status,
  'Tipe "pengumuman" sekarang sudah ditambahkan ke constraint.' as description;
