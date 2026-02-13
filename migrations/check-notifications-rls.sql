-- ==========================================
-- CEK & FIX RLS POLICIES NOTIFICATIONS
-- ==========================================
-- Masalah: Total Notifications = 0
-- Kemungkinan: RLS policy memblokir INSERT

-- ==========================================
-- 1. CEK RLS POLICIES UNTUK NOTIFICATIONS
-- ==========================================

SELECT '========== NOTIFICATION RLS POLICIES ==========' as info;

SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ==========================================
-- 2. CEK APAKAH RLS ENABLED
-- ==========================================

SELECT
  'RLS Status' as info,
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'notifications';

-- ==========================================
-- 3. TEST INSERT NOTIFIKASI (sebagai admin)
-- ==========================================

-- Test 1: Coba insert notifikasi untuk admin
SELECT '========== TEST INSERT NOTIFICATIONS ==========' as info;

-- Cek user dosen untuk test
SELECT
  'Test User (Dosen)' as test_target,
  id,
  full_name,
  email,
  role
FROM users
WHERE role = 'dosen'
LIMIT 1;

-- Test insert notifikasi untuk dosen
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  id,
  'Test Notifikasi',
  'Ini adalah test notifikasi untuk mengecek apakah sistem notifikasi berfungsi',
  'test_notification',
  '{"source": "rls_test"}'::jsonb
FROM users
WHERE role = 'dosen'
LIMIT 1
RETURNING
  id,
  user_id,
  title,
  type,
  created_at;

-- ==========================================
-- 4. CEK APAKAH INSERT BERHASIL
-- ==========================================

SELECT
  'Notifications after test insert' as test_name,
  COUNT(*) as count
FROM notifications;

-- Jika count = 0, berarti INSERT gagal diblokir RLS
-- Jika count = 1, berarti INSERT berhasil

-- ==========================================
-- 5. CEK NOTIFIKASI PER USER
-- ==========================================

-- Cek apakah dosen bisa baca notifikasinya sendiri
SELECT
  'Dosen notifications' as test_name,
  n.id,
  n.user_id,
  u.full_name,
  u.role,
  n.title,
  n.type,
  n.is_read,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.role = 'dosen';

-- ==========================================
-- 6. JIKA RLS BERMASALAH, BERIKU FIX-NYA
-- ==========================================

-- Enable RLS pada tabel notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada
DROP POLICY IF EXISTS notifications_select_own ON notifications;
DROP POLICY IF EXISTS notifications_insert_own ON notifications;
DROP POLICY IF EXISTS notifications_update_own ON notifications;
DROP POLICY IF EXISTS notifications_delete_own ON notifications;
DROP POLICY IF EXISTS notifications_select_all ON notifications;
DROP POLICY IF EXISTS notifications_insert_all ON notifications;

-- Policy untuk user biasa (baca/update/delete notifikasi sendiri)
CREATE POLICY notifications_select_own
ON notifications
FOR SELECT
TO public
USING (user_id = auth.uid());

CREATE POLICY notifications_insert_own
ON notifications
FOR INSERT
TO public
WITH CHECK (
  -- User bisa insert notifikasi untuk diri sendiri (test)
  user_id = auth.uid()
  OR
  -- Atau user dengan role admin/dosen/laboran bisa insert untuk orang lain
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'dosen', 'laboran')
  )
);

CREATE POLICY notifications_update_own
ON notifications
FOR UPDATE
TO public
USING (user_id = auth.uid());

CREATE POLICY notifications_delete_own
ON notifications
FOR DELETE
TO public
USING (user_id = auth.uid());

-- Policy khusus untuk admin (bisa baca semua notifikasi)
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
-- 7. VERIFIKASI SETELAH FIX
-- ==========================================

SELECT '========== AFTER FIX VERIFICATION ==========' as info;

-- Test insert lagi setelah fix
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  id,
  'Test Notifikasi Setelah Fix',
  'Ini test notifikasi setelah perbaikan RLS policies',
  'test_notification_fixed',
  '{"source": "rls_fix", "test": true}'::jsonb
FROM users
WHERE role = 'dosen'
LIMIT 1
RETURNING
  id,
  user_id,
  title,
  type,
  created_at;

-- Cek total notifikasi
SELECT
  'Total notifications after fix' as test_name,
  COUNT(*) as count
FROM notifications;

-- Sample notifikasi yang baru dibuat
SELECT
  'Sample notifications' as info,
  n.id,
  u.full_name,
  u.role,
  n.title,
  n.type,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 5;

-- ==========================================
-- 8. CEK POLICIES YANG SUDAH DIBUAT
-- ==========================================

SELECT
  'Verification: All notification policies' as info,
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;
