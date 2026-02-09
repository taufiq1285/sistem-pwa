-- ============================================================================
-- FIX: Assign Mata Kuliah ke Kelas yang Sudah Ada
-- ============================================================================
-- Purpose: Memastikan setiap kelas punya mata_kuliah_id
-- Issue: Kelas ada tapi mata_kuliah_id = NULL → tidak muncul di dropdown
-- ============================================================================

DO $$
DECLARE
  kelas_tanpa_mk INTEGER;
  mk_count INTEGER;
  first_mk_id UUID;
  updated_count INTEGER := 0;
  kelas_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 CHECKING: Kelas Tanpa Mata Kuliah';
  RAISE NOTICE '============================================================';
  
  -- ============================================================================
  -- Step 1: Count kelas without mata_kuliah_id
  -- ============================================================================
  SELECT COUNT(*) INTO kelas_tanpa_mk
  FROM kelas
  WHERE mata_kuliah_id IS NULL
    AND is_active = true;
  
  RAISE NOTICE 'Total kelas aktif tanpa mata_kuliah: %', kelas_tanpa_mk;
  
  IF kelas_tanpa_mk = 0 THEN
    RAISE NOTICE '✅ All kelas sudah punya mata_kuliah_id';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Current kelas assignments:';
    
    FOR kelas_rec IN 
      SELECT 
        k.kode_kelas || ' - ' || k.nama_kelas as kelas_info,
        mk.kode_mk || ' - ' || mk.nama_mk as mk_info
      FROM kelas k
      INNER JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
      WHERE k.is_active = true
      ORDER BY k.kode_kelas
    LOOP
      RAISE NOTICE '  ✓ %: %', kelas_rec.kelas_info, kelas_rec.mk_info;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ No action needed. Kelas sudah OK!';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ Found % kelas without mata_kuliah_id', kelas_tanpa_mk;
  
  -- ============================================================================
  -- Step 2: Check if mata_kuliah exists
  -- ============================================================================
  SELECT COUNT(*) INTO mk_count
  FROM mata_kuliah
  WHERE is_active = true;
  
  IF mk_count = 0 THEN
    RAISE EXCEPTION '❌ ERROR: Tidak ada mata_kuliah aktif. Buat mata_kuliah dulu.';
  END IF;
  
  RAISE NOTICE 'Found % active mata_kuliah', mk_count;
  
  -- ============================================================================
  -- Step 3: Get first mata_kuliah
  -- ============================================================================
  SELECT id INTO first_mk_id
  FROM mata_kuliah
  WHERE is_active = true
  ORDER BY kode_mk
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Will assign kelas to first mata_kuliah: %', first_mk_id;
  RAISE NOTICE '';
  
  -- Show which mata_kuliah will be used
  FOR kelas_rec IN
    SELECT kode_mk, nama_mk
    FROM mata_kuliah
    WHERE id = first_mk_id
  LOOP
    RAISE NOTICE '📚 Target Mata Kuliah: % - %', kelas_rec.kode_mk, kelas_rec.nama_mk;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FIXING: Assigning mata_kuliah_id to kelas...';
  RAISE NOTICE '';
  
  -- ============================================================================
  -- Step 4: Update kelas without mata_kuliah_id
  -- ============================================================================
  FOR kelas_rec IN
    SELECT id, kode_kelas, nama_kelas
    FROM kelas
    WHERE mata_kuliah_id IS NULL
      AND is_active = true
    ORDER BY kode_kelas
  LOOP
    UPDATE kelas
    SET mata_kuliah_id = first_mk_id,
        updated_at = NOW()
    WHERE id = kelas_rec.id;
    
    updated_count := updated_count + 1;
    RAISE NOTICE '  ✅ Updated: % - % → assigned to MK', kelas_rec.kode_kelas, kelas_rec.nama_kelas;
  END LOOP;
  
  -- ============================================================================
  -- Step 5: Verify fix
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ FIX COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Total kelas updated: %', updated_count;
  
  SELECT COUNT(*) INTO kelas_tanpa_mk
  FROM kelas
  WHERE mata_kuliah_id IS NULL
    AND is_active = true;
  
  RAISE NOTICE 'Remaining kelas without mata_kuliah: %', kelas_tanpa_mk;
  
  IF kelas_tanpa_mk = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS: All kelas now have mata_kuliah_id';
  ELSE
    RAISE WARNING '⚠️ Still have % kelas without mata_kuliah', kelas_tanpa_mk;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 Current kelas assignments:';
  RAISE NOTICE '';
  
  FOR kelas_rec IN 
    SELECT 
      k.kode_kelas,
      k.nama_kelas,
      mk.kode_mk,
      mk.nama_mk,
      k.tahun_ajaran,
      k.semester_ajaran
    FROM kelas k
    INNER JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
    WHERE k.is_active = true
    ORDER BY mk.kode_mk, k.kode_kelas
  LOOP
    RAISE NOTICE '  ✓ Kelas: % - %', kelas_rec.kode_kelas, kelas_rec.nama_kelas;
    RAISE NOTICE '    MK: % - %', kelas_rec.kode_mk, kelas_rec.nama_mk;
    RAISE NOTICE '    Semester: % - %', kelas_rec.semester_ajaran, kelas_rec.tahun_ajaran;
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🎯 NEXT STEPS:';
  RAISE NOTICE '1. Refresh browser di halaman Buat Tugas';
  RAISE NOTICE '2. Pilih mata kuliah';
  RAISE NOTICE '3. Dropdown kelas sekarang HARUS muncul';
  RAISE NOTICE '4. Check console log di browser untuk verifikasi';
  RAISE NOTICE '============================================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
    RAISE WARNING 'SQLSTATE: %', SQLSTATE;
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT 
  mk.kode_mk,
  mk.nama_mk,
  COUNT(k.id) as jumlah_kelas,
  STRING_AGG(k.kode_kelas || ' - ' || k.nama_kelas, ', ' ORDER BY k.kode_kelas) as list_kelas
FROM mata_kuliah mk
LEFT JOIN kelas k ON k.mata_kuliah_id = mk.id AND k.is_active = true
WHERE mk.is_active = true
GROUP BY mk.id, mk.kode_mk, mk.nama_mk
ORDER BY mk.kode_mk;
