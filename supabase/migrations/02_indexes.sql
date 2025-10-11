-- ============================================================================
-- MIGRATION 02: INDEXES
-- Performance optimization indexes
-- ============================================================================

-- ============================================================================
-- USERS & PROFILES INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_mahasiswa_user_id ON mahasiswa(user_id);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_nim ON mahasiswa(nim);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_program_studi ON mahasiswa(program_studi);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_angkatan ON mahasiswa(angkatan);

CREATE INDEX IF NOT EXISTS idx_dosen_user_id ON dosen(user_id);
CREATE INDEX IF NOT EXISTS idx_dosen_nip ON dosen(nip);

CREATE INDEX IF NOT EXISTS idx_laboran_user_id ON laboran(user_id);
CREATE INDEX IF NOT EXISTS idx_laboran_nip ON laboran(nip);

CREATE INDEX IF NOT EXISTS idx_admin_user_id ON admin(user_id);

-- ============================================================================
-- ACADEMIC SYSTEM INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_mata_kuliah_kode ON mata_kuliah(kode_mk);
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_program_studi ON mata_kuliah(program_studi);
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_active ON mata_kuliah(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_laboratorium_kode ON laboratorium(kode_lab);
CREATE INDEX IF NOT EXISTS idx_laboratorium_active ON laboratorium(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_kelas_mata_kuliah ON kelas(mata_kuliah_id);
CREATE INDEX IF NOT EXISTS idx_kelas_dosen ON kelas(dosen_id);
CREATE INDEX IF NOT EXISTS idx_kelas_tahun_semester ON kelas(tahun_ajaran, semester_ajaran);
CREATE INDEX IF NOT EXISTS idx_kelas_active ON kelas(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_kelas_mahasiswa_kelas ON kelas_mahasiswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_kelas_mahasiswa_mahasiswa ON kelas_mahasiswa(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_kelas_mahasiswa_status ON kelas_mahasiswa(status);

CREATE INDEX IF NOT EXISTS idx_jadwal_kelas ON jadwal_praktikum(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_lab ON jadwal_praktikum(laboratorium_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_hari ON jadwal_praktikum(hari);
CREATE INDEX IF NOT EXISTS idx_jadwal_active ON jadwal_praktikum(is_active) WHERE is_active = true;

-- ============================================================================
-- QUIZ SYSTEM INDEXES (CRITICAL FOR OFFLINE)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_kuis_kelas ON kuis(kelas_id);
CREATE INDEX IF NOT EXISTS idx_kuis_dosen ON kuis(dosen_id);
CREATE INDEX IF NOT EXISTS idx_kuis_status ON kuis(status);
CREATE INDEX IF NOT EXISTS idx_kuis_tanggal ON kuis(tanggal_mulai, tanggal_selesai);
CREATE INDEX IF NOT EXISTS idx_kuis_active ON kuis(status) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_soal_kuis ON soal(kuis_id);
CREATE INDEX IF NOT EXISTS idx_soal_tipe ON soal(tipe);
CREATE INDEX IF NOT EXISTS idx_soal_urutan ON soal(kuis_id, urutan);

CREATE INDEX IF NOT EXISTS idx_attempt_kuis ON attempt_kuis(kuis_id);
CREATE INDEX IF NOT EXISTS idx_attempt_mahasiswa ON attempt_kuis(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_attempt_status ON attempt_kuis(status);
CREATE INDEX IF NOT EXISTS idx_attempt_offline ON attempt_kuis(is_offline) WHERE is_offline = true;
CREATE INDEX IF NOT EXISTS idx_attempt_sync ON attempt_kuis(sync_status) WHERE sync_status != 'synced';
CREATE INDEX IF NOT EXISTS idx_attempt_mahasiswa_kuis ON attempt_kuis(mahasiswa_id, kuis_id);

CREATE INDEX IF NOT EXISTS idx_jawaban_attempt ON jawaban(attempt_id);
CREATE INDEX IF NOT EXISTS idx_jawaban_soal ON jawaban(soal_id);
CREATE INDEX IF NOT EXISTS idx_jawaban_offline ON jawaban(is_offline) WHERE is_offline = true;
CREATE INDEX IF NOT EXISTS idx_jawaban_sync ON jawaban(sync_status) WHERE sync_status != 'synced';

-- ============================================================================
-- MATERIALS & GRADES INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_materi_kelas ON materi(kelas_id);
CREATE INDEX IF NOT EXISTS idx_materi_dosen ON materi(dosen_id);
CREATE INDEX IF NOT EXISTS idx_materi_published ON materi(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materi_active ON materi(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_nilai_mahasiswa ON nilai(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_nilai_kelas ON nilai(kelas_id);
CREATE INDEX IF NOT EXISTS idx_nilai_mahasiswa_kelas ON nilai(mahasiswa_id, kelas_id);

-- ============================================================================
-- INVENTORY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_inventaris_lab ON inventaris(laboratorium_id);
CREATE INDEX IF NOT EXISTS idx_inventaris_kode ON inventaris(kode_barang);
CREATE INDEX IF NOT EXISTS idx_inventaris_tersedia ON inventaris(is_available_for_borrowing) WHERE is_available_for_borrowing = true;
CREATE INDEX IF NOT EXISTS idx_inventaris_kondisi ON inventaris(kondisi);

CREATE INDEX IF NOT EXISTS idx_peminjaman_inventaris ON peminjaman(inventaris_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_peminjam ON peminjaman(peminjam_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_status ON peminjaman(status);
CREATE INDEX IF NOT EXISTS idx_peminjaman_dosen ON peminjaman(dosen_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_tanggal ON peminjaman(tanggal_pinjam, tanggal_kembali_rencana);

-- ============================================================================
-- ANNOUNCEMENTS & NOTIFICATIONS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pengumuman_penulis ON pengumuman(penulis_id);
CREATE INDEX IF NOT EXISTS idx_pengumuman_aktif ON pengumuman(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pengumuman_tanggal ON pengumuman(tanggal_mulai, tanggal_selesai);
CREATE INDEX IF NOT EXISTS idx_pengumuman_pinned ON pengumuman(is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_materi_search ON materi 
USING gin(to_tsvector('indonesian', judul || ' ' || COALESCE(deskripsi, '')));

CREATE INDEX IF NOT EXISTS idx_inventaris_search ON inventaris 
USING gin(to_tsvector('indonesian', nama_barang || ' ' || COALESCE(keterangan, '')));

CREATE INDEX IF NOT EXISTS idx_pengumuman_search ON pengumuman 
USING gin(to_tsvector('indonesian', judul || ' ' || konten));