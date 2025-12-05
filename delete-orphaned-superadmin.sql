-- ============================================================================
-- DELETE ORPHANED SUPERADMIN
-- ============================================================================
-- User ID: 7eb7eead-29e8-48aa-b8be-758b561d35cf
-- Email: superadmin@akbid.ac.id
-- Status: Orphaned (ada di auth.users, tidak ada di public.users)
-- ============================================================================

-- STEP 1: Verifikasi user ini memang orphaned
-- ============================================================================
SELECT
    'auth.users' AS location,
    id,
    email,
    created_at
FROM auth.users
WHERE id = '7eb7eead-29e8-48aa-b8be-758b561d35cf'

UNION ALL

SELECT
    'public.users' AS location,
    id,
    email,
    created_at
FROM public.users
WHERE id = '7eb7eead-29e8-48aa-b8be-758b561d35cf';

-- Expected:
-- Row 1: auth.users - ADA
-- Row 2: public.users - TIDAK ADA (null)

-- ============================================================================
-- STEP 2: Cek tidak ada data di tabel admin
-- ============================================================================
SELECT * FROM admin WHERE user_id = '7eb7eead-29e8-48aa-b8be-758b561d35cf';

-- Expected: 0 rows (karena registrasi gagal)

-- ============================================================================
-- STEP 3: Hapus dari public.users (jika ada)
-- ============================================================================
DELETE FROM public.users
WHERE id = '7eb7eead-29e8-48aa-b8be-758b561d35cf';

-- Expected: 0 rows affected (karena memang tidak ada)

-- ============================================================================
-- STEP 4: Hapus dari auth.users
-- ============================================================================
-- ⚠️ TIDAK BISA via SQL biasa, HARUS via Supabase Dashboard

-- CARA: Via Supabase Dashboard
-- 1. Buka: https://supabase.com/dashboard/project/lqkzhrdhrbexdtrgmogd/auth/users
-- 2. Cari email: superadmin@akbid.ac.id
-- 3. Klik "..." > "Delete User"
-- 4. Konfirmasi delete

-- ============================================================================
-- STEP 5: Verifikasi cleanup berhasil
-- ============================================================================
SELECT
    (SELECT COUNT(*) FROM auth.users) AS auth_users,
    (SELECT COUNT(*) FROM public.users) AS public_users,
    (SELECT COUNT(*) FROM auth.users au
     LEFT JOIN public.users pu ON au.id = pu.id
     WHERE pu.id IS NULL) AS orphaned_users;

-- Expected setelah cleanup:
-- {
--   "auth_users": 2,        ← Berkurang dari 3 → 2
--   "public_users": 2,      ← Tetap 2
--   "orphaned_users": 0     ← BERSIH! ✅
-- }

-- ============================================================================
-- DONE!
-- ============================================================================
-- Setelah orphaned_users = 0, lanjut deploy:
-- 1. Deploy migration (drop trigger)
-- 2. Deploy edge function (rollback-registration)
-- ============================================================================
