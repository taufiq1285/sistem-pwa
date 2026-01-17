-- ============================================================================
-- FINAL DEEP DIAGNOSIS - Cari akar masalah yang sebenarnya
-- ============================================================================

-- 1. CEK SEMUA TRIGGERS DI AUTH.USERS (termasuk yang tersembunyi)
SELECT
    n.nspname as schema_name,
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    t.tgenabled as is_enabled,
    CASE t.tgtype::integer & 1
        WHEN 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END as level,
    CASE t.tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    CASE
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    END as event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth'
AND c.relname = 'users'
AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 2. DROP SEMUA TRIGGERS DI AUTH.USERS (EMERGENCY)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT t.tgname as trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth'
        AND c.relname = 'users'
        AND NOT t.tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', r.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- 3. VERIFIKASI - Pastikan tidak ada trigger tersisa
SELECT COUNT(*) as remaining_triggers
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
AND c.relname = 'users'
AND NOT t.tgisinternal;

-- 4. CEK APAKAH ADA EXTENSIONS YANG BERMASALAH
SELECT
    e.extname,
    e.extversion,
    n.nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm', 'pgjwt', 'plpgsql')
ORDER BY e.extname;

-- 5. TEST: Coba ambil user langsung dari auth.users
SELECT
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 6. CEK APAKAH USER ROLE ENUM ADA DAN VALID
SELECT
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- 7. RECREATE USER_ROLE ENUM jika rusak
DO $$
BEGIN
    -- Drop if exists
    DROP TYPE IF EXISTS user_role CASCADE;

    -- Recreate
    CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'mahasiswa', 'laboran');

    RAISE NOTICE 'user_role enum recreated';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error recreating enum: %', SQLERRM;
END $$;

-- 8. CEK APAKAH TABLE USERS PUNYA ROLE COLUMN DENGAN TIPE YANG BENAR
SELECT
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name = 'role';

-- 9. FIX: ALTER TABLE jika tipe role salah
DO $$
BEGIN
    -- Coba alter column role
    ALTER TABLE public.users
    ALTER COLUMN role TYPE user_role USING role::text::user_role;

    RAISE NOTICE 'Role column type fixed';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing role column: %', SQLERRM;
END $$;

-- 10. EMERGENCY: Hapus semua user di public.users dan buat ulang
TRUNCATE TABLE public.admin CASCADE;
TRUNCATE TABLE public.dosen CASCADE;
TRUNCATE TABLE public.mahasiswa CASCADE;
TRUNCATE TABLE public.laboran CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- Buat ulang dari auth.users
INSERT INTO public.users (id, email, full_name, role, is_active, created_at, updated_at)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)),
    'admin'::user_role,
    true,
    created_at,
    NOW()
FROM auth.users;

-- Buat admin profiles
INSERT INTO public.admin (user_id, level, permissions)
SELECT id, 'super_admin', '{}'::jsonb
FROM public.users
WHERE role = 'admin';

-- 11. FINAL VERIFICATION
SELECT
    'auth.users' as source,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT
    'public.users' as source,
    COUNT(*) as count
FROM public.users
UNION ALL
SELECT
    'public.admin' as source,
    COUNT(*) as count
FROM public.admin;
