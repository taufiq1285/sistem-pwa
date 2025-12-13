-- ============================================================================
-- OPTIMIZE: Add indexes for faster role checks
-- ============================================================================
-- Mempercepat query EXISTS pada get_user_role() function
-- ============================================================================

-- Index untuk admin.user_id (jika belum ada)
CREATE INDEX IF NOT EXISTS idx_admin_user_id ON admin(user_id);

-- Index untuk dosen.user_id (jika belum ada)  
CREATE INDEX IF NOT EXISTS idx_dosen_user_id ON dosen(user_id);

-- Index untuk laboran.user_id (jika belum ada)
CREATE INDEX IF NOT EXISTS idx_laboran_user_id ON laboran(user_id);

-- Index untuk mahasiswa.user_id (jika belum ada)
CREATE INDEX IF NOT EXISTS idx_mahasiswa_user_id ON mahasiswa(user_id);

COMMENT ON INDEX idx_admin_user_id IS 'Mempercepat role check untuk admin';
COMMENT ON INDEX idx_dosen_user_id IS 'Mempercepat role check untuk dosen';
COMMENT ON INDEX idx_laboran_user_id IS 'Mempercepat role check untuk laboran';
COMMENT ON INDEX idx_mahasiswa_user_id IS 'Mempercepat role check untuk mahasiswa';
