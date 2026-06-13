-- ============================================================================
-- MIGRATION: Add Semester Progression Support
-- ============================================================================
-- Purpose: Track semester progression for mahasiswa across different semesters
-- Changes:
--   1. Add semester_saat_enroll to kelas_mahasiswa (audit trail)
--   2. Add semester_terakhir to kelas_mahasiswa (track progression)
--   3. Create audit table for semester changes
-- ============================================================================

-- ============================================================================
-- STEP 1: Add tracking columns to kelas_mahasiswa
-- ============================================================================

ALTER TABLE kelas_mahasiswa
ADD COLUMN IF NOT EXISTS semester_saat_enroll INTEGER,
ADD COLUMN IF NOT EXISTS semester_terakhir INTEGER;

-- Add comments (separately to avoid syntax error)
COMMENT ON COLUMN kelas_mahasiswa.semester_saat_enroll IS 'Semester mahasiswa saat pertama kali enroll ke kelas ini (audit trail)';
COMMENT ON COLUMN kelas_mahasiswa.semester_terakhir IS 'Semester terakhir untuk tracking progression';

-- ============================================================================
-- STEP 3: Create function untuk track semester saat enroll
-- ============================================================================

CREATE OR REPLACE FUNCTION track_semester_saat_enroll()
RETURNS TRIGGER AS $$
BEGIN
  -- Set semester_saat_enroll from mahasiswa table saat INSERT
  IF NEW.semester_saat_enroll IS NULL THEN
    SELECT semester INTO NEW.semester_saat_enroll
    FROM mahasiswa
    WHERE id = NEW.mahasiswa_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Create trigger untuk track semester enrollment
-- ============================================================================

DROP TRIGGER IF EXISTS track_semester_enrollment ON kelas_mahasiswa;
CREATE TRIGGER track_semester_enrollment
BEFORE INSERT ON kelas_mahasiswa
FOR EACH ROW
EXECUTE FUNCTION track_semester_saat_enroll();

-- ============================================================================
-- STEP 5: Create function untuk suggest kelas berdasarkan semester baru
-- ============================================================================

CREATE OR REPLACE FUNCTION suggest_kelas_for_semester(
  p_angkatan INTEGER,
  p_new_semester INTEGER,
  p_tahun_ajaran VARCHAR
) RETURNS TABLE (
  kelas_id UUID,
  nama_kelas VARCHAR,
  semester_ajaran INTEGER,
  tahun_ajaran VARCHAR,
  dosen_name VARCHAR,
  reason VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id,
    k.nama_kelas,
    k.semester_ajaran,
    k.tahun_ajaran,
    u.full_name as dosen_name,
    CASE 
      WHEN k.semester_ajaran = p_new_semester THEN 'Semester cocok'
      WHEN k.semester_ajaran > p_new_semester THEN 'Semester lebih tinggi'
      ELSE 'Semester lebih rendah'
    END as reason
  FROM kelas k
  LEFT JOIN dosen d ON k.dosen_id = d.id
  LEFT JOIN users u ON d.user_id = u.id
  WHERE 
    -- Filter by tahun ajaran
    k.tahun_ajaran = p_tahun_ajaran
    -- Only suggest classes at or above new semester (flexibility)
    AND k.semester_ajaran >= p_new_semester
    -- Only active kelas
    AND k.is_active = true
  ORDER BY 
    ABS(k.semester_ajaran - p_new_semester) ASC,  -- Closest semester first
    k.nama_kelas ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Create audit log untuk semester updates
-- ============================================================================

CREATE TABLE IF NOT EXISTS mahasiswa_semester_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  semester_lama INTEGER NOT NULL,
  semester_baru INTEGER NOT NULL,
  updated_by_admin_id UUID,
  updated_at TIMESTAMP DEFAULT now(),
  notes VARCHAR
);

COMMENT ON TABLE mahasiswa_semester_audit IS 'Audit log untuk tracking perubahan semester mahasiswa';

-- ============================================================================
-- DONE
-- ============================================================================

COMMENT ON FUNCTION suggest_kelas_for_semester IS 
'Smart suggestion function untuk mencari kelas yang cocok setelah mahasiswa naik semester. 
Returns kelas yang memenuhi kriteria dengan reason untuk setiap suggestion.';
