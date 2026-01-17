-- ============================================================================
-- MIGRATION: Auto-create mahasiswa entry untuk dosen saat membuat peminjaman
-- ============================================================================
--
-- TUJUAN: Fix foreign key constraint pada peminjaman.peminjam_id
-- PROBLEM: Dosen tidak ada di tabel mahasiswa, tapi peminjaman.peminjam_id
--          harus reference ke mahasiswa.id
--
-- SOLUSI: Buat TRIGGER yang otomatis create mahasiswa entry saat dosen
--         membuat peminjaman
-- ============================================================================

-- Step 1: Create or replace function
CREATE OR REPLACE FUNCTION auto_create_mahasiswa_for_dosen()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if peminjam_id (dosen_id) exists in mahasiswa table
  IF NOT EXISTS (
    SELECT 1 FROM mahasiswa WHERE id = NEW.peminjam_id
  ) THEN
    -- Create placeholder mahasiswa entry for the dosen
    INSERT INTO mahasiswa (
      id,
      user_id,
      nim,
      angkatan,
      program_studi,
      created_at
    ) VALUES (
      NEW.peminjam_id,
      (SELECT user_id FROM dosen WHERE id = NEW.peminjam_id),
      'DOSEN-' || NEW.peminjam_id::text,
      EXTRACT(YEAR FROM NOW())::int,
      'Dosen - Peminjam Alat',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Ignore if already exists
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS peminjaman_auto_mahasiswa_trigger ON peminjaman;

-- Step 3: Create trigger on peminjaman INSERT
CREATE TRIGGER peminjaman_auto_mahasiswa_trigger
BEFORE INSERT ON peminjaman
FOR EACH ROW
EXECUTE FUNCTION auto_create_mahasiswa_for_dosen();

-- Step 4: Verify trigger was created
-- SELECT trigger_name, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'peminjaman_auto_mahasiswa_trigger';

-- ============================================================================
-- ALTERNATIVE: If trigger approach doesn't work, use this RPC function
-- ============================================================================
-- Uncomment if needed:

-- CREATE OR REPLACE FUNCTION create_borrowing_request(
--   p_inventaris_id UUID,
--   p_peminjam_id UUID,
--   p_dosen_id UUID,
--   p_jumlah_pinjam INT,
--   p_keperluan TEXT,
--   p_tanggal_pinjam DATE,
--   p_tanggal_kembali_rencana DATE
-- )
-- RETURNS TABLE (id UUID) AS $$
-- DECLARE
--   v_mahasiswa_exists BOOLEAN;
--   v_result UUID;
-- BEGIN
--   -- Check and create mahasiswa if not exists
--   SELECT EXISTS(SELECT 1 FROM mahasiswa WHERE id = p_peminjam_id)
--   INTO v_mahasiswa_exists;
--
--   IF NOT v_mahasiswa_exists THEN
--     INSERT INTO mahasiswa (
--       id, user_id, nim, angkatan, program_studi
--     ) VALUES (
--       p_peminjam_id,
--       (SELECT user_id FROM dosen WHERE id = p_dosen_id),
--       'DOSEN-' || p_peminjam_id::text,
--       EXTRACT(YEAR FROM NOW())::int,
--       'Dosen'
--     ) ON CONFLICT (id) DO NOTHING;
--   END IF;
--
--   -- Insert peminjaman
--   INSERT INTO peminjaman (
--     inventaris_id, peminjam_id, dosen_id, jumlah_pinjam,
--     keperluan, tanggal_pinjam, tanggal_kembali_rencana,
--     status, kondisi_pinjam
--   ) VALUES (
--     p_inventaris_id, p_peminjam_id, p_dosen_id, p_jumlah_pinjam,
--     p_keperluan, p_tanggal_pinjam, p_tanggal_kembali_rencana,
--     'pending', 'baik'
--   ) RETURNING peminjaman.id INTO v_result;
--
--   RETURN QUERY SELECT v_result;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Testing
-- ============================================================================
-- Setelah run migration ini, trigger akan otomatis aktif
-- Saat dosen membuat peminjaman, mahasiswa entry akan otomatis dibuat
--
-- Untuk test:
-- 1. Login ke Supabase
-- 2. Cek tabel mahasiswa (harusnya ada entry baru dengan nim "DOSEN-xxxxx")
-- 3. Coba dosen buat peminjaman alat di aplikasi
-- 4. Seharusnya berhasil tanpa error 409
