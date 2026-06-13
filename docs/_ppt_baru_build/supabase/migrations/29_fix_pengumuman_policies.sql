-- ============================================================================
-- MIGRATION 29: Fix Pengumuman (Announcements) RLS Policies
-- Add INSERT, UPDATE, DELETE policies for admin
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "pengumuman_select" ON pengumuman;

-- SELECT: Everyone can see active announcements
CREATE POLICY "pengumuman_select" ON pengumuman
    FOR SELECT USING (is_active = true);

-- INSERT: Admin can create announcements
CREATE POLICY "pengumuman_admin_insert" ON pengumuman
    FOR INSERT WITH CHECK (is_admin());

-- UPDATE: Admin can update announcements
CREATE POLICY "pengumuman_admin_update" ON pengumuman
    FOR UPDATE USING (is_admin());

-- DELETE: Admin can delete announcements
CREATE POLICY "pengumuman_admin_delete" ON pengumuman
    FOR DELETE USING (is_admin());

-- Optional: Author can update their own announcement
CREATE POLICY "pengumuman_author_update" ON pengumuman
    FOR UPDATE USING (penulis_id = auth.uid());
