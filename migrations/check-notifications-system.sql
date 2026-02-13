-- ==========================================
-- CEK SISTEM NOTIFIKASI - Untuk Semua Role
-- ==========================================
-- Script ini untuk mengecek apakah sistem notifikasi berfungsi
-- untuk semua role: admin, dosen, mahasiswa, laboran

-- ==========================================
-- 1. CEK STRUKTUR TABEL NOTIFICATIONS
-- ==========================================

SELECT '========== TABLE STRUCTURE ==========' as info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ==========================================
-- 2. CEK DATA NOTIFIKASI YANG SUDAH ADA
-- ==========================================

SELECT '========== EXISTING NOTIFICATIONS ==========' as info;

-- Total notifikasi per role
SELECT
  u.role,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE n.read_at IS NULL) as unread_notifications
FROM notifications n
JOIN users u ON n.user_id = u.id
GROUP BY u.role
ORDER BY u.role;

-- Sample notifikasi untuk setiap role
SELECT
  'Admin Notifications' as role_type,
  n.id,
  n.user_id,
  u.full_name,
  u.role,
  n.title,
  n.type,
  n.read_at,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.role = 'admin'
ORDER BY n.created_at DESC
LIMIT 5;

SELECT
  'Dosen Notifications' as role_type,
  n.id,
  n.user_id,
  u.full_name,
  u.role,
  n.title,
  n.type,
  n.read_at,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.role = 'dosen'
ORDER BY n.created_at DESC
LIMIT 5;

SELECT
  'Mahasiswa Notifications' as role_type,
  n.id,
  n.user_id,
  u.full_name,
  u.role,
  n.title,
  n.type,
  n.read_at,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.role = 'mahasiswa'
ORDER BY n.created_at DESC
LIMIT 5;

SELECT
  'Laboran Notifications' as role_type,
  n.id,
  n.user_id,
  u.full_name,
  u.role,
  n.title,
  n.type,
  n.read_at,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.role = 'laboran'
ORDER BY n.created_at DESC
LIMIT 5;

-- ==========================================
-- 3. CEK RLS POLICIES UNTUK NOTIFICATIONS
-- ==========================================

SELECT '========== NOTIFICATION RLS POLICIES ==========' as info;

SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Cek apakah admin bisa baca semua notifikasi
SELECT
  'Admin can read notifications?' as test_name,
  COUNT(*) as count
FROM notifications;

-- Cek apakah user biasa bisa baca notifikasinya sendiri
SELECT
  'Users can read own notifications?' as test_name,
  COUNT(*) as count
FROM notifications n
WHERE n.user_id IN (SELECT id FROM users WHERE role = 'dosen');

;
-- ==========================================
-- 4. CEK JENIS NOTIFIKASI (TYPE)
-- ==========================================

SELECT '========== NOTIFICATION TYPES ==========' as info;

SELECT
  type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT role, ', ') as sent_to_roles
FROM notifications n
JOIN users u ON n.user_id = u.id
GROUP BY type
ORDER BY count DESC
-- ==========================================
-- 5. CEK TRIGGER NOTIFIKASI
-- ==========================================
-- Cek di kode mana saja notifikasi dikirim

-- Dari Manajemen Assignment (admin)
SELECT
  'assignment_created',
  'assignment_updated',
  'assignment_deleted',
  'dosen_changed',
  'dosen_reassigned' as possible_types;

-- ==========================================
-- 6. TEST KIRIM NOTIFIKASI
-- ==========================================

SELECT '========== TEST NOTIFICATION ACCESS ==========' as info;

-- Test: Apakah admin bisa kirim notifikasi ke semua role?
-- Cek user di setiap role
SELECT
  role,
  COUNT(*) as user_count,
  STRING_AGG(full_name, ', ') as sample_users
FROM (
  SELECT
    u.role,
    u.full_name,
    ROW_NUMBER() OVER (PARTITION BY u.role ORDER BY u.full_name) as rn
  FROM users u
) ranked
WHERE rn <= 3
GROUP BY role
ORDER BY role;

-- ==========================================
-- 7. CEK KONEKSI NOTIFIKASI DENGAN TABEL LAIN
-- ==========================================

SELECT '========== NOTIFICATION RELATIONSHIPS ==========' as info;

-- Cek foreign key constraints
SELECT
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'notifications'::regclass
  AND contype = 'f';

-- ==========================================
-- 8. CEK USER YANG BELUM PERNAH MENERIMA NOTIFIKASI
-- ==========================================

SELECT '========== USERS WITHOUT NOTIFICATIONS ==========' as info;

SELECT
  u.id,
  u.full_name,
  u.email,
  u.role,
  u.created_at
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id
WHERE n.id IS NULL
ORDER BY u.role, u.full_name;

-- ==========================================
-- 9. SUMMARY
-- ==========================================

SELECT '========== NOTIFICATION SYSTEM SUMMARY ==========' as info;

SELECT
  'Total Users' as metric,
  (SELECT COUNT(*) FROM users) as count
UNION ALL
SELECT
  'Total Notifications',
  (SELECT COUNT(*) FROM notifications)
UNION ALL
SELECT
  'Unread Notifications',
  (SELECT COUNT(*) FROM notifications WHERE read_at IS NULL)
UNION ALL
SELECT
  'Users with Notifications',
  (SELECT COUNT(DISTINCT user_id) FROM notifications)
UNION ALL
SELECT
  'Users without Notifications',
  (SELECT COUNT(*) FROM users u LEFT JOIN notifications n ON u.id = n.user_id WHERE n.id IS NULL)
UNION ALL
SELECT
  'Notification Types',
  (SELECT COUNT(DISTINCT type) FROM notifications);
