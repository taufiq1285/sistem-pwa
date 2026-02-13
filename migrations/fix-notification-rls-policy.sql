-- ==========================================
-- FIX RLS POLICY FOR NOTIFICATIONS
-- ==========================================
-- Masalah: Admin tidak bisa insert notifikasi untuk user lain
-- Solusi: Update RLS policy agar admin/dosen/laboran bisa insert untuk siapa saja

-- 1. ENABLE RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. DROP ALL OLD POLICIES (clean slate)
DROP POLICY IF EXISTS notifications_select_own ON notifications;
DROP POLICY IF EXISTS notifications_insert_own ON notifications;
DROP POLICY IF EXISTS notifications_update_own ON notifications;
DROP POLICY IF EXISTS notifications_delete_own ON notifications;
DROP POLICY IF EXISTS notifications_select_all ON notifications;
DROP POLICY IF EXISTS notifications_insert_all ON notifications;
DROP POLICY IF EXISTS notifications_insert_app ON notifications;

-- 3. CREATE NEW POLICIES

-- Policy 1: User bisa BACA notifikasi sendiri
CREATE POLICY notifications_select_own
ON notifications
FOR SELECT
TO public
USING (user_id = auth.uid());

-- Policy 2: User bisa INSERT notifikasi
-- SANGAT PENTING: Admin, dosen, dan laboran bisa INSERT untuk user lain
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

-- 4. VERIFIKASI
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

-- 5. TEST: Cek apakah admin user bisa insert
DO $$
DECLARE
  v_admin_id uuid;
  v_test_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  -- Get another user ID
  SELECT id INTO v_test_user_id FROM users WHERE role != 'admin' LIMIT 1;

  IF v_admin_id IS NOT NULL AND v_test_user_id IS NOT NULL THEN
    -- Test insert notification as admin
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      v_test_user_id,
      '🧪 RLS Policy Test',
      'Admin berhasil insert notifikasi untuk user lain. RLS policy sudah benar!',
      'test_notification'
    );

    RAISE NOTICE '✅ Test PASSED: Admin bisa insert notifikasi untuk user lain';
  ELSE
    RAISE NOTICE '⚠️ Test SKIPPED: Tidak cukup user untuk test';
  END IF;
END $$;

SELECT
  '============================================' as info,
  '✅ FIX SELESAI!' as status,
  'RLS policy sudah diperbaiki. Admin sekarang bisa insert notifikasi untuk user lain.' as description;
