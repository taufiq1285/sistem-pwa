-- ============================================================================
-- DEBUG: Kelas Sudah Ada di Admin Tapi Tidak Muncul di Dropdown
-- ============================================================================
-- Issue: Admin sudah buat kelas, tapi dropdown kosong saat dosen buat tugas
-- Root Cause: Kemungkinan mata_kuliah_id tidak match atau NULL
-- ============================================================================

-- ============================================================================
-- CHECK 1: Lihat semua kelas yang ada
-- ============================================================================
SELECT 
  k.id,
  k.kode_kelas,
  k.nama_kelas,
  k.mata_kuliah_id,
  CASE 
    WHEN k.mata_kuliah_id IS NULL THEN '❌ NULL - Tidak akan muncul'
    ELSE '✅ Ada'
  END as status_mk,
  mk.kode_mk,
  mk.nama_mk,
  k.is_active,
  k.tahun_ajaran,
  k.semester_ajaran,
  k.created_at
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
ORDER BY k.is_active DESC, k.created_at DESC;

-- Expected: Semua kelas harus punya mata_kuliah_id (tidak NULL)
-- If NULL: Kelas tidak akan muncul di dropdown karena code filter by MK ID

-- ============================================================================
-- CHECK 2: Lihat mata_kuliah mana yang punya kelas
-- ============================================================================
SELECT 
  mk.id,
  mk.kode_mk,
  mk.nama_mk,
  mk.is_active,
  COUNT(k.id) as jumlah_kelas,
  STRING_AGG(k.kode_kelas || ' - ' || k.nama_kelas, ', ') as list_kelas
FROM mata_kuliah mk
LEFT JOIN kelas k ON k.mata_kuliah_id = mk.id AND k.is_active = true
WHERE mk.is_active = true
GROUP BY mk.id, mk.kode_mk, mk.nama_mk, mk.is_active
ORDER BY mk.kode_mk;

-- Expected: Setiap mata_kuliah punya minimal 1 kelas
-- If jumlah_kelas = 0: MK tersebut tidak punya kelas

-- ============================================================================
-- CHECK 3: Kelas dengan mata_kuliah_id NULL (PROBLEM!)
-- ============================================================================
SELECT 
  COUNT(*) as total_kelas_tanpa_mk,
  STRING_AGG(kode_kelas || ' - ' || nama_kelas, ', ') as list_kelas
FROM kelas
WHERE mata_kuliah_id IS NULL
  AND is_active = true;

-- If total > 0: INI MASALAHNYA! Kelas tidak punya mata_kuliah_id

-- ============================================================================
-- CHECK 4: Test Query yang Sama dengan Code
-- ============================================================================
-- Simulate query dari QuizBuilder.tsx
-- Ganti 'test-mk-id' dengan mata_kuliah_id yang dipilih dosen

DO $$
DECLARE
  test_mk_id UUID;
  kelas_count INTEGER;
BEGIN
  -- Get first mata_kuliah
  SELECT id INTO test_mk_id FROM mata_kuliah WHERE is_active = true LIMIT 1;
  
  IF test_mk_id IS NULL THEN
    RAISE NOTICE '❌ Tidak ada mata_kuliah aktif';
    RETURN;
  END IF;
  
  RAISE NOTICE '🔍 Testing with mata_kuliah_id: %', test_mk_id;
  
  -- Query yang sama dengan code
  SELECT COUNT(*) INTO kelas_count
  FROM kelas
  WHERE is_active = true
    AND mata_kuliah_id = test_mk_id;
  
  RAISE NOTICE '✅ Kelas found: %', kelas_count;
  
  IF kelas_count = 0 THEN
    RAISE WARNING '⚠️ PROBLEM: Tidak ada kelas untuk mata_kuliah ini';
    RAISE WARNING 'Solusi: Assign mata_kuliah_id ke kelas yang ada';
  ELSE
    RAISE NOTICE '✓ OK: Kelas ditemukan untuk mata_kuliah ini';
  END IF;
END $$;

-- ============================================================================
-- SOLUTION: Assign mata_kuliah_id ke kelas yang belum punya
-- ============================================================================
-- Uncomment untuk run fix

-- -- Option 1: Assign semua kelas ke mata_kuliah pertama
-- UPDATE kelas 
-- SET mata_kuliah_id = (
--   SELECT id FROM mata_kuliah WHERE is_active = true LIMIT 1
-- )
-- WHERE mata_kuliah_id IS NULL
--   AND is_active = true;

-- -- Option 2: Assign specific kelas ke specific mata_kuliah
-- UPDATE kelas 
-- SET mata_kuliah_id = 'mata-kuliah-id-here'
-- WHERE id = 'kelas-id-here';

-- ============================================================================
-- VERIFICATION: Check setelah fix
-- ============================================================================
SELECT 
  '✅ FIXED' as status,
  COUNT(*) as total_kelas,
  SUM(CASE WHEN mata_kuliah_id IS NOT NULL THEN 1 ELSE 0 END) as dengan_mk,
  SUM(CASE WHEN mata_kuliah_id IS NULL THEN 1 ELSE 0 END) as tanpa_mk
FROM kelas
WHERE is_active = true;

-- Expected setelah fix: tanpa_mk = 0
