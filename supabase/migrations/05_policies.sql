-- ============================================================================
-- MIGRATION 05: RLS POLICIES
-- Row Level Security policies (SIMPLE VERSION - NO RECURSION)
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboran ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_kuliah ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratorium ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_praktikum ENABLE ROW LEVEL SECURITY;
ALTER TABLE materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE kuis ENABLE ROW LEVEL SECURITY;
ALTER TABLE soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_kuis ENABLE ROW LEVEL SECURITY;
ALTER TABLE jawaban ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS POLICIES (SIMPLE - NO RECURSION)
-- ============================================================================

CREATE POLICY "users_select_all" ON users
    FOR SELECT USING (true);

CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_own" ON users
    FOR DELETE USING (auth.uid() = id);

-- ============================================================================
-- MAHASISWA POLICIES
-- ============================================================================

CREATE POLICY "mahasiswa_select" ON mahasiswa
    FOR SELECT USING (true);

CREATE POLICY "mahasiswa_insert_own" ON mahasiswa
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "mahasiswa_update_own" ON mahasiswa
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- DOSEN POLICIES
-- ============================================================================

CREATE POLICY "dosen_select" ON dosen
    FOR SELECT USING (true);

CREATE POLICY "dosen_insert_own" ON dosen
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "dosen_update_own" ON dosen
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- LABORAN POLICIES
-- ============================================================================

CREATE POLICY "laboran_select" ON laboran
    FOR SELECT USING (true);

CREATE POLICY "laboran_insert_own" ON laboran
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "laboran_update_own" ON laboran
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- ADMIN POLICIES
-- ============================================================================

CREATE POLICY "admin_select" ON admin
    FOR SELECT USING (true);

CREATE POLICY "admin_insert_own" ON admin
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_update_own" ON admin
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- ACADEMIC POLICIES
-- ============================================================================

CREATE POLICY "mata_kuliah_select" ON mata_kuliah
    FOR SELECT USING (true);

CREATE POLICY "laboratorium_select" ON laboratorium
    FOR SELECT USING (true);

CREATE POLICY "kelas_select" ON kelas
    FOR SELECT USING (true);

CREATE POLICY "kelas_mahasiswa_select" ON kelas_mahasiswa
    FOR SELECT USING (true);

CREATE POLICY "kelas_mahasiswa_insert" ON kelas_mahasiswa
    FOR INSERT WITH CHECK (true);

CREATE POLICY "jadwal_praktikum_select" ON jadwal_praktikum
    FOR SELECT USING (true);

-- ============================================================================
-- MATERIALS & GRADES POLICIES
-- ============================================================================

CREATE POLICY "materi_select" ON materi
    FOR SELECT USING (true);

CREATE POLICY "nilai_select" ON nilai
    FOR SELECT USING (true);

-- ============================================================================
-- QUIZ POLICIES (CRITICAL - OFFLINE CAPABLE)
-- ============================================================================

CREATE POLICY "kuis_select" ON kuis
    FOR SELECT USING (true);

CREATE POLICY "soal_select" ON soal
    FOR SELECT USING (true);

CREATE POLICY "attempt_kuis_select" ON attempt_kuis
    FOR SELECT USING (true);

CREATE POLICY "attempt_kuis_insert_own" ON attempt_kuis
    FOR INSERT WITH CHECK (
        mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
    );

CREATE POLICY "attempt_kuis_update_own" ON attempt_kuis
    FOR UPDATE USING (
        mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
    );

CREATE POLICY "jawaban_select" ON jawaban
    FOR SELECT USING (true);

CREATE POLICY "jawaban_insert_own" ON jawaban
    FOR INSERT WITH CHECK (
        attempt_id IN (
            SELECT id FROM attempt_kuis 
            WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "jawaban_update_own" ON jawaban
    FOR UPDATE USING (
        attempt_id IN (
            SELECT id FROM attempt_kuis 
            WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
        )
    );

-- ============================================================================
-- INVENTORY POLICIES
-- ============================================================================

CREATE POLICY "inventaris_select" ON inventaris
    FOR SELECT USING (true);

CREATE POLICY "peminjaman_select" ON peminjaman
    FOR SELECT USING (true);

CREATE POLICY "peminjaman_insert_own" ON peminjaman
    FOR INSERT WITH CHECK (
        peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
    );

CREATE POLICY "peminjaman_update_own" ON peminjaman
    FOR UPDATE USING (
        peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
    );

-- ============================================================================
-- ANNOUNCEMENTS & NOTIFICATIONS POLICIES
-- ============================================================================

CREATE POLICY "pengumuman_select" ON pengumuman
    FOR SELECT USING (is_active = true);

CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
    FOR INSERT WITH CHECK (true);