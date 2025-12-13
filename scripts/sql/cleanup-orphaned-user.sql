-- ============================================================================
-- CLEANUP ORPHANED USER
-- ============================================================================
-- Script untuk menghapus orphaned user (user yang gagal registrasi)
-- ============================================================================

-- STEP 1: Lihat detail orphaned user terlebih dahulu
-- ============================================================================
SELECT
    au.id,
    au.email,
    au.created_at,
    au.confirmed_at,
    au.raw_user_meta_data->>'full_name' AS full_name,
    au.raw_user_meta_data->>'role' AS intended_role,
    au.raw_user_meta_data->>'nim' AS nim,
    au.raw_user_meta_data->>'nip' AS nip
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Expected: Return 1 row (orphaned user)
-- COPY USER ID dari hasil query untuk digunakan di step berikutnya

-- ============================================================================
-- STEP 2: Verifikasi tidak ada data di tabel role-specific
-- ============================================================================
-- Ganti 'USER_ID_DARI_STEP_1' dengan ID yang didapat dari query di atas

/*
-- Check mahasiswa
SELECT * FROM mahasiswa WHERE user_id = 'USER_ID_DARI_STEP_1';

-- Check dosen
SELECT * FROM dosen WHERE user_id = 'USER_ID_DARI_STEP_1';

-- Check laboran
SELECT * FROM laboran WHERE user_id = 'USER_ID_DARI_STEP_1';

-- Check admin
SELECT * FROM admin WHERE user_id = 'USER_ID_DARI_STEP_1';
*/

-- Expected: Semua return 0 rows (karena registrasi gagal)

-- ============================================================================
-- STEP 3: Hapus dari public.users (jika ada)
-- ============================================================================

/*
DELETE FROM public.users
WHERE id = 'USER_ID_DARI_STEP_1';
*/

-- ============================================================================
-- STEP 4: Hapus dari auth.users
-- ============================================================================
-- ⚠️ IMPORTANT: Delete dari auth.users tidak bisa dilakukan via SQL biasa
-- Harus menggunakan salah satu cara berikut:

-- CARA 1: Via Supabase Dashboard (RECOMMENDED)
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Cari email orphaned user
-- 3. Klik "..." > "Delete User"

-- CARA 2: Via Edge Function (jika sudah deployed)
-- Gunakan edge function delete-auth-user dengan curl:
/*
curl -X POST \
  https://lqkzhrdhrbexdtrgmogd.supabase.co/functions/v1/delete-auth-user \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID_DARI_STEP_1"}'
*/

-- ============================================================================
-- STEP 5: Verifikasi cleanup berhasil
-- ============================================================================

-- Cek total users setelah cleanup
SELECT
    (SELECT COUNT(*) FROM auth.users) AS auth_users,
    (SELECT COUNT(*) FROM public.users) AS public_users,
    (SELECT COUNT(*) FROM auth.users au
     LEFT JOIN public.users pu ON au.id = pu.id
     WHERE pu.id IS NULL) AS orphaned_users;

-- Expected setelah cleanup:
-- auth_users: 2 (berkurang 1 dari sebelumnya 3)
-- public_users: 2 (tetap)
-- orphaned_users: 0 (sudah bersih!)

-- ============================================================================
-- NOTES
-- ============================================================================
-- Setelah cleanup berhasil dan orphaned_users = 0, Anda siap untuk:
-- 1. Deploy migration (drop trigger)
-- 2. Deploy edge function (rollback-registration)
-- 3. Test registrasi dengan NIM duplicate
-- 4. Verifikasi user tidak masuk ke auth.users lagi
-- ============================================================================
