-- ============================================================================
-- CHECK DOSEN DATA & USER MAPPING
-- ============================================================================

-- 1. Check all dosen records
SELECT
    '=== ALL DOSEN ===' as info,
    id as dosen_id,
    user_id,
    nip,
    gelar_depan,
    gelar_belakang,
    fakultas,
    program_studi,
    spesialisasi
FROM dosen
ORDER BY nip;

-- 2. Check current logged in user
SELECT
    '=== CURRENT USER ===' as info,
    id as user_id,
    email,
    full_name,
    role
FROM users
WHERE id = auth.uid();

-- 3. Check if current user has dosen record
SELECT
    '=== CURRENT USER DOSEN MAPPING ===' as info,
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    d.id as dosen_id,
    d.nip,
    d.gelar_depan,
    d.gelar_belakang,
    CASE
        WHEN d.id IS NOT NULL THEN '✅ HAS DOSEN RECORD'
        ELSE '❌ NO DOSEN RECORD'
    END as status
FROM users u
LEFT JOIN dosen d ON d.user_id = u.id
WHERE u.id = auth.uid();

-- 4. Check all users with role='dosen' and their mapping
SELECT
    '=== ALL DOSEN USERS & MAPPING ===' as info,
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    d.id as dosen_id,
    d.nip,
    CASE
        WHEN d.id IS NOT NULL THEN '✅ MAPPED'
        ELSE '❌ NOT MAPPED'
    END as mapping_status
FROM users u
LEFT JOIN dosen d ON d.user_id = u.id
WHERE u.role = 'dosen'
ORDER BY u.email;

-- 5. Test get_current_dosen_id() function
SELECT
    '=== TEST FUNCTION ===' as info,
    auth.uid() as current_user_id,
    get_current_dosen_id() as dosen_id_from_function,
    CASE
        WHEN get_current_dosen_id() IS NOT NULL THEN '✅ FUNCTION WORKS'
        ELSE '❌ RETURNS NULL'
    END as status;

-- 6. Check kelas for current dosen
SELECT
    '=== KELAS FOR CURRENT DOSEN ===' as info,
    k.id as kelas_id,
    k.nama_kelas,
    k.dosen_id,
    d.nip as dosen_nip,
    get_current_dosen_id() as my_dosen_id,
    CASE
        WHEN k.dosen_id = get_current_dosen_id() THEN '✅ MY KELAS'
        ELSE '❌ NOT MY KELAS'
    END as ownership
FROM kelas k
LEFT JOIN dosen d ON d.id = k.dosen_id
WHERE k.dosen_id = get_current_dosen_id()
ORDER BY k.nama_kelas;
