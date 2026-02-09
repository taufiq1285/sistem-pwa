-- ============================================================================
-- DEBUG QUERY: Check why mahasiswa sees no jadwal for logbook creation
-- ============================================================================
-- This query helps diagnose the issue where "Buat Logbook Baru" tab shows nothing

-- 1. CHECK: Get your mahasiswa_id first
-- SELECT id, nama, user_id FROM mahasiswa WHERE user_id = auth.uid();

-- 2. CHECK: What kelas is this mahasiswa enrolled in?
-- Replace 'YOUR_MAHASISWA_ID' with actual UUID from step 1
SELECT
    km.mahasiswa_id,
    km.kelas_id,
    k.nama_kelas,
    mk.nama_mk
FROM kelas_mahasiswa km
JOIN kelas k ON km.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE km.mahasiswa_id = 'YOUR_MAHASISWA_ID';  -- ← REPLACE THIS

-- 3. CHECK: What jadwal exist for those kelas?
-- Replace 'YOUR_KELAS_ID' with actual UUID from step 2
SELECT
    jp.id,
    jp.kelas_id,
    jp.tanggal_praktikum,
    jp.topik,
    jp.is_active,
    jp.status,
    l.nama_lab
FROM jadwal_praktikum jp
JOIN laboratorium l ON jp.laboratorium_id = l.id
WHERE jp.kelas_id = 'YOUR_KELAS_ID'  -- ← REPLACE THIS
AND jp.is_active = true
ORDER BY jp.tanggal_praktikum ASC;

-- 4. CHECK: Does mahasiswa already have logbooks for these jadwal?
-- Replace 'YOUR_MAHASISWA_ID' with actual UUID
SELECT
    le.id,
    le.jadwal_id,
    le.mahasiswa_id,
    le.status,
    jp.topik,
    jp.tanggal_praktikum
FROM logbook_entries le
JOIN jadwal_praktikum jp ON le.jadwal_id = jp.id
WHERE le.mahasiswa_id = 'YOUR_MAHASISWA_ID'  -- ← REPLACE THIS
ORDER BY jp.tanggal_praktikum DESC;

-- 5. CHECK: What jadwal DON'T have logbooks yet (for "Buat Logbook Baru")?
-- This is what should appear in the "Buat Logbook Baru" tab
SELECT
    jp.id,
    jp.kelas_id,
    jp.tanggal_praktikum,
    jp.topik,
    l.nama_lab,
    k.nama_kelas
FROM jadwal_praktikum jp
JOIN laboratorium l ON jp.laboratorium_id = l.id
JOIN kelas k ON jp.kelas_id = k.id
JOIN kelas_mahasiswa km ON jp.kelas_id = km.kelas_id
WHERE km.mahasiswa_id = 'YOUR_MAHASISWA_ID'  -- ← REPLACE THIS
AND jp.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM logbook_entries le
    WHERE le.jadwal_id = jp.id
    AND le.mahasiswa_id = 'YOUR_MAHASISWA_ID'
)
ORDER BY jp.tanggal_praktikum ASC;

-- 6. DIAGNOSTIC: Count records
SELECT
    (SELECT COUNT(*) FROM kelas_mahasiswa WHERE mahasiswa_id = 'YOUR_MAHASISWA_ID') as enrolled_kelas_count,
    (SELECT COUNT(*) FROM jadwal_praktikum WHERE is_active = true) as total_active_jadwal,
    (SELECT COUNT(*) FROM logbook_entries WHERE mahasiswa_id = 'YOUR_MAHASISWA_ID') as total_logbooks;
