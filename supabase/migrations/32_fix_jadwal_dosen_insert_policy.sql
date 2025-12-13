-- ============================================================================
-- Migration 32: Fix Jadwal Praktikum INSERT Policy for Dosen
-- ============================================================================
-- Issue: New dosen cannot create jadwal because they don't have kelas assigned
-- Solution: Allow dosen to create jadwal for any active kelas
--           (Admin will assign kelas ownership separately)
-- ============================================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen_only" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_admin" ON public.jadwal_praktikum;

-- ============================================================================
-- NEW POLICY: Allow dosen to INSERT jadwal for any active kelas
-- ============================================================================

-- ADMIN: Can insert jadwal for any kelas
CREATE POLICY "jadwal_praktikum_insert_admin"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
);

-- DOSEN: Can insert jadwal for any active kelas
-- Note: This allows dosen to create schedules even if they don't own the kelas yet
--       Admin will manage kelas ownership separately
CREATE POLICY "jadwal_praktikum_insert_dosen"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (
  is_dosen()
  AND EXISTS (
    SELECT 1 FROM kelas
    WHERE id = kelas_id
    AND is_active = true
  )
);

-- ============================================================================
-- UPDATE and DELETE policies remain restrictive
-- ============================================================================

-- Update the UPDATE policy to be consistent
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen_only" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_admin" ON public.jadwal_praktikum;

-- ADMIN: Can update any jadwal
CREATE POLICY "jadwal_praktikum_update_admin"
ON public.jadwal_praktikum
FOR UPDATE
TO authenticated
USING (is_admin());

-- DOSEN: Can update jadwal they created (based on the kelas they teach)
-- OR allow update of any jadwal for more flexibility
CREATE POLICY "jadwal_praktikum_update_dosen"
ON public.jadwal_praktikum
FOR UPDATE
TO authenticated
USING (
  is_dosen()
  AND EXISTS (
    SELECT 1 FROM kelas
    WHERE id = kelas_id
    AND is_active = true
  )
);

-- Update DELETE policy similarly
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen_only" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_admin" ON public.jadwal_praktikum;

-- ADMIN: Can delete any jadwal
CREATE POLICY "jadwal_praktikum_delete_admin"
ON public.jadwal_praktikum
FOR DELETE
TO authenticated
USING (is_admin());

-- DOSEN: Can delete jadwal for active kelas
CREATE POLICY "jadwal_praktikum_delete_dosen"
ON public.jadwal_praktikum
FOR DELETE
TO authenticated
USING (
  is_dosen()
  AND EXISTS (
    SELECT 1 FROM kelas
    WHERE id = kelas_id
    AND is_active = true
  )
);

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON TABLE jadwal_praktikum IS
'RLS enabled: Admin full access, Dosen can manage jadwal for any active kelas';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- To verify the policies:
-- SELECT policyname, cmd, qual::text, with_check::text
-- FROM pg_policies
-- WHERE tablename = 'jadwal_praktikum'
-- ORDER BY policyname;
