-- ============================================================================
-- MIGRATION: Add Hybrid Approval Workflow for Jadwal Praktikum
-- ============================================================================
-- Purpose: Enable laboran to cancel/override jadwal while keeping auto-approve
-- Author: System
-- Date: 2025-12-09
-- ============================================================================

-- STEP 1: Add new columns to jadwal_praktikum
-- ============================================================================

ALTER TABLE jadwal_praktikum
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved'
  CHECK (status IN ('approved', 'cancelled'));

ALTER TABLE jadwal_praktikum
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE jadwal_praktikum
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

ALTER TABLE jadwal_praktikum
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- ============================================================================
-- STEP 2: Create index for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_jadwal_praktikum_status
ON jadwal_praktikum(status);

CREATE INDEX IF NOT EXISTS idx_jadwal_praktikum_cancelled_by
ON jadwal_praktikum(cancelled_by);

-- ============================================================================
-- STEP 3: Update existing jadwal to 'approved' status
-- ============================================================================

UPDATE jadwal_praktikum
SET status = 'approved'
WHERE status IS NULL;

-- ============================================================================
-- STEP 4: Add comment for documentation
-- ============================================================================

COMMENT ON COLUMN jadwal_praktikum.status IS
'Status jadwal: approved (auto/default), cancelled (by laboran)';

COMMENT ON COLUMN jadwal_praktikum.cancelled_by IS
'User ID of laboran who cancelled this jadwal';

COMMENT ON COLUMN jadwal_praktikum.cancelled_at IS
'Timestamp when jadwal was cancelled';

COMMENT ON COLUMN jadwal_praktikum.cancellation_reason IS
'Reason why laboran cancelled this jadwal (e.g., lab maintenance, equipment broken)';

-- ============================================================================
-- STEP 5: Create helper function to cancel jadwal
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_jadwal_praktikum(
  jadwal_id UUID,
  reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  -- Check if user is laboran
  IF NOT EXISTS (
    SELECT 1 FROM public.laboran WHERE user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Only laboran can cancel jadwal';
  END IF;

  -- Update jadwal status
  UPDATE jadwal_praktikum
  SET
    status = 'cancelled',
    cancelled_by = current_user_id,
    cancelled_at = NOW(),
    cancellation_reason = reason,
    updated_at = NOW()
  WHERE id = jadwal_id;

  -- Return success
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cancel_jadwal_praktikum(UUID, TEXT)
TO authenticated;

COMMENT ON FUNCTION public.cancel_jadwal_praktikum IS
'Cancel jadwal praktikum with reason (laboran only)';

-- ============================================================================
-- STEP 6: Create helper function to reactivate cancelled jadwal
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reactivate_jadwal_praktikum(
  jadwal_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  -- Check if user is laboran
  IF NOT EXISTS (
    SELECT 1 FROM public.laboran WHERE user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Only laboran can reactivate jadwal';
  END IF;

  -- Update jadwal status back to approved
  UPDATE jadwal_praktikum
  SET
    status = 'approved',
    cancelled_by = NULL,
    cancelled_at = NULL,
    cancellation_reason = NULL,
    updated_at = NOW()
  WHERE id = jadwal_id;

  -- Return success
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.reactivate_jadwal_praktikum(UUID)
TO authenticated;

COMMENT ON FUNCTION public.reactivate_jadwal_praktikum IS
'Reactivate cancelled jadwal (laboran only)';

-- ============================================================================
-- STEP 7: Create view for active jadwal only
-- ============================================================================

CREATE OR REPLACE VIEW active_jadwal_praktikum AS
SELECT
  jp.*,
  k.nama_kelas,
  k.kode_kelas,
  mk.nama_mk as mata_kuliah_nama,
  l.nama_lab,
  l.kode_lab,
  u.full_name as cancelled_by_name
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
LEFT JOIN users u ON jp.cancelled_by = u.id
WHERE jp.status = 'approved'
AND jp.is_active = true;

COMMENT ON VIEW active_jadwal_praktikum IS
'View for approved and active jadwal only (excludes cancelled)';

-- Grant select permission
GRANT SELECT ON active_jadwal_praktikum TO authenticated;

-- ============================================================================
-- STEP 8: Verification queries
-- ============================================================================

-- Check new columns added
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
AND column_name IN ('status', 'cancelled_by', 'cancelled_at', 'cancellation_reason')
ORDER BY ordinal_position;

-- Check functions created
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('cancel_jadwal_praktikum', 'reactivate_jadwal_praktikum');

-- Check view created
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'active_jadwal_praktikum';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
