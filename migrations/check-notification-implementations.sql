-- ==========================================
-- VERIFIKASI NOTIFIKASI YANG SUDAH ADA DI KODE
-- ==========================================
-- Script ini untuk cek notifikasi mana yang sudah diimplementasikan
-- dan mana yang perlu ditambahkan

-- ==========================================
-- 1. CEK IMPLEMENTASI NOTIFIKASI DI KODE
-- ==========================================

-- Notifikasi yang SUDAH ada (dari notification.api.ts):
SELECT '========== NOTIFIKASI SUDAH ADA ==========' as info;

SELECT
  '1. notifyDosenTugasSubmitted' as function_name,
  'Dosen dapat notifikasi saat mahasiswa submit tugas' as description,
  '✅ ADA' as status
UNION ALL
SELECT
  '2. notifyMahasiswaTugasBaru',
  'Mahasiswa dapat notifikasi saat tugas baru dibuat',
  '✅ ADA'
UNION ALL
SELECT
  '3. notifyMahasiswaTugasGraded',
  'Mahasiswa dapat notifikasi saat tugas dinilai',
  '✅ ADA'
UNION ALL
SELECT
  '4. notifyMahasiswaDosenChanged',
  'Mahasiswa dapat notifikasi saat dosen berubah',
  '✅ ADA'
UNION ALL
SELECT
  '5. notifyDosenNewAssignment',
  'Dosen dapat notifikasi saat dapat penugasan baru',
  '✅ ADA'
UNION ALL
SELECT
  '6. notifyDosenRemoval',
  'Dosen dapat notifikasi saat digantikan dosen lain',
  '✅ ADA';

-- ==========================================
-- 2. CEK APAKAH FUNGSI-FUNGSI INI DIPANGGIL
-- ==========================================

SELECT '========== NEED MANUAL CODE CHECK ==========' as info;

SELECT
  'File yang perlu dicek:' as info,
  'ManajemenAssignmentPage.tsx' as file_1,
  'JadwalPage.tsx (dosen)' as file_2,
  'JadwalApprovalPage.tsx (laboran)' as file_3,
  'KuisCreatePage.tsx' as file_4,
  'KuisBuilderPage.tsx' as file_5,
  'PeminjamanPage.tsx' as file_6,
  'PeminjamanApprovalPage.tsx' as file_7,
  'LogbookPage.tsx' as file_8,
  'LogbookReviewPage.tsx' as file_9;

-- ==========================================
-- 3. TEST NOTIFIKASI YANG SUDAH ADA
-- ==========================================

-- Test 1: Simulasikan notifikasi saat assignment diupdate
SELECT '========== TEST NOTIFIKASI YANG SUDAH ADA ==========' as info;

-- Test notifyMahasiswaTugasBaru
-- (Kirim ke Arni sebagai test)
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  u.id,
  '🧪 Test: Kuis Baru Dibuat',
  'Dr. Alfih telah membuat kuis baru: "Test Kuis dari Sistem"',
  'tugas_baru',
  '{"source": "code_test", "feature": "notifyMahasiswaTugasBaru", "dosen": "Alfih", "kuis": "Test Kuis"}'::jsonb
FROM users u
WHERE u.email = 'test@arni.com'
RETURNING
  'Test 1: notifyMahasiswaTugasBaru' as test_name,
  id,
  created_at;

-- Test notifyMahasiswaTugasGraded
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  u.id,
  '🧪 Test: Tugas Dinilai',
  'Tugas "Test Kuis" Anda telah dinilai. Nilai: 85',
  'tugas_graded',
  '{"source": "code_test", "feature": "notifyMahasiswaTugasGraded", "nilai": 85}'::jsonb
FROM users u
WHERE u.email = 'test@arni.com'
RETURNING
  'Test 2: notifyMahasiswaTugasGraded' as test_name,
  id,
  created_at;

-- Test notifyDosenNewAssignment
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  u.id,
  '🧪 Test: Penugasan Baru',
  'Anda ditugaskan mengajar "Pemrograman Web - A" (30 mahasiswa)',
  'dosen_changed',
  '{"source": "code_test", "feature": "notifyDosenNewAssignment", "kelas": "A", "jumlah_mahasiswa": 30}'::jsonb
FROM users u
WHERE u.email = 'alfiah@dosen.com'
RETURNING
  'Test 3: notifyDosenNewAssignment' as test_name,
  id,
  created_at;

-- Test notifyMahasiswaDosenChanged
-- Kirim ke Arni
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  data
)
SELECT
  u.id,
  '🧪 Test: Perubahan Dosen',
  'Kelas "Test MK - Test Kelas" sekarang diampu oleh Dr. Alfih (menggantikan Dr. Test)',
  'dosen_changed',
  '{"source": "code_test", "feature": "notifyMahasiswaDosenChanged", "dosen_lama": "Dr. Test", "dosen_baru": "Dr. Alfih"}'::jsonb
FROM users u
WHERE u.email = 'test@arni.com'
RETURNING
  'Test 4: notifyMahasiswaDosenChanged' as test_name,
  id,
  created_at;

-- ==========================================
-- 4. VERIFIKASI HASIL TEST
-- ==========================================

SELECT '========== VERIFIKASI TEST ==========' as info;

-- Total notifikasi per user
SELECT
  u.email,
  u.role,
  COUNT(*) as notification_count,
  STRING_AGG(n.type, ', ') as notification_types
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.type LIKE 'tugas_%' OR n.type = 'dosen_changed'
GROUP BY u.email, u.role
ORDER BY u.role;

-- Detail notifikasi test
SELECT
  n.id,
  u.full_name,
  u.role,
  n.title,
  n.type,
  n.data->>'feature' as feature_tested,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.type LIKE 'tugas_%' OR n.type = 'dosen_changed'
ORDER BY n.created_at DESC;

-- ==========================================
-- 5. SUMMARY
-- ==========================================

SELECT '========== SUMMARY ==========' as info;

SELECT
  'Notifikasi sudah diimplementasikan' as category,
  '✅ 6 notifikasi dasar' as count
UNION ALL
SELECT
  'Perlu ditambahkan (HIGH PRIORITY)',
  'Jadwal notif, Logbook notif, Peminjaman notif'
UNION ALL
SELECT
  'Status RLS Policies',
  '✅ Harus sudah fix setelah menjalankan fix-app-notifications.sql'
UNION ALL
SELECT
  'Next Step',
  'Cek implementasi di kode untuk setiap fitur';

-- Manual testing instructions
SELECT
  '1. Jalankan fix-app-notifications.sql dulu' as step_1,
  '2. Test login sebagai Arni (test@arni.com)' as step_2,
  '3. Cek lonceng notifikasi di header' as step_3,
  '4. Harus ada 3 test notifikasi' as step_4,
  '5. Test login sebagai Alfih (alfiah@dosen.com)' as step_5,
  '6. Harus ada 1 test notifikasi' as step_6;
