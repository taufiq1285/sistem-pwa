-- ==========================================
-- FIX NOTIFICATION CONSTRAINT + KIRIM TEST
-- ==========================================
-- 1. Update check constraint untuk support tipe notifikasi baru
-- 2. Kirim test notifikasi ke semua role

-- ==========================================
-- 1. UPDATE CHECK CONSTRAINT
-- ==========================================

SELECT '========== UPDATING NOTIFICATION TYPE CONSTRAINT ==========' as info;

-- Drop constraint lama
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add constraint baru dengan tipe-tipe baru
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  -- Tipe lama
  'info', 'warning', 'error', 'success', 'quiz', 'grade', 'announcement', 'booking',
  -- Tipe baru - HIGH PRIORITY
  'jadwal_baru', 'jadwal_diupdate', 'jadwal_pending_approval', 'jadwal_dibatalkan',
  'peminjaman_baru', 'peminjaman_disetujui', 'peminjaman_ditolak', 'peminjaman_terlambat',
  'kuis_published',
  'logbook_submitted', 'logbook_approved', 'logbook_rejected', 'logbook_revision',
  'test_notification'
));

SELECT '✅ Constraint updated - sekarang support tipe notifikasi baru' as status;

-- ==========================================
-- 2. KIRIM TEST NOTIFIKASI KE SEMUA ROLE
-- ==========================================

SELECT '========== SENDING TEST NOTIFICATIONS ==========' as info;

-- Kirim ke Admin
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  u.id,
  '✅ Test Notifikasi Admin',
  'Halo ' || u.full_name || '! Ini test notifikasi. Sistem notifikasi sudah berfungsi.',
  'test_notification',
  jsonb_build_object(
    'source', 'admin_test',
    'role', 'admin',
    'timestamp', now()
  )
FROM users u
WHERE u.role = 'admin'
LIMIT 1
RETURNING
  'Admin' as target_role,
  id as notification_id,
  created_at;

-- Kirim ke Dosen (Alfih)
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  u.id,
  '✅ Test Notifikasi Dosen',
  'Halo ' || u.full_name || '! Ini test notifikasi. Sistem notifikasi sudah berfungsi.',
  'test_notification',
  jsonb_build_object(
    'source', 'admin_test',
    'role', 'dosen',
    'timestamp', now()
  )
FROM users u
WHERE u.email = 'alfiah@dosen.com'
RETURNING
  'Dosen (Alfih)' as target_role,
  id as notification_id,
  created_at;

-- Kirim ke Mahasiswa (Arni)
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  u.id,
  '✅ Test Notifikasi Mahasiswa',
  'Halo ' || u.full_name || '! Test notifikasi mahasiswa. Sistem notifikasi sudah berfungsi.',
  'test_notification',
  jsonb_build_object(
    'source', 'admin_test',
    'role', 'mahasiswa',
    'timestamp', now()
  )
FROM users u
WHERE u.email = 'test@arni.com'
RETURNING
  'Mahasiswa (Arni)' as target_role,
  id as notification_id,
  created_at;

-- Kirim ke Laboran
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  u.id,
  '✅ Test Notifikasi Laboran',
  'Halo ' || u.full_name || '! Test notifikasi laboran. Silakan cek dropdown notifikasi.',
  'test_notification',
  jsonb_build_object(
    'source', 'admin_test',
    'role', 'laboran',
    'timestamp', now()
  )
FROM users u
WHERE u.email = 'laboran@test.com'
RETURNING
  'Laboran' as target_role,
  id as notification_id,
  created_at;

-- ==========================================
-- 3. VERIFIKASI HASIL
-- ==========================================

SELECT '========== VERIFICATION ==========' as info;

-- Total notifikasi per role
SELECT
  u.role,
  COUNT(*) as notification_count,
  COUNT(*) FILTER (WHERE n.is_read = false) as unread_count
FROM notifications n
JOIN users u ON n.user_id = u.id
GROUP BY u.role
ORDER BY u.role;

-- Detail notifikasi yang baru dikirim
SELECT
  n.id,
  u.full_name,
  u.role,
  n.title,
  n.type,
  n.is_read,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.type = 'test_notification'
ORDER BY n.created_at DESC;

-- Summary
SELECT
  '✅ Test selesai!' as message,
  'Silakan cek di browser untuk setiap role:' as instructions;

SELECT
  '1. Login sebagai Admin' as step_1,
  '2. Cek lonceng notifikasi 🔔 di header (pojok kanan atas)' as step_2,
  '3. Klik lonceng untuk buka dropdown notifikasi' as step_3,
  '4. Test notifikasi seharusnya muncul di sana' as step_4,
  '5. Login sebagai Dosen/Mahasiswa/Laboran dan cek notifikasi' as step_5;

-- Cek constraint
SELECT
  'Constraint check' as info,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'notifications_type_check';
