-- ============================================================================
-- FIX: Create Dosen Record for User
-- Problem: User role='dosen' tapi tidak ada data di table dosen
-- Solution: Insert record dosen untuk user ini
-- ============================================================================

-- STEP 1: Check current user info
SELECT
    '=== CURRENT USER ===' as info,
    id as user_id,
    email,
    full_name,
    role
FROM users
WHERE id = auth.uid();

-- STEP 2: Check if dosen record exists
SELECT
    '=== CHECK DOSEN RECORD ===' as info,
    d.id as dosen_id,
    d.user_id,
    d.nip,
    d.nama_lengkap
FROM dosen d
WHERE d.user_id = auth.uid();

-- Expected: Should return 1 row if dosen exists, 0 rows if not

-- STEP 3: Create dosen record (RUN THIS if STEP 2 returns no rows)
INSERT INTO dosen (
        user_id,
        nip,
        gelar_depan,
        gelar_belakang,
        fakultas,
        program_studi,
        spesialisasi
)
SELECT
        u.id,
        'NIP-' || SUBSTRING(u.id::text, 8, 8), -- Generate NIP from user_id suffix
        NULL,
        NULL,
        NULL,
        NULL,
        u.full_name -- simpan nama di kolom spesialisasi sebagai catatan
FROM users u
WHERE u.id = auth.uid()
    AND u.role = 'dosen'
    AND NOT EXISTS (
        SELECT 1 FROM dosen WHERE user_id = u.id
    );

-- STEP 4: Verify dosen record created
SELECT
    '=== VERIFY DOSEN CREATED ===' as info,
    d.id as dosen_id,
    d.user_id,
    d.nip,
    d.gelar_depan,
    d.gelar_belakang,
    d.fakultas,
    d.program_studi,
    d.spesialisasi,
    CASE
        WHEN d.id IS NOT NULL THEN '✅ DOSEN RECORD EXISTS'
        ELSE '❌ DOSEN RECORD NOT FOUND!'
    END as status
FROM dosen d
WHERE d.user_id = auth.uid();

-- STEP 5: Test functions again
SELECT
    '=== TEST FUNCTIONS AFTER FIX ===' as info,
    auth.uid() as user_id,
    get_user_role() as role,
    is_dosen() as is_dosen,
    get_current_dosen_id() as dosen_id,
    CASE
        WHEN is_dosen() AND get_current_dosen_id() IS NOT NULL THEN '✅ READY TO INSERT JADWAL'
        WHEN is_dosen() AND get_current_dosen_id() IS NULL THEN '❌ STILL NULL - CHECK DOSEN TABLE'
        ELSE '❌ NOT DOSEN'
    END as status;

-- ============================================================================
-- ALTERNATIVE: If you want to create dosen for ALL dosen users at once
-- ============================================================================

-- Create dosen records for all users with role='dosen' who don't have dosen record
INSERT INTO dosen (user_id, nip, nama_lengkap, email)
SELECT
    u.id,
        'NIP-' || SUBSTRING(u.id::text, 8, 8),
        NULL,
        NULL,
        NULL,
        NULL,
        u.full_name
FROM users u
WHERE u.role = 'dosen'
  AND NOT EXISTS (
    SELECT 1 FROM dosen WHERE user_id = u.id
  );

-- Check all dosen-role users and their dosen records
SELECT
    '=== ALL DOSEN USERS ===' as info,
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    d.id as dosen_id,
    CASE
        WHEN d.id IS NOT NULL THEN '✅ HAS DOSEN RECORD'
        ELSE '❌ MISSING DOSEN RECORD'
    END as status
FROM users u
LEFT JOIN dosen d ON d.user_id = u.id
WHERE u.role = 'dosen'
ORDER BY u.email;
