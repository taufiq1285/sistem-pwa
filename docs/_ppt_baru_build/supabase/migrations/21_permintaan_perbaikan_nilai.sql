/**
 * Migration: Permintaan Perbaikan Nilai
 *
 * Purpose: Allow students to request grade revisions from instructors
 * Features:
 * - Students can request corrections for specific grade components
 * - Instructors can approve/reject with reasons
 * - Auto-update nilai when approved
 * - Full audit trail
 */

-- ============================================================================
-- TABLE: permintaan_perbaikan_nilai
-- ============================================================================

CREATE TABLE IF NOT EXISTS permintaan_perbaikan_nilai (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Request Info
  mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  nilai_id UUID NOT NULL REFERENCES nilai(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,

  -- What to fix
  komponen_nilai VARCHAR(20) NOT NULL CHECK (
    komponen_nilai IN ('kuis', 'tugas', 'uts', 'uas', 'praktikum', 'kehadiran')
  ),
  nilai_lama DECIMAL(5,2) NOT NULL,
  nilai_usulan DECIMAL(5,2) CHECK (nilai_usulan BETWEEN 0 AND 100),

  -- Reason & Evidence
  alasan_permintaan TEXT NOT NULL,
  bukti_pendukung TEXT[], -- Array of URLs or file paths

  -- Status & Response
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'cancelled')
  ),
  response_dosen TEXT,
  nilai_baru DECIMAL(5,2) CHECK (nilai_baru BETWEEN 0 AND 100),

  -- Reviewer
  reviewed_by UUID REFERENCES dosen(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_nilai_baru_on_approval
    CHECK (
      (status = 'approved' AND nilai_baru IS NOT NULL) OR
      (status != 'approved')
    ),
  CONSTRAINT check_response_on_reviewed
    CHECK (
      (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL) OR
      (status NOT IN ('approved', 'rejected'))
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_perbaikan_nilai_mahasiswa
  ON permintaan_perbaikan_nilai(mahasiswa_id);

CREATE INDEX IF NOT EXISTS idx_perbaikan_nilai_status
  ON permintaan_perbaikan_nilai(status);

CREATE INDEX IF NOT EXISTS idx_perbaikan_nilai_kelas
  ON permintaan_perbaikan_nilai(kelas_id);

CREATE INDEX IF NOT EXISTS idx_perbaikan_nilai_reviewed_by
  ON permintaan_perbaikan_nilai(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_perbaikan_nilai_created_at
  ON permintaan_perbaikan_nilai(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE permintaan_perbaikan_nilai ENABLE ROW LEVEL SECURITY;

-- Policy: Mahasiswa can view their own requests
CREATE POLICY "Mahasiswa can view own requests"
  ON permintaan_perbaikan_nilai
  FOR SELECT
  USING (
    mahasiswa_id IN (
      SELECT id FROM mahasiswa WHERE user_id = auth.uid()
    )
  );

-- Policy: Mahasiswa can create requests for their own grades
CREATE POLICY "Mahasiswa can create requests"
  ON permintaan_perbaikan_nilai
  FOR INSERT
  WITH CHECK (
    mahasiswa_id IN (
      SELECT id FROM mahasiswa WHERE user_id = auth.uid()
    )
  );

-- Policy: Mahasiswa can cancel their own pending requests
CREATE POLICY "Mahasiswa can cancel own pending requests"
  ON permintaan_perbaikan_nilai
  FOR UPDATE
  USING (
    mahasiswa_id IN (
      SELECT id FROM mahasiswa WHERE user_id = auth.uid()
    ) AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );

-- Policy: Dosen can view requests for their classes
CREATE POLICY "Dosen can view requests for their classes"
  ON permintaan_perbaikan_nilai
  FOR SELECT
  USING (
    kelas_id IN (
      SELECT id FROM kelas WHERE dosen_id IN (
        SELECT id FROM dosen WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Dosen can update (approve/reject) requests for their classes
CREATE POLICY "Dosen can update requests for their classes"
  ON permintaan_perbaikan_nilai
  FOR UPDATE
  USING (
    kelas_id IN (
      SELECT id FROM kelas WHERE dosen_id IN (
        SELECT id FROM dosen WHERE user_id = auth.uid()
      )
    ) AND status = 'pending'
  )
  WITH CHECK (
    status IN ('approved', 'rejected')
  );

-- Policy: Admin can view all requests
CREATE POLICY "Admin can view all requests"
  ON permintaan_perbaikan_nilai
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_permintaan_perbaikan_nilai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_permintaan_perbaikan_nilai_updated_at
  BEFORE UPDATE ON permintaan_perbaikan_nilai
  FOR EACH ROW
  EXECUTE FUNCTION update_permintaan_perbaikan_nilai_updated_at();

-- ============================================================================
-- TRIGGER: Auto-update nilai when request is approved
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_update_nilai_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.nilai_baru IS NOT NULL THEN

    -- Update the corresponding nilai record
    UPDATE nilai
    SET
      nilai_kuis = CASE WHEN NEW.komponen_nilai = 'kuis' THEN NEW.nilai_baru ELSE nilai_kuis END,
      nilai_tugas = CASE WHEN NEW.komponen_nilai = 'tugas' THEN NEW.nilai_baru ELSE nilai_tugas END,
      nilai_uts = CASE WHEN NEW.komponen_nilai = 'uts' THEN NEW.nilai_baru ELSE nilai_uts END,
      nilai_uas = CASE WHEN NEW.komponen_nilai = 'uas' THEN NEW.nilai_baru ELSE nilai_uas END,
      nilai_praktikum = CASE WHEN NEW.komponen_nilai = 'praktikum' THEN NEW.nilai_baru ELSE nilai_praktikum END,
      nilai_kehadiran = CASE WHEN NEW.komponen_nilai = 'kehadiran' THEN NEW.nilai_baru ELSE nilai_kehadiran END,
      updated_at = NOW()
    WHERE id = NEW.nilai_id;

    -- Log the update
    RAISE NOTICE 'Auto-updated nilai % for komponen % to %', NEW.nilai_id, NEW.komponen_nilai, NEW.nilai_baru;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_nilai_on_approval
  AFTER UPDATE ON permintaan_perbaikan_nilai
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_nilai_on_approval();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE permintaan_perbaikan_nilai IS 'Stores student requests for grade revisions';
COMMENT ON COLUMN permintaan_perbaikan_nilai.komponen_nilai IS 'Which grade component to revise: kuis, tugas, uts, uas, praktikum, kehadiran';
COMMENT ON COLUMN permintaan_perbaikan_nilai.nilai_lama IS 'Current grade value before revision';
COMMENT ON COLUMN permintaan_perbaikan_nilai.nilai_usulan IS 'Grade value suggested by student (optional)';
COMMENT ON COLUMN permintaan_perbaikan_nilai.nilai_baru IS 'New grade value approved by instructor (required if approved)';
COMMENT ON COLUMN permintaan_perbaikan_nilai.status IS 'Request status: pending, approved, rejected, cancelled';
COMMENT ON COLUMN permintaan_perbaikan_nilai.bukti_pendukung IS 'Array of evidence URLs (screenshots, files, etc.)';
