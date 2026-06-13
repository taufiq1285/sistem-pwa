-- ============================================================================
-- MIGRATION 04: TRIGGERS
-- Database triggers for automation
-- ============================================================================

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mahasiswa
DROP TRIGGER IF EXISTS update_mahasiswa_updated_at ON mahasiswa;
CREATE TRIGGER update_mahasiswa_updated_at 
    BEFORE UPDATE ON mahasiswa 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dosen
DROP TRIGGER IF EXISTS update_dosen_updated_at ON dosen;
CREATE TRIGGER update_dosen_updated_at 
    BEFORE UPDATE ON dosen 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Laboran
DROP TRIGGER IF EXISTS update_laboran_updated_at ON laboran;
CREATE TRIGGER update_laboran_updated_at 
    BEFORE UPDATE ON laboran 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin
DROP TRIGGER IF EXISTS update_admin_updated_at ON admin;
CREATE TRIGGER update_admin_updated_at 
    BEFORE UPDATE ON admin 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mata Kuliah
DROP TRIGGER IF EXISTS update_mata_kuliah_updated_at ON mata_kuliah;
CREATE TRIGGER update_mata_kuliah_updated_at 
    BEFORE UPDATE ON mata_kuliah 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Laboratorium
DROP TRIGGER IF EXISTS update_laboratorium_updated_at ON laboratorium;
CREATE TRIGGER update_laboratorium_updated_at 
    BEFORE UPDATE ON laboratorium 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Kelas
DROP TRIGGER IF EXISTS update_kelas_updated_at ON kelas;
CREATE TRIGGER update_kelas_updated_at 
    BEFORE UPDATE ON kelas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Jadwal Praktikum
DROP TRIGGER IF EXISTS update_jadwal_praktikum_updated_at ON jadwal_praktikum;
CREATE TRIGGER update_jadwal_praktikum_updated_at 
    BEFORE UPDATE ON jadwal_praktikum 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Kuis
DROP TRIGGER IF EXISTS update_kuis_updated_at ON kuis;
CREATE TRIGGER update_kuis_updated_at 
    BEFORE UPDATE ON kuis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Soal
DROP TRIGGER IF EXISTS update_soal_updated_at ON soal;
CREATE TRIGGER update_soal_updated_at 
    BEFORE UPDATE ON soal 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Attempt Kuis
DROP TRIGGER IF EXISTS update_attempt_kuis_updated_at ON attempt_kuis;
CREATE TRIGGER update_attempt_kuis_updated_at 
    BEFORE UPDATE ON attempt_kuis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Jawaban
DROP TRIGGER IF EXISTS update_jawaban_updated_at ON jawaban;
CREATE TRIGGER update_jawaban_updated_at 
    BEFORE UPDATE ON jawaban 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Materi
DROP TRIGGER IF EXISTS update_materi_updated_at ON materi;
CREATE TRIGGER update_materi_updated_at 
    BEFORE UPDATE ON materi 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Nilai
DROP TRIGGER IF EXISTS update_nilai_updated_at ON nilai;
CREATE TRIGGER update_nilai_updated_at 
    BEFORE UPDATE ON nilai 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventaris
DROP TRIGGER IF EXISTS update_inventaris_updated_at ON inventaris;
CREATE TRIGGER update_inventaris_updated_at 
    BEFORE UPDATE ON inventaris 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Peminjaman
DROP TRIGGER IF EXISTS update_peminjaman_updated_at ON peminjaman;
CREATE TRIGGER update_peminjaman_updated_at 
    BEFORE UPDATE ON peminjaman 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pengumuman
DROP TRIGGER IF EXISTS update_pengumuman_updated_at ON pengumuman;
CREATE TRIGGER update_pengumuman_updated_at 
    BEFORE UPDATE ON pengumuman 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BUSINESS LOGIC TRIGGERS
-- ============================================================================

-- Auto-calculate final grade
DROP TRIGGER IF EXISTS calculate_nilai_akhir ON nilai;
CREATE TRIGGER calculate_nilai_akhir
    BEFORE INSERT OR UPDATE ON nilai
    FOR EACH ROW
    EXECUTE FUNCTION calculate_final_grade();

-- Update inventory availability
DROP TRIGGER IF EXISTS update_inventaris_availability ON peminjaman;
CREATE TRIGGER update_inventaris_availability
    AFTER INSERT OR UPDATE OR DELETE ON peminjaman
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_availability();

-- Validate quiz attempt before insert
DROP TRIGGER IF EXISTS validate_attempt_before_insert ON attempt_kuis;
CREATE TRIGGER validate_attempt_before_insert
    BEFORE INSERT ON attempt_kuis
    FOR EACH ROW
    EXECUTE FUNCTION validate_quiz_attempt();

-- ============================================================================
-- AUTH TRIGGER (Auto-create user profile)
-- ============================================================================

-- Create user profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();