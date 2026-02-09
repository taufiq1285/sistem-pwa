-- Migration: Create logbook_entries table
-- Description: Digital logbook system for midwifery practical learning
-- Related to thesis proposal objective: "Logbook Digital"
-- Version: 2.0 - Fixed RLS policies to match actual database schema

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jadwal_id UUID NOT NULL REFERENCES public.jadwal_praktikum(id) ON DELETE CASCADE,
  mahasiswa_id UUID NOT NULL REFERENCES public.mahasiswa(id) ON DELETE CASCADE,
  dosen_id UUID REFERENCES public.dosen(id) ON DELETE SET NULL,

  -- Mahasiswa input fields
  prosedur_dilakukan TEXT,
  hasil_observasi TEXT,
  skill_dipelajari TEXT[], -- Array of skills from SKILL_KEBIDANAN
  kendala_dihadapi TEXT,
  refleksi TEXT,

  -- Dosen feedback fields
  dosen_feedback TEXT,
  nilai INTEGER CHECK (nilai >= 0 AND nilai <= 100),

  -- Status workflow: draft -> submitted -> reviewed -> graded
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'graded')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_logbook_jadwal_id ON public.logbook_entries(jadwal_id);
CREATE INDEX IF NOT EXISTS idx_logbook_mahasiswa_id ON public.logbook_entries(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_logbook_dosen_id ON public.logbook_entries(dosen_id);
CREATE INDEX IF NOT EXISTS idx_logbook_status ON public.logbook_entries(status);
CREATE INDEX IF NOT EXISTS idx_logbook_created_at ON public.logbook_entries(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_logbook_mahasiswa_status ON public.logbook_entries(mahasiswa_id, status);

-- Create unique constraint: One logbook per student per schedule
CREATE UNIQUE INDEX IF NOT EXISTS idx_logbook_unique_jadwal_mahasiswa
ON public.logbook_entries(jadwal_id, mahasiswa_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.logbook_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR MAHASISWA
-- ============================================================================

-- Policy: Mahasiswa can view their own logbooks
DROP POLICY IF EXISTS "mahasiswa_view_own_logbooks" ON public.logbook_entries;
CREATE POLICY "mahasiswa_view_own_logbooks"
ON public.logbook_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
);

-- Policy: Mahasiswa can create logbooks (only for jadwal in their enrolled kelas)
DROP POLICY IF EXISTS "mahasiswa_create_own_logbooks" ON public.logbook_entries;
CREATE POLICY "mahasiswa_create_own_logbooks"
ON public.logbook_entries FOR INSERT
WITH CHECK (
  EXISTS (
    -- Check the user is a mahasiswa
    SELECT 1 FROM public.mahasiswa m
    WHERE m.user_id = auth.uid()
    AND m.id = mahasiswa_id
  )
  AND EXISTS (
    -- Check the jadwal belongs to a kelas they're enrolled in
    SELECT 1 FROM public.jadwal_praktikum jp
    INNER JOIN public.kelas_mahasiswa km ON jp.kelas_id = km.kelas_id
    WHERE jp.id = jadwal_id
    AND km.mahasiswa_id = mahasiswa_id
  )
);

-- Policy: Mahasiswa can update their own logbooks (only draft status)
DROP POLICY IF EXISTS "mahasiswa_update_own_logbooks" ON public.logbook_entries;
CREATE POLICY "mahasiswa_update_own_logbooks"
ON public.logbook_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
  AND status = 'draft'
)
WITH CHECK (
  status = 'draft'
  AND EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
);

-- Policy: Mahasiswa can delete their own logbooks (only draft status)
DROP POLICY IF EXISTS "mahasiswa_delete_own_logbooks" ON public.logbook_entries;
CREATE POLICY "mahasiswa_delete_own_logbooks"
ON public.logbook_entries FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
  AND status = 'draft'
);

-- ============================================================================
-- RLS POLICIES FOR DOSEN
-- ============================================================================

-- Policy: Dosen can view logbooks for their assigned kelas
DROP POLICY IF EXISTS "dosen_view_assigned_logbooks" ON public.logbook_entries;
CREATE POLICY "dosen_view_assigned_logbooks"
ON public.logbook_entries FOR SELECT
USING (
  EXISTS (
    -- Check if jadwal's kelas belongs to this dosen
    SELECT 1 FROM public.jadwal_praktikum jp
    INNER JOIN public.kelas k ON jp.kelas_id = k.id
    WHERE jp.id = logbook_entries.jadwal_id
    AND k.dosen_id = (
      SELECT d.id FROM public.dosen d WHERE d.user_id = auth.uid()
    )
  )
  OR
  -- Also allow if jadwal has dosen_id directly (newer schema)
  EXISTS (
    SELECT 1 FROM public.jadwal_praktikum jp
    WHERE jp.id = logbook_entries.jadwal_id
    AND jp.dosen_id = (
      SELECT d.id FROM public.dosen d WHERE d.user_id = auth.uid()
    )
  )
);

-- Policy: Dosen can update logbooks they review (feedback and status change)
DROP POLICY IF EXISTS "dosen_review_assigned_logbooks" ON public.logbook_entries;
CREATE POLICY "dosen_review_assigned_logbooks"
ON public.logbook_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.dosen d
    WHERE d.user_id = auth.uid()
    AND (
      d.id = logbook_entries.dosen_id
      OR logbook_entries.dosen_id IS NULL
    )
  )
  AND EXISTS (
    SELECT 1 FROM public.jadwal_praktikum jp
    INNER JOIN public.kelas k ON jp.kelas_id = k.id
    WHERE jp.id = logbook_entries.jadwal_id
    AND k.dosen_id = (
      SELECT d.id FROM public.dosen d WHERE d.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dosen d
    WHERE d.user_id = auth.uid()
  )
  AND (
    -- Allow updating status to 'reviewed' or 'graded'
    (status = 'reviewed' OR status = 'graded')
    OR
    -- Allow updating feedback and nilai
    (dosen_feedback IS NOT NULL OR nilai IS NOT NULL)
  )
);

-- ============================================================================
-- RLS POLICIES FOR ADMIN
-- ============================================================================

-- Policy: Admin can view all logbooks
DROP POLICY IF EXISTS "admin_view_all_logbooks" ON public.logbook_entries;
CREATE POLICY "admin_view_all_logbooks"
ON public.logbook_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.admin a ON u.id = a.user_id
    WHERE u.id = auth.uid()
  )
);

-- Policy: Admin can update any logbook
DROP POLICY IF EXISTS "admin_update_all_logbooks" ON public.logbook_entries;
CREATE POLICY "admin_update_all_logbooks"
ON public.logbook_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.admin a ON u.id = a.user_id
    WHERE u.id = auth.uid()
  )
);

-- ============================================================================
-- TRIGGER FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_logbook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Update timestamp based on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'submitted' THEN
        NEW.submitted_at = NOW();
      WHEN 'reviewed' THEN
        NEW.reviewed_at = NOW();
        -- Set dosen_id if not already set
        IF NEW.dosen_id IS NULL THEN
          NEW.dosen_id = (
            SELECT d.id FROM public.dosen d
            WHERE d.user_id = auth.uid()
          );
        END IF;
      WHEN 'graded' THEN
        NEW.graded_at = NOW();
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS logbook_entries_updated_at ON public.logbook_entries;
CREATE TRIGGER logbook_entries_updated_at
  BEFORE UPDATE ON public.logbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_logbook_updated_at();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.logbook_entries TO authenticated;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.logbook_entries IS 'Digital logbook for midwifery practical learning - students record procedures, observations, and reflections';

COMMENT ON COLUMN public.logbook_entries.id IS 'Unique identifier for the logbook entry';
COMMENT ON COLUMN public.logbook_entries.jadwal_id IS 'Reference to the practical schedule (jadwal_praktikum)';
COMMENT ON COLUMN public.logbook_entries.mahasiswa_id IS 'Student who created the logbook';
COMMENT ON COLUMN public.logbook_entries.dosen_id IS 'Dosen who reviewed/graded the logbook';
COMMENT ON COLUMN public.logbook_entries.prosedur_dilakukan IS 'Procedures performed during practice';
COMMENT ON COLUMN public.logbook_entries.hasil_observasi IS 'Observation results from practice';
COMMENT ON COLUMN public.logbook_entries.skill_dipelajari IS 'Array of midwifery skills learned';
COMMENT ON COLUMN public.logbook_entries.kendala_dihadapi IS 'Challenges encountered during practice';
COMMENT ON COLUMN public.logbook_entries.refleksi IS 'Student reflection on learning';
COMMENT ON COLUMN public.logbook_entries.dosen_feedback IS 'Feedback from dosen reviewer';
COMMENT ON COLUMN public.logbook_entries.nilai IS 'Grade given by dosen (0-100)';
COMMENT ON COLUMN public.logbook_entries.status IS 'Workflow status: draft -> submitted -> reviewed -> graded';
COMMENT ON COLUMN public.logbook_entries.created_at IS 'Timestamp when logbook was created';
COMMENT ON COLUMN public.logbook_entries.updated_at IS 'Timestamp when logbook was last updated';
COMMENT ON COLUMN public.logbook_entries.submitted_at IS 'Timestamp when logbook was submitted for review';
COMMENT ON COLUMN public.logbook_entries.reviewed_at IS 'Timestamp when logbook was reviewed by dosen';
COMMENT ON COLUMN public.logbook_entries.graded_at IS 'Timestamp when logbook was graded';

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify setup)
-- ============================================================================

-- Check table exists
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'logbook_entries';

-- Check RLS is enabled
-- SELECT relname FROM pg_class WHERE relname = 'logbook_entries' AND relrowsecurity = true;

-- Check policies exist
-- SELECT policyname, tablename FROM pg_policies WHERE tablename = 'logbook_entries';

-- Check indexes exist
-- SELECT indexname FROM pg_indexes WHERE tablename = 'logbook_entries';
