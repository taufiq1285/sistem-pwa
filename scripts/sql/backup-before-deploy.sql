-- ============================================================================
-- BACKUP SCRIPT SEBELUM DEPLOY FIX REGISTRATION
-- ============================================================================
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- untuk backup data sebelum deploy perubahan
-- ============================================================================

-- 1. CHECK: Lihat trigger yang akan dihapus
SELECT
    tgname AS trigger_name,
    tgenabled AS is_enabled,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Expected result: Harusnya ada 1 row (trigger ini akan dihapus)

-- 2. BACKUP: Count users di auth vs public.users
SELECT
    'auth.users' AS table_name,
    COUNT(*) AS total_users
FROM auth.users

UNION ALL

SELECT
    'public.users' AS table_name,
    COUNT(*) AS total_users
FROM public.users;

-- Expected: Jumlah harusnya sama atau auth.users sedikit lebih banyak
-- Jika auth.users jauh lebih banyak, berarti banyak orphaned users

-- 3. BACKUP: Cek orphaned users (user di auth tapi tidak di public)
SELECT
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data->>'role' AS intended_role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- Expected: Ini adalah user-user yang registrasi gagal tapi tetap masuk auth
-- Setelah fix, jumlah orphaned users harusnya berkurang drastis

-- 4. BACKUP: Export orphaned users untuk dokumentasi
-- Copy hasil query ini dan save sebagai CSV/Excel
SELECT
    au.id AS user_id,
    au.email,
    au.created_at,
    au.raw_user_meta_data->>'full_name' AS full_name,
    au.raw_user_meta_data->>'role' AS role,
    au.raw_user_meta_data->>'nim' AS nim,
    au.raw_user_meta_data->>'nip' AS nip,
    'ORPHANED - No profile in public.users' AS status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- 5. BACKUP: Simpan statistik sebelum deploy
SELECT
    (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
    (SELECT COUNT(*) FROM public.users) AS total_public_users,
    (SELECT COUNT(*) FROM mahasiswa) AS total_mahasiswa,
    (SELECT COUNT(*) FROM dosen) AS total_dosen,
    (SELECT COUNT(*) FROM laboran) AS total_laboran,
    (SELECT COUNT(*) FROM admin) AS total_admin,
    (SELECT COUNT(*) FROM auth.users au
     LEFT JOIN public.users pu ON au.id = pu.id
     WHERE pu.id IS NULL) AS orphaned_users,
    NOW() AS backup_timestamp;

-- ============================================================================
-- REKOMENDASI CLEANUP (OPTIONAL)
-- ============================================================================
-- Jika ada banyak orphaned users, Anda bisa cleanup sebelum deploy:

-- DANGER: Ini akan menghapus orphaned users!
-- Uncomment dan jalankan HANYA jika Anda yakin ingin cleanup:

/*
DO $$
DECLARE
    orphaned_user RECORD;
    deleted_count INTEGER := 0;
BEGIN
    FOR orphaned_user IN
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        -- Delete from auth.users (requires admin privileges)
        -- Note: Ini hanya bisa dijalankan jika Anda punya service role access
        RAISE NOTICE 'Would delete orphaned user: % (%)', orphaned_user.email, orphaned_user.id;
        deleted_count := deleted_count + 1;
    END LOOP;

    RAISE NOTICE 'Total orphaned users found: %', deleted_count;
    RAISE NOTICE 'Run the actual deletion via Supabase Dashboard or API';
END $$;
*/

-- ============================================================================
-- SAVE HASIL BACKUP
-- ============================================================================
-- 1. Copy semua hasil query di atas
-- 2. Save ke file Excel/Google Sheets dengan timestamp
-- 3. Simpan sebagai dokumentasi "before deploy"
-- ============================================================================
