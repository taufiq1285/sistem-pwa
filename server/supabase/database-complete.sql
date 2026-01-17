-- START OF SCRIPT --

-- ============================================================================
-- BAGIAN 1: EXTENSIONS & ENUMS (VERSI AMAN)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'mahasiswa', 'laboran'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE gender_type AS ENUM ('L', 'P'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'essay', 'short_answer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'graded', 'pending_sync'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE borrowing_status AS ENUM ('pending', 'approved', 'rejected', 'returned', 'overdue'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE equipment_condition AS ENUM ('baik', 'rusak_ringan', 'rusak_berat', 'maintenance'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE day_of_week AS ENUM ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed', 'conflict'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE conflict_strategy AS ENUM ('server_wins', 'client_wins', 'manual'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- BAGIAN 2: TABEL INTI
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TABLE IF NOT EXISTS mahasiswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nim VARCHAR(20) UNIQUE NOT NULL,
    program_studi VARCHAR(100) NOT NULL,
    angkatan INTEGER NOT NULL,
    semester INTEGER DEFAULT 1,
    phone VARCHAR(20),
    address TEXT,
    gender gender_type,
    date_of_birth DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT mahasiswa_semester_check CHECK (semester BETWEEN 1 AND 14)
);

CREATE TABLE IF NOT EXISTS dosen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nip VARCHAR(20) UNIQUE NOT NULL,
    nidn VARCHAR(20) UNIQUE,
    gelar_depan VARCHAR(50),
    gelar_belakang VARCHAR(50),
    fakultas VARCHAR(100),
    program_studi VARCHAR(100),
    phone VARCHAR(20),
    office_room VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laboran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nip VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20),
    shift VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level VARCHAR(20) DEFAULT 'standard',
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mata_kuliah (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_mk VARCHAR(20) UNIQUE NOT NULL,
    nama_mk VARCHAR(255) NOT NULL,
    sks INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    program_studi VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    silabus_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT mata_kuliah_sks_check CHECK (sks BETWEEN 1 AND 6),
    CONSTRAINT mata_kuliah_semester_check CHECK (semester BETWEEN 1 AND 14)
);

CREATE TABLE IF NOT EXISTS laboratorium (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_lab VARCHAR(50) UNIQUE NOT NULL,
    nama_lab VARCHAR(255) NOT NULL,
    kapasitas INTEGER DEFAULT 0,
    lokasi VARCHAR(255),
    fasilitas TEXT[],
    is_active BOOLEAN DEFAULT true,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT laboratorium_kapasitas_check CHECK (kapasitas >= 0)
);

CREATE TABLE IF NOT EXISTS kelas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mata_kuliah_id UUID NOT NULL REFERENCES mata_kuliah(id) ON DELETE CASCADE,
    dosen_id UUID NOT NULL REFERENCES dosen(id) ON DELETE RESTRICT,
    kode_kelas VARCHAR(10) NOT NULL,
    nama_kelas VARCHAR(100) NOT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL,
    semester_ajaran INTEGER NOT NULL,
    kuota INTEGER DEFAULT 40,
    ruangan VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT kelas_kuota_check CHECK (kuota > 0),
    CONSTRAINT kelas_semester_ajaran_check CHECK (semester_ajaran IN (1, 2))
);

CREATE TABLE IF NOT EXISTS kelas_mahasiswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(kelas_id, mahasiswa_id)
);

CREATE TABLE IF NOT EXISTS jadwal_praktikum (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    laboratorium_id UUID NOT NULL REFERENCES laboratorium(id) ON DELETE RESTRICT,
    hari day_of_week NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    minggu_ke INTEGER,
    tanggal_praktikum DATE,
    topik VARCHAR(255),
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT jadwal_jam_check CHECK (jam_selesai > jam_mulai),
    CONSTRAINT jadwal_minggu_check CHECK (minggu_ke BETWEEN 1 AND 16)
);

CREATE TABLE IF NOT EXISTS kehadiran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jadwal_id UUID NOT NULL REFERENCES jadwal_praktikum(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'hadir',
    waktu_check_in TIMESTAMPTZ,
    waktu_check_out TIMESTAMPTZ,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT kehadiran_status_check CHECK (status IN ('hadir', 'izin', 'sakit', 'alpha')),
    UNIQUE(jadwal_id, mahasiswa_id)
);

CREATE TABLE IF NOT EXISTS materi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    dosen_id UUID NOT NULL REFERENCES dosen(id) ON DELETE RESTRICT,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    tipe_file VARCHAR(50),
    file_url TEXT NOT NULL,
    file_size BIGINT,
    minggu_ke INTEGER,
    is_downloadable BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cache_version INTEGER DEFAULT 1,
    last_cached_at TIMESTAMPTZ,
    CONSTRAINT materi_minggu_check CHECK (minggu_ke BETWEEN 1 AND 16)
);

CREATE TABLE IF NOT EXISTS kuis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    dosen_id UUID NOT NULL REFERENCES dosen(id) ON DELETE RESTRICT,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    durasi_menit INTEGER NOT NULL,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 1,
    randomize_questions BOOLEAN DEFAULT false,
    randomize_options BOOLEAN DEFAULT false,
    show_results_immediately BOOLEAN DEFAULT true,
    allow_review BOOLEAN DEFAULT true,
    status quiz_status DEFAULT 'draft',
    tanggal_mulai TIMESTAMPTZ NOT NULL,
    tanggal_selesai TIMESTAMPTZ NOT NULL,
    is_offline_capable BOOLEAN DEFAULT false,
    auto_save_interval INTEGER DEFAULT 30,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    CONSTRAINT kuis_durasi_check CHECK (durasi_menit > 0),
    CONSTRAINT kuis_passing_score_check CHECK (passing_score BETWEEN 0 AND 100),
    CONSTRAINT kuis_tanggal_check CHECK (tanggal_selesai > tanggal_mulai),
    CONSTRAINT kuis_max_attempts_check CHECK (max_attempts > 0)
);

CREATE TABLE IF NOT EXISTS soal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kuis_id UUID NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
    tipe question_type NOT NULL,
    pertanyaan TEXT NOT NULL,
    poin INTEGER NOT NULL DEFAULT 1,
    urutan INTEGER NOT NULL,
    pilihan_jawaban JSONB,
    jawaban_benar TEXT,
    rubrik_penilaian JSONB,
    pembahasan TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT soal_poin_check CHECK (poin > 0),
    CONSTRAINT soal_urutan_check CHECK (urutan > 0)
);

CREATE TABLE IF NOT EXISTS attempt_kuis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kuis_id UUID NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status attempt_status DEFAULT 'in_progress',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_spent INTEGER,
    total_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    is_passed BOOLEAN,
    is_offline_attempt BOOLEAN DEFAULT false,
    sync_status sync_status DEFAULT 'synced',
    sync_attempted_at TIMESTAMPTZ,
    sync_error TEXT,
    device_id VARCHAR(255),
    last_auto_save_at TIMESTAMPTZ,
    auto_save_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT attempt_kuis_unique UNIQUE(kuis_id, mahasiswa_id, attempt_number),
    CONSTRAINT attempt_score_check CHECK (total_score >= 0),
    CONSTRAINT attempt_percentage_check CHECK (percentage BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS jawaban (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES attempt_kuis(id) ON DELETE CASCADE,
    soal_id UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
    jawaban_mahasiswa TEXT,
    jawaban_data JSONB,
    is_correct BOOLEAN,
    poin_diperoleh DECIMAL(5,2) DEFAULT 0,
    feedback TEXT,
    graded_by UUID REFERENCES dosen(id),
    graded_at TIMESTAMPTZ,
    is_auto_saved BOOLEAN DEFAULT false,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, soal_id)
);

CREATE TABLE IF NOT EXISTS nilai (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    nilai_kuis DECIMAL(5,2) DEFAULT 0,
    nilai_tugas DECIMAL(5,2) DEFAULT 0,
    nilai_uts DECIMAL(5,2) DEFAULT 0,
    nilai_uas DECIMAL(5,2) DEFAULT 0,
    nilai_praktikum DECIMAL(5,2) DEFAULT 0,
    nilai_kehadiran DECIMAL(5,2) DEFAULT 0,
    nilai_akhir DECIMAL(5,2),
    nilai_huruf VARCHAR(2),
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mahasiswa_id, kelas_id),
    CONSTRAINT nilai_range_check CHECK (
        nilai_kuis BETWEEN 0 AND 100 AND
        nilai_tugas BETWEEN 0 AND 100 AND
        nilai_uts BETWEEN 0 AND 100 AND
        nilai_uas BETWEEN 0 AND 100 AND
        nilai_praktikum BETWEEN 0 AND 100 AND
        nilai_kehadiran BETWEEN 0 AND 100
    )
);

CREATE TABLE IF NOT EXISTS inventaris (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laboratorium_id UUID NOT NULL REFERENCES laboratorium(id) ON DELETE RESTRICT,
    kode_barang VARCHAR(50) UNIQUE NOT NULL,
    nama_barang VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    merk VARCHAR(100),
    spesifikasi TEXT,
    jumlah INTEGER NOT NULL DEFAULT 1,
    jumlah_tersedia INTEGER NOT NULL DEFAULT 1,
    kondisi equipment_condition DEFAULT 'baik',
    tahun_pengadaan INTEGER,
    harga_satuan DECIMAL(12,2),
    keterangan TEXT,
    foto_url TEXT,
    is_available_for_borrowing BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT inventaris_jumlah_check CHECK (jumlah >= 0),
    CONSTRAINT inventaris_tersedia_check CHECK (jumlah_tersedia >= 0 AND jumlah_tersedia <= jumlah)
);

CREATE TABLE IF NOT EXISTS peminjaman (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventaris_id UUID NOT NULL REFERENCES inventaris(id) ON DELETE RESTRICT,
    peminjam_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE RESTRICT,
    dosen_id UUID REFERENCES dosen(id) ON DELETE SET NULL,
    jumlah_pinjam INTEGER NOT NULL DEFAULT 1,
    keperluan TEXT NOT NULL,
    tanggal_pinjam DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_kembali_rencana DATE NOT NULL,
    tanggal_kembali_aktual DATE,
    status borrowing_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    kondisi_pinjam equipment_condition DEFAULT 'baik',
    kondisi_kembali equipment_condition,
    keterangan_kembali TEXT,
    denda DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT peminjaman_jumlah_check CHECK (jumlah_pinjam > 0),
    CONSTRAINT peminjaman_tanggal_check CHECK (tanggal_kembali_rencana >= tanggal_pinjam)
);

CREATE TABLE IF NOT EXISTS pengumuman (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    konten TEXT NOT NULL,
    tipe VARCHAR(50) DEFAULT 'info',
    prioritas VARCHAR(20) DEFAULT 'normal',
    penulis_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_role user_role[],
    target_kelas_id UUID REFERENCES kelas(id),
    is_active BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    tanggal_mulai DATE DEFAULT CURRENT_DATE,
    tanggal_selesai DATE,
    attachment_url TEXT,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT pengumuman_tipe_check CHECK (tipe IN ('info', 'penting', 'urgent', 'maintenance')),
    CONSTRAINT pengumuman_prioritas_check CHECK (prioritas IN ('low', 'normal', 'high'))
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT notifications_type_check CHECK (type IN ('info', 'warning', 'error', 'success', 'quiz', 'grade', 'announcement', 'booking'))
);

CREATE TABLE IF NOT EXISTS offline_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    data JSONB NOT NULL,
    status sync_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ,
    error_message TEXT,
    error_stack TEXT,
    has_conflict BOOLEAN DEFAULT false,
    conflict_data JSONB,
    conflict_resolution conflict_strategy,
    device_id VARCHAR(255),
    client_timestamp TIMESTAMPTZ,
    CONSTRAINT offline_queue_operation_check CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    CONSTRAINT offline_queue_priority_check CHECK (priority BETWEEN 1 AND 10)
);

CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status sync_status NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_summary JSONB,
    device_id VARCHAR(255),
    CONSTRAINT sync_history_type_check CHECK (sync_type IN ('manual', 'auto', 'background', 'initial'))
);

CREATE TABLE IF NOT EXISTS conflict_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_item_id UUID REFERENCES offline_queue(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    client_data JSONB NOT NULL,
    server_data JSONB NOT NULL,
    resolution_strategy conflict_strategy NOT NULL,
    resolved_data JSONB,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cache_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    data_hash VARCHAR(64),
    last_modified_at TIMESTAMPTZ,
    UNIQUE(user_id, table_name, record_id)
);

-- ============================================================================
-- BAGIAN 3: INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_user_id ON mahasiswa(user_id);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_nim ON mahasiswa(nim);
CREATE INDEX IF NOT EXISTS idx_dosen_user_id ON dosen(user_id);
CREATE INDEX IF NOT EXISTS idx_dosen_nip ON dosen(nip);
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_kode ON mata_kuliah(kode_mk);
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_prodi ON mata_kuliah(program_studi);
CREATE INDEX IF NOT EXISTS idx_kelas_mk_id ON kelas(mata_kuliah_id);
CREATE INDEX IF NOT EXISTS idx_kelas_dosen_id ON kelas(dosen_id);
CREATE INDEX IF NOT EXISTS idx_kelas_mahasiswa_kelas_id ON kelas_mahasiswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_kelas_mahasiswa_mhs_id ON kelas_mahasiswa(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas_id ON jadwal_praktikum(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_lab_id ON jadwal_praktikum(laboratorium_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_praktikum(tanggal_praktikum);
CREATE INDEX IF NOT EXISTS idx_kehadiran_jadwal_id ON kehadiran(jadwal_id);
CREATE INDEX IF NOT EXISTS idx_kehadiran_mahasiswa_id ON kehadiran(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_materi_kelas_id ON materi(kelas_id);
CREATE INDEX IF NOT EXISTS idx_materi_published ON materi(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kuis_kelas_id ON kuis(kelas_id);
CREATE INDEX IF NOT EXISTS idx_kuis_status ON kuis(status);
CREATE INDEX IF NOT EXISTS idx_kuis_tanggal_mulai ON kuis(tanggal_mulai);
CREATE INDEX IF NOT EXISTS idx_kuis_offline_capable ON kuis(is_offline_capable) WHERE is_offline_capable = true;
CREATE INDEX IF NOT EXISTS idx_soal_kuis_id ON soal(kuis_id);
CREATE INDEX IF NOT EXISTS idx_soal_urutan ON soal(kuis_id, urutan);
CREATE INDEX IF NOT EXISTS idx_attempt_kuis_id ON attempt_kuis(kuis_id);
CREATE INDEX IF NOT EXISTS idx_attempt_mahasiswa_id ON attempt_kuis(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_attempt_status ON attempt_kuis(status);
CREATE INDEX IF NOT EXISTS idx_attempt_sync_status ON attempt_kuis(sync_status) WHERE sync_status != 'synced';
CREATE INDEX IF NOT EXISTS idx_jawaban_attempt_id ON jawaban(attempt_id);
CREATE INDEX IF NOT EXISTS idx_jawaban_soal_id ON jawaban(soal_id);
CREATE INDEX IF NOT EXISTS idx_nilai_mahasiswa_id ON nilai(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_nilai_kelas_id ON nilai(kelas_id);
CREATE INDEX IF NOT EXISTS idx_inventaris_lab_id ON inventaris(laboratorium_id);
CREATE INDEX IF NOT EXISTS idx_inventaris_kode ON inventaris(kode_barang);
CREATE INDEX IF NOT EXISTS idx_inventaris_tersedia ON inventaris(is_available_for_borrowing) WHERE is_available_for_borrowing = true;
CREATE INDEX IF NOT EXISTS idx_peminjaman_inventaris_id ON peminjaman(inventaris_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_peminjam_id ON peminjaman(peminjam_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_status ON peminjaman(status);
CREATE INDEX IF NOT EXISTS idx_pengumuman_aktif ON pengumuman(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pengumuman_tanggal ON pengumuman(tanggal_mulai, tanggal_selesai);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_offline_queue_user_id ON offline_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_queue(status) WHERE status != 'synced';
CREATE INDEX IF NOT EXISTS idx_offline_queue_priority ON offline_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_offline_queue_conflict ON offline_queue(has_conflict) WHERE has_conflict = true;
CREATE INDEX IF NOT EXISTS idx_sync_history_user_id ON sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_date ON sync_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conflict_log_queue_id ON conflict_log(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_conflict_log_unresolved ON conflict_log(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cache_metadata_user_table ON cache_metadata(user_id, table_name);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_expires ON cache_metadata(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_search ON mata_kuliah USING gin(to_tsvector('indonesian', nama_mk || ' ' || COALESCE(deskripsi, '')));
CREATE INDEX IF NOT EXISTS idx_kuis_search ON kuis USING gin(to_tsvector('indonesian', judul || ' ' || COALESCE(deskripsi, '')));
CREATE INDEX IF NOT EXISTS idx_materi_search ON materi USING gin(to_tsvector('indonesian', judul || ' ' || COALESCE(deskripsi, '')));

-- ============================================================================
-- BAGIAN 4: FUNGSI & TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_final_grade()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nilai_akhir := (
        (NEW.nilai_kuis * 0.20) + (NEW.nilai_tugas * 0.15) + (NEW.nilai_uts * 0.25) +
        (NEW.nilai_uas * 0.25) + (NEW.nilai_praktikum * 0.10) + (NEW.nilai_kehadiran * 0.05)
    );
    IF NEW.nilai_akhir >= 85 THEN NEW.nilai_huruf := 'A';
    ELSIF NEW.nilai_akhir >= 80 THEN NEW.nilai_huruf := 'A-';
    ELSIF NEW.nilai_akhir >= 75 THEN NEW.nilai_huruf := 'B+';
    ELSIF NEW.nilai_akhir >= 70 THEN NEW.nilai_huruf := 'B';
    ELSIF NEW.nilai_akhir >= 65 THEN NEW.nilai_huruf := 'B-';
    ELSIF NEW.nilai_akhir >= 60 THEN NEW.nilai_huruf := 'C+';
    ELSIF NEW.nilai_akhir >= 55 THEN NEW.nilai_huruf := 'C';
    ELSIF NEW.nilai_akhir >= 50 THEN NEW.nilai_huruf := 'D';
    ELSE NEW.nilai_huruf := 'E';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_quiz_attempt()
RETURNS TRIGGER AS $$
DECLARE
    quiz_record RECORD;
    attempt_count INTEGER;
BEGIN
    SELECT * INTO quiz_record FROM kuis WHERE id = NEW.kuis_id;
    IF quiz_record.status != 'published' THEN RAISE EXCEPTION 'Quiz is not published yet'; END IF;
    IF NOW() < quiz_record.tanggal_mulai OR NOW() > quiz_record.tanggal_selesai THEN RAISE EXCEPTION 'Quiz attempt outside allowed time window'; END IF;
    SELECT COUNT(*) INTO attempt_count FROM attempt_kuis WHERE kuis_id = NEW.kuis_id AND mahasiswa_id = NEW.mahasiswa_id AND status IN ('submitted', 'graded');
    IF attempt_count >= quiz_record.max_attempts THEN RAISE EXCEPTION 'Maximum attempts reached for this quiz'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_inventory_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'approved' THEN
            UPDATE inventaris SET jumlah_tersedia = jumlah_tersedia - NEW.jumlah_pinjam WHERE id = NEW.inventaris_id;
        ELSIF NEW.status = 'returned' AND OLD.status = 'approved' THEN
            UPDATE inventaris SET jumlah_tersedia = jumlah_tersedia + NEW.jumlah_pinjam WHERE id = NEW.inventaris_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'approved' THEN
            UPDATE inventaris SET jumlah_tersedia = jumlah_tersedia + OLD.jumlah_pinjam WHERE id = OLD.inventaris_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_sync_attempt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        NEW.attempt_count := OLD.attempt_count + 1;
        NEW.last_attempt_at := NOW();
        IF NEW.attempt_count >= NEW.max_attempts THEN NEW.status := 'failed'; END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FUNGSI KRITIS UNTUK REGISTRASI
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_text TEXT;
BEGIN
  INSERT INTO public.users (id, full_name, email, role, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::user_role,
    NEW.raw_user_meta_data->>'phone'
  );
  user_role_text := NEW.raw_user_meta_data->>'role';
  IF user_role_text = 'mahasiswa' THEN
    INSERT INTO public.mahasiswa (user_id, nim, program_studi, angkatan, semester)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nim',
      NEW.raw_user_meta_data->>'program_studi',
      (NEW.raw_user_meta_data->>'angkatan')::INTEGER,
      (NEW.raw_user_meta_data->>'semester')::INTEGER
    );
  ELSIF user_role_text = 'dosen' THEN
    INSERT INTO public.dosen (user_id, nip, gelar_depan, gelar_belakang)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'nip',
        NEW.raw_user_meta_data->>'gelar_depan',
        NEW.raw_user_meta_data->>'gelar_belakang'
    );
  ELSIF user_role_text = 'laboran' THEN
    INSERT INTO public.laboran (user_id, nip)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nip');
  ELSIF user_role_text = 'admin' THEN
    INSERT INTO public.admin (user_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  
CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_mahasiswa_updated_at BEFORE UPDATE ON mahasiswa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_dosen_updated_at BEFORE UPDATE ON dosen FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_mata_kuliah_updated_at BEFORE UPDATE ON mata_kuliah FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_kelas_updated_at BEFORE UPDATE ON kelas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_jadwal_updated_at BEFORE UPDATE ON jadwal_praktikum FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_materi_updated_at BEFORE UPDATE ON materi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_kuis_updated_at BEFORE UPDATE ON kuis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_soal_updated_at BEFORE UPDATE ON soal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_attempt_updated_at BEFORE UPDATE ON attempt_kuis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_jawaban_updated_at BEFORE UPDATE ON jawaban FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_nilai_updated_at BEFORE UPDATE ON nilai FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_inventaris_updated_at BEFORE UPDATE ON inventaris FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_peminjaman_updated_at BEFORE UPDATE ON peminjaman FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_pengumuman_updated_at BEFORE UPDATE ON pengumuman FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_laboratorium_updated_at BEFORE UPDATE ON laboratorium FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER calculate_nilai_akhir BEFORE INSERT OR UPDATE ON nilai FOR EACH ROW EXECUTE FUNCTION calculate_final_grade();
CREATE OR REPLACE TRIGGER validate_attempt_before_insert BEFORE INSERT ON attempt_kuis FOR EACH ROW EXECUTE FUNCTION validate_quiz_attempt();
CREATE OR REPLACE TRIGGER update_inventaris_availability AFTER INSERT OR UPDATE OR DELETE ON peminjaman FOR EACH ROW EXECUTE FUNCTION update_inventory_availability();
CREATE OR REPLACE TRIGGER track_sync_attempts BEFORE UPDATE ON offline_queue FOR EACH ROW EXECUTE FUNCTION increment_sync_attempt();

-- ============================================================================
-- BAGIAN 5: KEBIJAKAN RLS
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboran ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_kuliah ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratorium ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_praktikum ENABLE ROW LEVEL SECURITY;
ALTER TABLE kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE kuis ENABLE ROW LEVEL SECURITY;
ALTER TABLE soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_kuis ENABLE ROW LEVEL SECURITY;
ALTER TABLE jawaban ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_metadata ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Mahasiswa can view own profile" ON mahasiswa FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('admin', 'dosen'));
CREATE POLICY "Mahasiswa can update own profile" ON mahasiswa FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage mahasiswa" ON mahasiswa FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Dosen viewable by authenticated users" ON dosen FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Dosen can update own profile" ON dosen FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage dosen" ON dosen FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Mata kuliah viewable by authenticated users" ON mata_kuliah FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin and Dosen can manage mata kuliah" ON mata_kuliah FOR ALL USING (get_user_role() IN ('admin', 'dosen'));
CREATE POLICY "Kelas viewable by authenticated users" ON kelas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view own peminjaman" ON peminjaman FOR SELECT USING (peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) OR get_user_role() IN ('admin', 'dosen', 'laboran'));
CREATE POLICY "Students can create peminjaman" ON peminjaman FOR INSERT WITH CHECK (peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()));

-- ============================================================================
-- BAGIAN 6: SEED DATA
-- ============================================================================
INSERT INTO laboratorium (kode_lab, nama_lab, kapasitas, lokasi, fasilitas) VALUES
('lab-ktd', 'Lab Keterampilan Dasar Praktik Kebidanan', 30, 'Gedung A Lantai 1', ARRAY['Phantom', 'Bed Praktik', 'Alat Kebidanan Dasar']),
('lab-anc', 'Lab ANC (Antenatal Care)', 25, 'Gedung A Lantai 1', ARRAY['Phantom Ibu Hamil', 'Doppler', 'Tensimeter', 'Timbangan']),
('lab-pnc', 'Lab PNC (Postnatal Care)', 25, 'Gedung A Lantai 2', ARRAY['Bed Pasien', 'Alat Pemeriksaan Nifas', 'Phantom Nifas']),
('lab-inc', 'Lab INC (Intranatal Care)', 20, 'Gedung A Lantai 2', ARRAY['Phantom Persalinan', 'Partus Set', 'CTG', 'Resusitasi Bayi']),
('lab-bbl', 'Lab BBL (Bayi Baru Lahir)', 20, 'Gedung A Lantai 2', ARRAY['Infant Warmer', 'Phantom Bayi', 'Timbangan Bayi', 'Alat Resusitasi']),
('lab-kb', 'Lab Pelayanan KB', 25, 'Gedung B Lantai 1', ARRAY['Phantom Pemasangan KB', 'Alat Kontrasepsi', 'Model Anatomi']),
('lab-konseling', 'Lab Konseling & Pendidikan Kesehatan', 30, 'Gedung B Lantai 1', ARRAY['Ruang Konseling', 'Media Edukasi', 'Proyektor']),
('lab-komunitas', 'Lab Kebidanan Komunitas', 25, 'Gedung B Lantai 2', ARRAY['Peralatan Kunjungan', 'Tas KIA', 'Alat Pemeriksaan Mobile']),
('lab-anak', 'Lab Bayi, Balita, Anak Prasekolah', 25, 'Gedung B Lantai 2', ARRAY['Phantom Anak', 'Alat Pemeriksaan Anak', 'Mainan Edukasi']),
('depo-alat', 'Ruangan Depo Alat', 0, 'Gedung A Lantai Ground', ARRAY['Rak Penyimpanan', 'Sistem Inventaris', 'Area Sterilisasi'])
ON CONFLICT (kode_lab) DO NOTHING;

-- ============================================================================
-- BAGIAN 7: VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW vw_kuis_statistics AS
SELECT k.id, k.judul, k.kelas_id, k.status, k.tanggal_mulai, k.tanggal_selesai,
    COUNT(DISTINCT a.id) as total_attempts,
    COUNT(DISTINCT a.mahasiswa_id) as unique_students,
    AVG(a.percentage) as avg_score,
    COUNT(DISTINCT CASE WHEN a.status = 'submitted' THEN a.id END) as submitted_count,
    COUNT(DISTINCT CASE WHEN a.status = 'in_progress' THEN a.id END) as in_progress_count
FROM kuis k LEFT JOIN attempt_kuis a ON k.id = a.kuis_id
GROUP BY k.id;

-- ============================================================================
-- BAGIAN 8: FUNGSI UTILITAS LAINNYA
-- ============================================================================
CREATE OR REPLACE FUNCTION get_active_kuis_for_mahasiswa(p_mahasiswa_id UUID)
RETURNS TABLE (kuis_id UUID, judul VARCHAR, deskripsi TEXT, durasi_menit INTEGER, tanggal_mulai TIMESTAMPTZ, tanggal_selesai TIMESTAMPTZ, attempts_taken INTEGER, max_attempts INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT k.id, k.judul, k.deskripsi, k.durasi_menit, k.tanggal_mulai, k.tanggal_selesai,
        COALESCE(COUNT(a.id)::INTEGER, 0) as attempts_taken,
        k.max_attempts
    FROM kuis k
    JOIN kelas kl ON k.kelas_id = kl.id
    JOIN kelas_mahasiswa km ON kl.id = km.kelas_id
    LEFT JOIN attempt_kuis a ON k.id = a.kuis_id AND a.mahasiswa_id = p_mahasiswa_id
    WHERE km.mahasiswa_id = p_mahasiswa_id AND k.status = 'published' AND k.tanggal_mulai <= NOW() AND k.tanggal_selesai >= NOW()
    GROUP BY k.id
    HAVING COUNT(a.id) < k.max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- END OF SCRIPT --