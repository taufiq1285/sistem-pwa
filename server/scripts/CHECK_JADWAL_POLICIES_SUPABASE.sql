-- ============================================================================
-- CHECK JADWAL POLICIES & FUNCTIONS DI SUPABASE
-- Jalankan query ini untuk diagnosa masalah 403 Forbidden
-- ============================================================================

-- ==================== STEP 1: CHECK CURRENT POLICIES ====================
SELECT
    '=== CURRENT POLICIES ===' as info,
    cmd as operation,
    COUNT(*) as count,
    string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
GROUP BY cmd
ORDER BY cmd;

-- Expected Result:
-- DELETE | 3 policies
-- INSERT | 3 policies  <-- Ini yang penting untuk fix 403 error
-- SELECT | 4 policies
-- UPDATE | 3 policies

-- ==================== STEP 2: CHECK TOTAL POLICIES ====================
SELECT
    '=== TOTAL POLICIES ===' as info,
    COUNT(*) as total_policies,
    CASE
        WHEN COUNT(*) = 12 THEN '✅ CORRECT (12 policies)'
        WHEN COUNT(*) > 12 THEN '⚠️ TOO MANY - ADA DUPLIKASI!'
        WHEN COUNT(*) < 12 THEN '❌ KURANG - POLICIES HILANG!'
    END as status
FROM pg_policies
WHERE tablename = 'jadwal_praktikum';

-- ==================== STEP 3: CHECK INSERT POLICIES DETAIL ====================
SELECT
    '=== INSERT POLICIES DETAIL ===' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- ==================== STEP 4: CHECK HELPER FUNCTIONS ====================
SELECT
    '=== CHECK FUNCTIONS ===' as info,
    proname as function_name,
    CASE
        WHEN proname = 'is_dosen' THEN '✅ EXISTS'
        WHEN proname = 'get_current_dosen_id' THEN '✅ EXISTS'
        WHEN proname = 'is_admin' THEN '✅ EXISTS'
        WHEN proname = 'is_laboran' THEN '✅ EXISTS'
        WHEN proname = 'get_user_role' THEN '✅ EXISTS'
    END as status
FROM pg_proc
WHERE proname IN ('is_dosen', 'get_current_dosen_id', 'is_admin', 'is_laboran', 'get_user_role')
ORDER BY proname;

-- Expected: Semua 5 functions harus ada

-- ==================== STEP 5: TEST USER INFO ====================
-- Jalankan saat login sebagai DOSEN
SELECT
    '=== USER INFO (RUN AS DOSEN) ===' as info,
    auth.uid() as user_id,
    u.email,
    u.role,
    get_user_role() as role_from_function,
    is_dosen() as is_dosen_check,
    get_current_dosen_id() as dosen_id
FROM users u
WHERE u.id = auth.uid();

-- Expected untuk dosen:
-- role = 'dosen'
-- is_dosen_check = true
-- dosen_id = (ada value, bukan null)

-- ==================== STEP 6: CHECK DOSEN KELAS ====================
-- Jalankan saat login sebagai DOSEN
SELECT
    '=== DOSEN KELAS (RUN AS DOSEN) ===' as info,
    k.id,
    k.nama_kelas,
    k.dosen_id,
    get_current_dosen_id() as my_dosen_id,
    CASE 
        WHEN k.dosen_id = get_current_dosen_id() THEN '✅ CAN INSERT JADWAL'
        ELSE '❌ CANNOT INSERT JADWAL'
    END as permission
FROM kelas k
WHERE k.dosen_id = get_current_dosen_id()
ORDER BY k.nama_kelas;

-- ==================== STEP 7: CHECK DUPLICATE POLICIES ====================
SELECT
    '=== CHECK DUPLICATES ===' as info,
    policyname,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 1 THEN '❌ DUPLIKAT!'
        ELSE '✅ OK'
    END as status
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
GROUP BY policyname
HAVING COUNT(*) > 1;

-- Expected: No rows (tidak ada duplikat)

-- ==================== STEP 8: CHECK RLS ENABLED ====================
SELECT
    '=== CHECK RLS STATUS ===' as info,
    tablename,
    rowsecurity as rls_enabled,
    CASE
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED!'
    END as status
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';

-- Expected: rls_enabled = true

-- ==================== STEP 9: TEST INSERT PERMISSION ====================
-- Test apakah policy membolehkan insert
-- Jalankan saat login sebagai DOSEN
EXPLAIN (COSTS OFF)
INSERT INTO jadwal_praktikum (
    kelas_id,
    laboratorium_id,
    hari,
    jam_mulai,
    jam_selesai,
    is_active
)
SELECT
    k.id,
    (SELECT id FROM laboratorium LIMIT 1),
    'senin'::day_of_week,
    '08:00'::time,
    '10:00'::time,
    false
FROM kelas k
WHERE k.dosen_id = get_current_dosen_id()
LIMIT 1;

-- ============================================================================
-- HASIL YANG DIHARAPKAN
-- ============================================================================
-- ✅ Total policies = 12
-- ✅ INSERT policies = 3 (admin, laboran, dosen)
-- ✅ Semua functions exist
-- ✅ Dosen punya dosen_id (tidak null)
-- ✅ Dosen bisa lihat kelas mereka
-- ✅ Tidak ada duplikat policies
-- ✅ RLS enabled
-- ============================================================================
