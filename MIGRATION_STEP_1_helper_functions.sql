-- ============================================================================
-- MIGRATION STEP 1: Create Helper Functions
-- ============================================================================
-- Jalankan file ini PERTAMA di Supabase Dashboard SQL Editor
-- ============================================================================

-- Function: is_admin()
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: is_dosen()
CREATE OR REPLACE FUNCTION is_dosen()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'dosen'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: is_mahasiswa()
CREATE OR REPLACE FUNCTION is_mahasiswa()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'mahasiswa'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: is_laboran()
CREATE OR REPLACE FUNCTION is_laboran()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'laboran'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: get_dosen_id()
CREATE OR REPLACE FUNCTION get_dosen_id()
RETURNS uuid AS $$
BEGIN
    RETURN (SELECT id FROM dosen WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: get_mahasiswa_id()
CREATE OR REPLACE FUNCTION get_mahasiswa_id()
RETURNS uuid AS $$
BEGIN
    RETURN (SELECT id FROM mahasiswa WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: get_laboran_id()
CREATE OR REPLACE FUNCTION get_laboran_id()
RETURNS uuid AS $$
BEGIN
    RETURN (SELECT id FROM laboran WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- DONE! Lanjut ke MIGRATION_STEP_2A
-- ============================================================================
