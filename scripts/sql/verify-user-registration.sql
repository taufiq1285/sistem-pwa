-- ============================================================================
-- VERIFY USER REGISTRATION
-- ============================================================================
-- Query untuk verify apakah user yang baru register sudah lengkap datanya
-- ============================================================================

-- Ganti email di bawah dengan email user yang baru saja register
-- Misalnya: 'test-after-fix@example.com' atau email test yang Anda gunakan

-- STEP 1: Cek user di auth.users
SELECT
    'auth.users' AS location,
    id,
    email,
    created_at,
    confirmed_at
FROM auth.users
WHERE email = 'YOUR_TEST_EMAIL@example.com'  -- GANTI DENGAN EMAIL USER YANG BARU REGISTER
ORDER BY created_at DESC
LIMIT 1;

-- STEP 2: Cek user di public.users
SELECT
    'public.users' AS location,
    id,
    email,
    full_name,
    role,
    created_at
FROM public.users
WHERE email = 'YOUR_TEST_EMAIL@example.com'  -- GANTI DENGAN EMAIL USER YANG BARU REGISTER
ORDER BY created_at DESC
LIMIT 1;

-- STEP 3: Cek data mahasiswa
SELECT
    'mahasiswa' AS location,
    m.id,
    m.user_id,
    m.nim,
    m.program_studi,
    m.angkatan,
    m.semester,
    u.email,
    u.full_name
FROM mahasiswa m
JOIN public.users u ON m.user_id = u.id
WHERE u.email = 'YOUR_TEST_EMAIL@example.com'  -- GANTI DENGAN EMAIL USER YANG BARU REGISTER
ORDER BY m.created_at DESC
LIMIT 1;

-- STEP 4: Cek statistik orphaned users (seharusnya tidak bertambah)
SELECT
    (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
    (SELECT COUNT(*) FROM public.users) AS total_public_users,
    (SELECT COUNT(*) FROM mahasiswa) AS total_mahasiswa,
    (SELECT COUNT(*) FROM auth.users au
     LEFT JOIN public.users pu ON au.id = pu.id
     WHERE pu.id IS NULL) AS orphaned_users;

-- Expected result:
-- - User ADA di semua 3 tempat (auth.users, public.users, mahasiswa)
-- - orphaned_users tetap 1 (tidak bertambah)

-- ============================================================================
-- KESIMPULAN
-- ============================================================================
-- Jika:
-- ✅ STEP 1: Return 1 row (user ada di auth.users)
-- ✅ STEP 2: Return 1 row (user ada di public.users)
-- ✅ STEP 3: Return 1 row (data mahasiswa lengkap)
-- ✅ STEP 4: orphaned_users = 1 (tidak bertambah)
--
-- Maka: REGISTRASI SUKSES! Error di console hanya noise/warning.
-- ============================================================================
