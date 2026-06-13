-- ============================================================================
-- EMERGENCY FIX - Matikan trigger yang bermasalah
-- ============================================================================

-- STEP 1: DROP TRIGGER yang mungkin rusak
-- Ini akan SEMENTARA matikan auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- SEKARANG COBA LOGIN! Jika berhasil, trigger-nya yang bermasalah
-- ============================================================================

-- STEP 2: Cek apakah enum user_role ada dan valid
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'mahasiswa', 'laboran');
        RAISE NOTICE 'user_role enum created';
    ELSE
        RAISE NOTICE 'user_role enum already exists';
    END IF;
END
$$;

-- STEP 3: Cek extensions
SELECT
    extname,
    extversion,
    CASE WHEN extname IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');

-- STEP 4: Install extensions jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- STEP 5: Verifikasi auth.users bisa di-query
SELECT COUNT(*) as total_users FROM auth.users;

-- STEP 6: Cek apakah ada user di auth.users
SELECT
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data->>'role' as role_metadata
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- STEP 7: Buat profile untuk semua user yang belum punya
INSERT INTO public.users (id, email, full_name, role, is_active, created_at, updated_at)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1), 'User'),
    CASE
        WHEN au.email LIKE '%admin%' THEN 'admin'::user_role
        ELSE COALESCE((au.raw_user_meta_data->>'role')::user_role, 'mahasiswa'::user_role)
    END,
    true,
    au.created_at,
    NOW()
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- STEP 8: Buat admin profile
INSERT INTO public.admin (user_id, level, permissions)
SELECT u.id, 'admin', '{}'::jsonb
FROM public.users u
WHERE u.role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- STEP 9: Verifikasi semua user punya profile
SELECT
    au.email,
    pu.role,
    pu.full_name,
    CASE WHEN pu.id IS NOT NULL THEN '✅ Profile exists' ELSE '❌ NO PROFILE' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- ============================================================================
-- COBA LOGIN LAGI SEKARANG!
-- Jika sudah berhasil, trigger yang lama memang bermasalah
-- ============================================================================

-- STEP 10: Buat ulang function handle_new_user yang LEBIH AMAN
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert dengan error handling yang ketat
    INSERT INTO public.users (id, email, full_name, role, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'mahasiswa'::user_role),
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Jangan block auth jika profile creation gagal
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 11: Buat ulang trigger (OPSIONAL - hanya jika login sudah berhasil)
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION public.handle_new_user();
