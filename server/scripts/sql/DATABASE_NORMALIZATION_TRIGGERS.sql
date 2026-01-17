-- ============================================================================
-- DATABASE NORMALIZATION TRIGGERS
-- ============================================================================
-- These triggers automatically normalize data as it's inserted or updated
-- into the database to ensure consistency across all data

-- ============================================================================
-- USERS TABLE TRIGGER - Normalize Full Name & Email
-- ============================================================================

-- Create function to normalize users table data
CREATE OR REPLACE FUNCTION normalize_users_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize full_name: Title Case + Trim + Normalize spaces
  IF NEW.full_name IS NOT NULL THEN
    NEW.full_name := INITCAP(TRIM(REGEXP_REPLACE(NEW.full_name, '\s+', ' ', 'g')));
  END IF;

  -- Normalize email: Lowercase + Trim
  IF NEW.email IS NOT NULL THEN
    NEW.email := LOWER(TRIM(NEW.email));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS normalize_users_trigger ON users;

-- Create trigger
CREATE TRIGGER normalize_users_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION normalize_users_data();

-- ============================================================================
-- MAHASISWA TABLE TRIGGER - Normalize NIM
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_mahasiswa_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize nim: UPPERCASE + Trim + Remove spaces
  IF NEW.nim IS NOT NULL THEN
    NEW.nim := UPPER(TRIM(REGEXP_REPLACE(NEW.nim, '\s+', '', 'g')));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS normalize_mahasiswa_trigger ON mahasiswa;

-- Create trigger
CREATE TRIGGER normalize_mahasiswa_trigger
BEFORE INSERT OR UPDATE ON mahasiswa
FOR EACH ROW
EXECUTE FUNCTION normalize_mahasiswa_data();

-- ============================================================================
-- KELAS TABLE TRIGGER - Normalize Kelas Nama
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_kelas_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize nama_kelas: Title Case + Trim + Normalize spaces
  IF NEW.nama_kelas IS NOT NULL THEN
    NEW.nama_kelas := INITCAP(TRIM(REGEXP_REPLACE(NEW.nama_kelas, '\s+', ' ', 'g')));
  END IF;

  -- Normalize kode_kelas: UPPERCASE + Trim + Remove spaces
  IF NEW.kode_kelas IS NOT NULL THEN
    NEW.kode_kelas := UPPER(TRIM(REGEXP_REPLACE(NEW.kode_kelas, '\s+', '', 'g')));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS normalize_kelas_trigger ON kelas;

-- Create trigger
CREATE TRIGGER normalize_kelas_trigger
BEFORE INSERT OR UPDATE ON kelas
FOR EACH ROW
EXECUTE FUNCTION normalize_kelas_data();

-- ============================================================================
-- DOSEN TABLE TRIGGER - Normalize NIP
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_dosen_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize nip: UPPERCASE + Trim + Remove spaces
  IF NEW.nip IS NOT NULL THEN
    NEW.nip := UPPER(TRIM(REGEXP_REPLACE(NEW.nip, '\s+', '', 'g')));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS normalize_dosen_trigger ON dosen;

-- Create trigger
CREATE TRIGGER normalize_dosen_trigger
BEFORE INSERT OR UPDATE ON dosen
FOR EACH ROW
EXECUTE FUNCTION normalize_dosen_data();

-- ============================================================================
-- MATA_KULIAH TABLE TRIGGER - Normalize Nama
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_mata_kuliah_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize nama_mk: Title Case + Trim + Normalize spaces
  IF NEW.nama_mk IS NOT NULL THEN
    NEW.nama_mk := INITCAP(TRIM(REGEXP_REPLACE(NEW.nama_mk, '\s+', ' ', 'g')));
  END IF;

  -- Normalize kode_mk: UPPERCASE + Trim + Remove spaces
  IF NEW.kode_mk IS NOT NULL THEN
    NEW.kode_mk := UPPER(TRIM(REGEXP_REPLACE(NEW.kode_mk, '\s+', '', 'g')));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS normalize_mata_kuliah_trigger ON mata_kuliah;

-- Create trigger
CREATE TRIGGER normalize_mata_kuliah_trigger
BEFORE INSERT OR UPDATE ON mata_kuliah
FOR EACH ROW
EXECUTE FUNCTION normalize_mata_kuliah_data();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test normalize_users_trigger
-- INSERT INTO users (email, full_name, password_hash)
-- VALUES ('TEST@EXAMPLE.COM', '  siti  nurhaliza  ', 'hash')
-- Should result in: email='test@example.com', full_name='Siti Nurhaliza'

-- Test normalize_mahasiswa_trigger
-- UPDATE mahasiswa SET nim = 'bd 2321 001' WHERE id = 'xxx'
-- Should result in: nim='BD2321001'

-- Test normalize_kelas_trigger
-- UPDATE kelas SET nama_kelas = 'kelas a (pin merah)' WHERE id = 'xxx'
-- Should result in: nama_kelas='Kelas A (Pin Merah)'

-- ============================================================================
-- NOTES
-- ============================================================================
-- - These triggers run on every INSERT and UPDATE
-- - Triggers normalize data even if frontend normalization is skipped
-- - This provides a safety net for data consistency
-- - If any trigger fails, the operation will be rolled back
-- - To view trigger definitions: SELECT * FROM information_schema.triggers
-- - To disable a trigger: ALTER TRIGGER trigger_name ON table_name DISABLE
-- - To drop a trigger: DROP TRIGGER trigger_name ON table_name
