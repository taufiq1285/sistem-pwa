-- ============================================================================
-- DEBUG AUTH ERROR - Cari penyebab "Database error querying schema"
-- ============================================================================

-- STEP 1: Cek semua triggers yang ada di auth.users
-- Ini bisa jadi penyebabnya!
-- ============================================================================
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
ORDER BY trigger_name;

-- ============================================================================
-- STEP 2: Cek apakah trigger on_auth_user_created masih berfungsi
-- ============================================================================
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';

-- ============================================================================
-- STEP 3: Cek apakah ada NIDN column yang bermasalah
-- ============================================================================
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'dosen'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 4: Cek apakah users table punya semua column yang diperlukan
-- ============================================================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 5: Test manual login simulation
-- Cek apakah kita bisa query user dari auth.users
-- ============================================================================
SELECT
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users
LIMIT 5;

-- ============================================================================
-- STEP 6: DISABLE trigger sementara untuk test
-- HATI-HATI! Ini akan disable auto-create user profile
-- Jalankan ini HANYA untuk testing
-- ============================================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- STEP 7: Cek apakah ada function yang error
-- ============================================================================
SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- ============================================================================
-- STEP 8: FIX - Recreate handle_new_user function dengan error handling
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
  user_role_text TEXT;
  user_role_enum user_role;
BEGIN
  -- Log untuk debugging
  RAISE NOTICE 'handle_new_user triggered for user: %', NEW.email;

  -- Extract full_name from metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1),
    'Unknown User'
  );

  -- Extract role from metadata
  user_role_text := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'mahasiswa'
  );

  RAISE NOTICE 'Extracted role: %', user_role_text;

  -- Validate and cast role
  BEGIN
    user_role_enum := user_role_text::user_role;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Invalid role: %, defaulting to mahasiswa', user_role_text;
      user_role_enum := 'mahasiswa'::user_role;
  END;

  -- Insert into public.users
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_role_enum,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'User profile created successfully';

  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'Profile already exists, skipping';
      NULL;
    WHEN OTHERS THEN
      -- PENTING: Jangan fail auth jika profile creation gagal
      RAISE WARNING 'Error creating user profile: %. SQLERRM: %', SQLSTATE, SQLERRM;
      -- Return NEW tetap, jangan block auth
  END;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 9: Recreate trigger
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- STEP 10: Test dengan user yang sudah ada
-- ============================================================================
SELECT
    au.id,
    au.email,
    au.raw_user_meta_data->>'role' as metadata_role,
    pu.role as profile_role,
    CASE
        WHEN pu.id IS NULL THEN '❌ NO PROFILE'
        ELSE '✅ OK'
    END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;
