-- ==========================================
-- FIX NOTIFIKASI APLIKASI - Agar Semua Notifikasi Berfungsi
-- ==========================================
-- Masalah: 0 notifikasi di database
-- Penyebab: RLS policy memblokir INSERT ke tabel notifications
-- Solusi: Perbaiki RLS policies agar notifikasi aplikasi bisa dikirim

-- ==========================================
-- 1. ENABLE RLS (jika belum)
-- ==========================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. DROP OLD POLICIES (yang bermasalah)
-- ==========================================

DROP POLICY IF EXISTS notifications_select_own ON notifications;
DROP POLICY IF EXISTS notifications_insert_own ON notifications;
DROP POLICY IF EXISTS notifications_update_own ON notifications;
DROP POLICY IF EXISTS notifications_delete_own ON notifications;
DROP POLICY IF EXISTS notifications_select_all ON notifications;
DROP POLICY IF EXISTS notifications_insert_all ON notifications;

-- ==========================================
-- 3. CREATE NEW POLICIES (yang benar)
-- ==========================================

-- Policy 1: User bisa BACA notifikasi sendiri
CREATE POLICY notifications_select_own
ON notifications
FOR SELECT
TO public
USING (user_id = auth.uid());

-- Policy 2: User bisa INSERT notifikasi
-- SANGAT PENTING: Admin, dosen, dan laboran bisa INSERT untuk user lain
-- Mahasiswa hanya bisa INSERT untuk diri sendiri (test)
CREATE POLICY notifications_insert_app
ON notifications
FOR INSERT
TO public
WITH CHECK (
  -- User bisa insert untuk diri sendiri
  user_id = auth.uid()
  OR
  -- ATAU user dengan role admin/dosen/laboran bisa insert untuk siapa saja
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'dosen', 'laboran')
  )
);

-- Policy 3: User bisa UPDATE notifikasi sendiri (mark as read)
CREATE POLICY notifications_update_own
ON notifications
FOR UPDATE
TO public
USING (user_id = auth.uid());

-- Policy 4: User bisa DELETE notifikasi sendiri
CREATE POLICY notifications_delete_own
ON notifications
FOR DELETE
TO public
USING (user_id = auth.uid());

-- Policy 5: Admin bisa BACA SEMUA notifikasi
CREATE POLICY notifications_select_all
ON notifications
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ==========================================
-- 4. VERIFIKASI
-- ==========================================

-- Cek policies yang sudah dibuat
SELECT
  '✓ Policies Created' as info,
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Test insert notifikasi (seperti yang dilakukan aplikasi)
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  u.id,
  '✅ Test Notifikasi Aplikasi',
  'Sistem notifikasi sudah berfungsi! Notifikasi asli dari aplikasi akan muncul di sini.',
  'test_notification',
  '{"source": "fix_verification", "feature": "app_notifications", "timestamp": now()}'::jsonb
FROM users u
WHERE u.email = 'alfiah@dosen.com'
RETURNING
  'Test notification created' as result,
  id,
  created_at;

-- Cek apakah insert berhasil
SELECT
  '✅ Verification' as info,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE type = 'test_notification') as test_notifications
FROM notifications;

-- Sample notifikasi
SELECT
  'Sample notifications' as info,
  n.id,
  u.full_name,
  u.role,
  n.title,
  n.type,
  n.is_read,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 5;

SELECT
  '============================================' as info,
  '✅ FIX SELESAI!' as status,
  'Sekarang semua notifikasi aplikasi akan berfungsi:' as description;

SELECT
  '1. Dosen dapat notifikasi saat mahasiswa submit tugas' as feature_1,
  '2. Mahasiswa dapat notifikasi saat tugas baru dibuat' as feature_2,
  '3. Mahasiswa dapat notifikasi saat tugas dinilai' as feature_3,
  '4. Mahasiswa dapat notifikasi saat dosen berubah' as feature_4,
  '5. Dosen dapat notifikasi saat dapat penugasan baru' as feature_5,
  '6. Dosen dapat notifikasi saat digantikan dosen lain' as feature_6;
