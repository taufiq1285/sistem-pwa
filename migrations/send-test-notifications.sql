-- ==========================================
-- KIRIM TEST NOTIFIKASI KE SEMUA ROLE
-- ==========================================
-- Script ini untuk mengirim test notifikasi ke semua role
-- untuk memastikan sistem notifikasi berfungsi

-- ==========================================
-- 1. TEST NOTIFIKASI UNTUK DOSEN (Alfih)
-- ==========================================

SELECT '========== SENDING TEST NOTIFICATIONS ==========' as info;

-- Kirim ke Alfih
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
  'Halo ' || u.full_name || '! Ini adalah test notifikasi untuk memastikan sistem notifikasi berfungsi dengan baik.',
  'test_notification',
  '{"source": "admin_test", "role": "dosen", "target": "Alfih", "timestamp": now()}'::jsonb
FROM users u
WHERE u.email = 'alfiah@dosen.com'
RETURNING
  'Dosen (Alfih)' as target_role,
  id as notification_id,
  created_at;

-- ==========================================
-- 2. TEST NOTIFIKASI UNTUK MAHASISWA (Arni)
-- ==========================================

-- Kirim ke Arni
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
  'Halo ' || u.full_name || '! Ini test notifikasi untuk mahasiswa. Sistem notifikasi sudah berfungsi.',
  'test_notification',
  '{"source": "admin_test", "role": "mahasiswa", "target": "Arni", "timestamp": now()}'::jsonb
FROM users u
WHERE u.email = 'test@arni.com'
RETURNING
  'Mahasiswa (Arni)' as target_role,
  id as notification_id,
  created_at;

-- ==========================================
-- 3. TEST NOTIFIKASI UNTUK LABORAN (Labor)
-- ==========================================

-- Kirim ke Labor (bukan Darnah)
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
  'Halo ' || u.full_name || '! Test notifikasi untuk laboran. Silakan cek dropdown notifikasi di header.',
  'test_notification',
  '{"source": "admin_test", "role": "laboran", "target": "Labor", "timestamp": now()}'::jsonb
FROM users u
WHERE u.email = 'laboran@test.com'
RETURNING
  'Laboran (Labor)' as target_role,
  id as notification_id,
  created_at;

-- ==========================================
-- 4. TEST NOTIFIKASI UNTUK ADMIN
-- ==========================================

-- Kirim ke admin
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
  'Halo ' || u.full_name || '! Test notifikasi admin. Sistem notifikasi sudah aktif.',
  'test_notification',
  '{"source": "system", "role": "admin", "timestamp": now()}'::jsonb
FROM users u
WHERE u.role = 'admin'
LIMIT 1
RETURNING
  'Admin' as target_role,
  id as notification_id,
  created_at;

-- ==========================================
-- 5. VERIFIKASI HASIL
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
  'Total Test Notifications Sent' as summary,
  COUNT(*) as count
FROM notifications
WHERE type = 'test_notification';

SELECT
  '✅ Test selesai!' as message,
  'Silakan cek di browser untuk setiap role:' as instructions;

-- Manual testing instructions:
SELECT
  '1. Login sebagai Dosen: alfiah@dosen.com (Alfih)' as step_1,
  '2. Cek lonceng notifikasi di header (pojok kanan atas)' as step_2,
  '3. Klik lonceng untuk buka dropdown notifikasi' as step_3,
  '4. Test notifikasi seharusnya muncul di sana' as step_4,
  '5. Login sebagai Mahasiswa: test@arni.com (Arni)' as step_5,
  '6. Cek notifikasi untuk Arni' as step_6,
  '7. Login sebagai Laboran: laboran@test.com (Labor)' as step_7,
  '8. Cek notifikasi untuk Labor' as step_8;
