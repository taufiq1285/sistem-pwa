-- Manual Test: Conflict Detection untuk Jadwal Praktikum
-- Jalankan query ini di Supabase SQL Editor untuk testing manual

-- ==========================================
-- STEP 1: Bersihkan data test yang lama
-- ==========================================
DELETE FROM jadwal_praktikum
WHERE topik LIKE '%Test Conflict%' OR topik LIKE '%Testing%';

-- ==========================================
-- STEP 2: Cek ID yang tersedia
-- ==========================================
-- Jalankan query ini untuk mendapatkan ID yang valid, lalu UPDATE di query STEP 3

-- Cek Dosen (dengan relasi ke users)
SELECT
  d.id,
  u.full_name,
  d.nidn
FROM dosen d
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.created_at DESC
LIMIT 5;

-- Cek Kelas
SELECT
  id,
  nama_kelas,
  kode_kelas
FROM kelas
ORDER BY created_at DESC
LIMIT 5;

-- Cek Laboratorium
SELECT
  id,
  nama_lab,
  kode_lab
FROM laboratorium
ORDER BY created_at DESC
LIMIT 5;

-- ==========================================
-- STEP 3: Insert Test Data
-- ==========================================
-- GANTI UUID di bawah dengan ID yang valid dari STEP 2!

-- Test Case 1: Dosen A booking Lab X jam 08:00-10:00 (status: pending)
INSERT INTO jadwal_praktikum (
  id,
  dosen_id,
  kelas_id,
  laboratorium_id,
  topik,
  deskripsi,
  tanggal_praktikum,
  jam_mulai,
  jam_selesai,
  hari,
  status,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'PASTE_DOSEN_ID_1_DISINI',      -- ← Ganti dengan dosen_id valid
  'PASTE_KELAS_ID_DISINI',         -- ← Ganti dengan kelas_id valid
  'PASTE_LAB_ID_DISINI',           -- ← Ganti dengan lab_id valid
  'Test Conflict - Dosen A (08:00-10:00)',
  'Skenario: Dosen A pertama booking lab',
  '2026-02-20',
  '08:00',
  '10:00',
  'kamis',
  'pending',                       -- Status pending (belum di-approve)
  true,
  NOW(),
  NOW()
);

-- Test Case 2: Dosen A booking jam 13:00-15:00 (status: approved)
INSERT INTO jadwal_praktikum (
  id,
  dosen_id,
  kelas_id,
  laboratorium_id,
  topik,
  deskripsi,
  tanggal_praktikum,
  jam_mulai,
  jam_selesai,
  hari,
  status,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'PASTE_DOSEN_ID_1_DISINI',      -- ← Dosen yang sama
  'PASTE_KELAS_ID_DISINI',
  'PASTE_LAB_ID_DISINI',          -- ← Lab yang sama
  'Test Conflict - Dosen A (13:00-15:00) APPROVED',
  'Skenario: Dosen A booking jam 13:00-15:00 (approved)',
  '2026-02-20',
  '13:00',
  '15:00',
  'kamis',
  'approved',                     -- Status approved (sudah di-approve)
  true,
  NOW(),
  NOW()
);

-- ==========================================
-- STEP 4: Verifikasi Data Test
-- ==========================================
SELECT
  jp.id,
  jp.topik,
  jp.tanggal_praktikum,
  jp.jam_mulai,
  jp.jam_selesai,
  jp.status,
  d.nama as dosen_nama,
  l.nama as lab_nama
FROM jadwal_praktikum jp
LEFT JOIN dosen d ON jp.dosen_id = d.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
WHERE jp.topik LIKE '%Test Conflict%'
ORDER BY jp.jam_mulai;

-- ==========================================
-- STEP 5: Test Conflict Detection Query
-- ==========================================
-- Ini adalah query yang sama dengan checkJadwalConflictByDate di jadwal.api.ts
-- Ganti parameter di bawah untuk testing:

-- Test 1: Cek overlap dengan jam 08:00-10:00 (pending) → HARUS ADA CONFLICT
SELECT COUNT(*) as conflict_count
FROM jadwal_praktikum
WHERE laboratorium_id = 'PASTE_LAB_ID_DISINI'  -- ← Ganti lab_id
  AND tanggal_praktikum = '2026-02-20'          -- Tanggal yang sama
  AND is_active = true
  AND status IN ('pending', 'approved')         -- ← FIX: Check BOTH pending AND approved
  AND (
    -- Overlap logic: (StartA < EndB) AND (EndA > StartB)
    (jam_mulai < '10:00' AND jam_selesai > '08:00')  -- Cek overlap dengan 08:00-10:00
  );

-- Test 2: Cek overlap dengan jam 09:00-11:00 (partial overlap) → HARUS ADA CONFLICT
SELECT COUNT(*) as conflict_count
FROM jadwal_praktikum
WHERE laboratorium_id = 'PASTE_LAB_ID_DISINI'  -- ← Ganti lab_id
  AND tanggal_praktikum = '2026-02-20'          -- Tanggal yang sama
  AND is_active = true
  AND status IN ('pending', 'approved')
  AND (
    (jam_mulai < '11:00' AND jam_selesai > '09:00')  -- Cek overlap dengan 09:00-11:00
  );

-- Test 3: Cek overlap dengan jam 10:00-12:00 (tidak overlap) → TIDAK ADA CONFLICT
SELECT COUNT(*) as conflict_count
FROM jadwal_praktikum
WHERE laboratorium_id = 'PASTE_LAB_ID_DISINI'  -- ← Ganti lab_id
  AND tanggal_praktikum = '2026-02-20'          -- Tanggal yang sama
  AND is_active = true
  AND status IN ('pending', 'approved')
  AND (
    (jam_mulai < '12:00' AND jam_selesai > '10:00')  -- Cek overlap dengan 10:00-12:00
  );

-- Test 4: Cek overlap dengan jam 13:00-15:00 (approved) → HARUS ADA CONFLICT
SELECT COUNT(*) as conflict_count
FROM jadwal_praktikum
WHERE laboratorium_id = 'PASTE_LAB_ID_DISINI'  -- ← Ganti lab_id
  AND tanggal_praktikum = '2026-02-20'          -- Tanggal yang sama
  AND is_active = true
  AND status IN ('pending', 'approved')
  AND (
    (jam_mulai < '15:00' AND jam_selesai > '13:00')  -- Cek overlap dengan 13:00-15:00
  );

-- ==========================================
-- EXPECTED RESULTS:
-- ==========================================
-- Test 1 (08:00-10:00): conflict_count = 1 (bentrok dengan pending jadwal)
-- Test 2 (09:00-11:00): conflict_count = 1 (bentrok sebagian dengan pending jadwal)
-- Test 3 (10:00-12:00): conflict_count = 0 (TIDAK bentrok)
-- Test 4 (13:00-15:00): conflict_count = 1 (bentrok dengan approved jadwal)

-- Jika Test 1 dan Test 4 mengembalikan 0, berarti BUG:
-- Kemungkinan hanya mengecek status='approved', mengabaikan status='pending'

-- ==========================================
-- CLEANUP: Hapus data test setelah selesai
-- ==========================================
-- DELETE FROM jadwal_praktikum
-- WHERE topik LIKE '%Test Conflict%';
