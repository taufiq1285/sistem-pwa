-- ============================================================================
-- Migration 33: Simplify Jadwal INSERT Policy (Fix Hanging Issue)
-- ============================================================================
-- Issue: INSERT policy with EXISTS subquery causes timeout/hang
-- Solution: Remove the kelas EXISTS check - just check is_dosen()
-- ============================================================================

-- Re-enable RLS first (if it was disabled for testing)
ALTER TABLE jadwal_praktikum ENABLE ROW LEVEL SECURITY;

-- Drop the problematic policy
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_admin" ON public.jadwal_praktikum;

-- ============================================================================
-- SIMPLIFIED POLICIES: No subqueries that could cause hangs
-- ============================================================================

-- ADMIN: Full access
CREATE POLICY "jadwal_praktikum_insert_admin"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
);

-- DOSEN: Can insert jadwal (simplified - no kelas check)
-- Application will validate kelas_id exists
CREATE POLICY "jadwal_praktikum_insert_dosen"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (
  is_dosen()
);

-- ============================================================================
-- UPDATE and DELETE policies (also simplify)
-- ============================================================================

DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_admin" ON public.jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_update_admin"
ON public.jadwal_praktikum
FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "jadwal_praktikum_update_dosen"
ON public.jadwal_praktikum
FOR UPDATE
TO authenticated
USING (is_dosen());

-- DELETE policies
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_admin" ON public.jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_delete_admin"
ON public.jadwal_praktikum
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "jadwal_praktikum_delete_dosen"
ON public.jadwal_praktikum
FOR DELETE
TO authenticated
USING (is_dosen());

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON TABLE jadwal_praktikum IS
'RLS enabled: Simplified policies - Admin full access, Dosen can manage all jadwal';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  policyname,
  cmd,
  with_check::text
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
  AND cmd = 'INSERT'
ORDER BY policyname;
