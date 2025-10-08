-- ============================================================================
-- SISTEM PRAKTIKUM PWA - DATABASE SCHEMA
-- Supabase PostgreSQL Database
-- Single Source of Truth
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================================
-- SECTION 2: ENUMS
-- ============================================================================

-- User Roles
CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'mahasiswa', 'laboran');

-- Gender
CREATE TYPE gender_type AS ENUM ('L', 'P');

-- Quiz Status
CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived');

-- Question Types
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'essay', 'short_answer');

-- Quiz Attempt Status
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'graded', 'pending_sync');

-- Borrowing Status
CREATE TYPE borrowing_status AS ENUM ('pending', 'approved', 'rejected', 'returned', 'overdue');

-- Equipment Condition
CREATE TYPE equipment_condition AS ENUM ('baik', 'rusak_ringan', 'rusak_berat', 'maintenance');

-- Day of Week
CREATE TYPE day_of_week AS ENUM ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu');

-- Sync Status
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed', 'conflict');

-- Conflict Resolution Strategy
CREATE TYPE conflict_strategy AS ENUM ('server_wins', 'client_wins', 'manual');


-- ============================================================================
-- SECTION 3: CORE TABLES
-- ============================================================================

-- ============================================================================
-- 3.1 Users & Authentication
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Indexes
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Mahasiswa profiles
CREATE TABLE mahasiswa (
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
    
    CONSTRAINT mahasiswa_nim_format CHECK (nim ~* '^[0-9]{8,20}$'),
    CONSTRAINT mahasiswa_semester_check CHECK (semester BETWEEN 1 AND 14)
);

-- Dosen profiles
CREATE TABLE dosen (
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT dosen_nip_format CHECK (nip ~* '^[0-9]{8,20}$')
);

-- Laboran profiles
CREATE TABLE laboran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nip VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20),
    shift VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin profiles
CREATE TABLE admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level VARCHAR(20) DEFAULT 'standard',
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- 3.2 Academic Structure
-- ============================================================================

-- Mata Kuliah (Courses)
CREATE TABLE mata_kuliah (
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

-- Laboratorium (Laboratory Rooms)
CREATE TABLE laboratorium (
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

-- Kelas (Classes)
CREATE TABLE kelas (
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

-- Kelas Mahasiswa (Class Enrollment)
CREATE TABLE kelas_mahasiswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(kelas_id, mahasiswa_id)
);


-- ============================================================================
-- 3.3 Schedule Management
-- ============================================================================

-- Jadwal Praktikum (Lab Schedule)
CREATE TABLE jadwal_praktikum (
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

-- Attendance (Kehadiran)
CREATE TABLE kehadiran (
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


-- ============================================================================
-- 3.4 Materials & Content
-- ============================================================================

-- Materi Praktikum (Learning Materials)
CREATE TABLE materi (
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
    
    -- Offline support
    cache_version INTEGER DEFAULT 1,
    last_cached_at TIMESTAMPTZ,
    
    CONSTRAINT materi_minggu_check CHECK (minggu_ke BETWEEN 1 AND 16),
    CONSTRAINT materi_file_size_check CHECK (file_size > 0)
);


-- ============================================================================
-- 3.5 Quiz System (CRITICAL - Offline Capable)
-- ============================================================================

-- Kuis (Quizzes)
CREATE TABLE kuis (
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
    
    -- Scheduling
    tanggal_mulai TIMESTAMPTZ NOT NULL,
    tanggal_selesai TIMESTAMPTZ NOT NULL,
    
    -- Offline support
    is_offline_capable BOOLEAN DEFAULT false,
    auto_save_interval INTEGER DEFAULT 30, -- seconds
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    CONSTRAINT kuis_durasi_check CHECK (durasi_menit > 0),
    CONSTRAINT kuis_passing_score_check CHECK (passing_score BETWEEN 0 AND 100),
    CONSTRAINT kuis_tanggal_check CHECK (tanggal_selesai > tanggal_mulai),
    CONSTRAINT kuis_max_attempts_check CHECK (max_attempts > 0)
);

-- Soal (Questions)
CREATE TABLE soal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kuis_id UUID NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
    tipe question_type NOT NULL,
    pertanyaan TEXT NOT NULL,
    poin INTEGER NOT NULL DEFAULT 1,
    urutan INTEGER NOT NULL,
    
    -- Options for multiple choice/true-false
    pilihan_jawaban JSONB, -- [{text: "", isCorrect: boolean, feedback: ""}]
    
    -- For essay/short answer
    jawaban_benar TEXT, -- For short answer
    rubrik_penilaian JSONB, -- For essay grading
    
    pembahasan TEXT,
    media_url TEXT, -- Image/audio/video for question
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT soal_poin_check CHECK (poin > 0),
    CONSTRAINT soal_urutan_check CHECK (urutan > 0)
);

-- Attempt Kuis (Quiz Attempts)
CREATE TABLE attempt_kuis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kuis_id UUID NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status attempt_status DEFAULT 'in_progress',
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_spent INTEGER, -- seconds
    
    -- Scoring
    total_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    is_passed BOOLEAN,
    
    -- Offline support
    is_offline_attempt BOOLEAN DEFAULT false,
    sync_status sync_status DEFAULT 'synced',
    sync_attempted_at TIMESTAMPTZ,
    sync_error TEXT,
    device_id VARCHAR(255),
    
    -- Auto-save data
    last_auto_save_at TIMESTAMPTZ,
    auto_save_data JSONB, -- Cached answers before submission
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT attempt_kuis_unique UNIQUE(kuis_id, mahasiswa_id, attempt_number),
    CONSTRAINT attempt_score_check CHECK (total_score >= 0),
    CONSTRAINT attempt_percentage_check CHECK (percentage BETWEEN 0 AND 100)
);

-- Jawaban (Answers)
CREATE TABLE jawaban (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES attempt_kuis(id) ON DELETE CASCADE,
    soal_id UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
    jawaban_mahasiswa TEXT,
    jawaban_data JSONB, -- For complex answer types
    
    -- Scoring
    is_correct BOOLEAN,
    poin_diperoleh DECIMAL(5,2) DEFAULT 0,
    feedback TEXT,
    graded_by UUID REFERENCES dosen(id),
    graded_at TIMESTAMPTZ,
    
    -- Auto-save tracking
    is_auto_saved BOOLEAN DEFAULT false,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(attempt_id, soal_id)
);


-- ============================================================================
-- 3.6 Grading & Assessment
-- ============================================================================

-- Nilai (Grades)
CREATE TABLE nilai (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    
    -- Components
    nilai_kuis DECIMAL(5,2) DEFAULT 0,
    nilai_tugas DECIMAL(5,2) DEFAULT 0,
    nilai_uts DECIMAL(5,2) DEFAULT 0,
    nilai_uas DECIMAL(5,2) DEFAULT 0,
    nilai_praktikum DECIMAL(5,2) DEFAULT 0,
    nilai_kehadiran DECIMAL(5,2) DEFAULT 0,
    
    -- Final
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
        nilai_kehadiran BETWEEN 0 AND 100 AND
        nilai_akhir BETWEEN 0 AND 100
    )
);


-- ============================================================================
-- 3.7 Equipment & Inventory Management
-- ============================================================================

-- Inventaris (Equipment Inventory)
CREATE TABLE inventaris (
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
    
    CONSTRAINT inventaris_jumlah_check CHECK (jumlah > 0),
    CONSTRAINT inventaris_tersedia_check CHECK (jumlah_tersedia >= 0 AND jumlah_tersedia <= jumlah)
);

-- Peminjaman Alat (Equipment Borrowing)
CREATE TABLE peminjaman (
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


-- ============================================================================
-- 3.8 Announcements & Notifications
-- ============================================================================

-- Pengumuman (Announcements)
CREATE TABLE pengumuman (
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

-- Notifications
CREATE TABLE notifications (
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


-- ============================================================================
-- SECTION 4: OFFLINE SYNC SYSTEM (CRITICAL)
-- ============================================================================

-- Offline Queue (Request Queue)
CREATE TABLE offline_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request details
    operation VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    data JSONB NOT NULL,
    
    -- Sync metadata
    status sync_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ,
    
    -- Error handling
    error_message TEXT,
    error_stack TEXT,
    
    -- Conflict resolution
    has_conflict BOOLEAN DEFAULT false,
    conflict_data JSONB,
    conflict_resolution conflict_strategy,
    
    -- Device tracking
    device_id VARCHAR(255),
    client_timestamp TIMESTAMPTZ,
    
    CONSTRAINT offline_queue_operation_check CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    CONSTRAINT offline_queue_priority_check CHECK (priority BETWEEN 1 AND 10)
);

-- Sync Status Tracking
CREATE TABLE sync_history (
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

-- Conflict Log
CREATE TABLE conflict_log (
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

-- Local Cache Metadata
CREATE TABLE cache_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    
    -- Data fingerprint for change detection
    data_hash VARCHAR(64),
    last_modified_at TIMESTAMPTZ,
    
    UNIQUE(user_id, table_name, record_id)
);


-- ============================================================================
-- SECTION 5: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users & Profiles
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_mahasiswa_user_id ON mahasiswa(user_id);
CREATE INDEX idx_mahasiswa_nim ON mahasiswa(nim);
CREATE INDEX idx_dosen_user_id ON dosen(user_id);
CREATE INDEX idx_dosen_nip ON dosen(nip);

-- Academic
CREATE INDEX idx_mata_kuliah_kode ON mata_kuliah(kode_mk);
CREATE INDEX idx_mata_kuliah_prodi ON mata_kuliah(program_studi);
CREATE INDEX idx_kelas_mk_id ON kelas(mata_kuliah_id);
CREATE INDEX idx_kelas_dosen_id ON kelas(dosen_id);
CREATE INDEX idx_kelas_mahasiswa_kelas_id ON kelas_mahasiswa(kelas_id);
CREATE INDEX idx_kelas_mahasiswa_mhs_id ON kelas_mahasiswa(mahasiswa_id);

-- Schedule
CREATE INDEX idx_jadwal_kelas_id ON jadwal_praktikum(kelas_id);
CREATE INDEX idx_jadwal_lab_id ON jadwal_praktikum(laboratorium_id);
CREATE INDEX idx_jadwal_tanggal ON jadwal_praktikum(tanggal_praktikum);
CREATE INDEX idx_kehadiran_jadwal_id ON kehadiran(jadwal_id);
CREATE INDEX idx_kehadiran_mahasiswa_id ON kehadiran(mahasiswa_id);

-- Materials
CREATE INDEX idx_materi_kelas_id ON materi(kelas_id);
CREATE INDEX idx_materi_published ON materi(published_at) WHERE published_at IS NOT NULL;

-- Quiz System (Critical for offline)
CREATE INDEX idx_kuis_kelas_id ON kuis(kelas_id);
CREATE INDEX idx_kuis_status ON kuis(status);
CREATE INDEX idx_kuis_tanggal_mulai ON kuis(tanggal_mulai);
CREATE INDEX idx_kuis_offline_capable ON kuis(is_offline_capable) WHERE is_offline_capable = true;
CREATE INDEX idx_soal_kuis_id ON soal(kuis_id);
CREATE INDEX idx_soal_urutan ON soal(kuis_id, urutan);
CREATE INDEX idx_attempt_kuis_id ON attempt_kuis(kuis_id);
CREATE INDEX idx_attempt_mahasiswa_id ON attempt_kuis(mahasiswa_id);
CREATE INDEX idx_attempt_status ON attempt_kuis(status);
CREATE INDEX idx_attempt_sync_status ON attempt_kuis(sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_jawaban_attempt_id ON jawaban(attempt_id);
CREATE INDEX idx_jawaban_soal_id ON jawaban(soal_id);

-- Grades
CREATE INDEX idx_nilai_mahasiswa_id ON nilai(mahasiswa_id);
CREATE INDEX idx_nilai_kelas_id ON nilai(kelas_id);

-- Inventory
CREATE INDEX idx_inventaris_lab_id ON inventaris(laboratorium_id);
CREATE INDEX idx_inventaris_kode ON inventaris(kode_barang);
CREATE INDEX idx_inventaris_tersedia ON inventaris(is_available_for_borrowing) WHERE is_available_for_borrowing = true;
CREATE INDEX idx_peminjaman_inventaris_id ON peminjaman(inventaris_id);
CREATE INDEX idx_peminjaman_peminjam_id ON peminjaman(peminjam_id);
CREATE INDEX idx_peminjaman_status ON peminjaman(status);

-- Announcements
CREATE INDEX idx_pengumuman_aktif ON pengumuman(is_active) WHERE is_active = true;
CREATE INDEX idx_pengumuman_tanggal ON pengumuman(tanggal_mulai, tanggal_selesai);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Offline Sync (Critical)
CREATE INDEX idx_offline_queue_user_id ON offline_queue(user_id);
CREATE INDEX idx_offline_queue_status ON offline_queue(status) WHERE status != 'synced';
CREATE INDEX idx_offline_queue_priority ON offline_queue(priority DESC, created_at ASC);
CREATE INDEX idx_offline_queue_conflict ON offline_queue(has_conflict) WHERE has_conflict = true;
CREATE INDEX idx_sync_history_user_id ON sync_history(user_id);
CREATE INDEX idx_sync_history_date ON sync_history(started_at DESC);
CREATE INDEX idx_conflict_log_queue_id ON conflict_log(queue_item_id);
CREATE INDEX idx_conflict_log_unresolved ON conflict_log(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_cache_metadata_user_table ON cache_metadata(user_id, table_name);
CREATE INDEX idx_cache_metadata_expires ON cache_metadata(expires_at) WHERE expires_at IS NOT NULL;

-- Full-text search indexes
CREATE INDEX idx_mata_kuliah_search ON mata_kuliah USING gin(to_tsvector('indonesian', nama_mk || ' ' || COALESCE(deskripsi, '')));
CREATE INDEX idx_kuis_search ON kuis USING gin(to_tsvector('indonesian', judul || ' ' || COALESCE(deskripsi, '')));
CREATE INDEX idx_materi_search ON materi USING gin(to_tsvector('indonesian', judul || ' ' || COALESCE(deskripsi, '')));


-- ============================================================================
-- SECTION 6: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mahasiswa_updated_at BEFORE UPDATE ON mahasiswa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dosen_updated_at BEFORE UPDATE ON dosen FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mata_kuliah_updated_at BEFORE UPDATE ON mata_kuliah FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kelas_updated_at BEFORE UPDATE ON kelas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jadwal_updated_at BEFORE UPDATE ON jadwal_praktikum FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materi_updated_at BEFORE UPDATE ON materi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kuis_updated_at BEFORE UPDATE ON kuis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soal_updated_at BEFORE UPDATE ON soal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attempt_updated_at BEFORE UPDATE ON attempt_kuis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jawaban_updated_at BEFORE UPDATE ON jawaban FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nilai_updated_at BEFORE UPDATE ON nilai FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventaris_updated_at BEFORE UPDATE ON inventaris FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_peminjaman_updated_at BEFORE UPDATE ON peminjaman FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pengumuman_updated_at BEFORE UPDATE ON pengumuman FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_laboratorium_updated_at BEFORE UPDATE ON laboratorium FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate final grade function
CREATE OR REPLACE FUNCTION calculate_final_grade()
RETURNS TRIGGER AS $
BEGIN
    -- Calculate weighted average (customize weights as needed)
    NEW.nilai_akhir := (
        (NEW.nilai_kuis * 0.20) +
        (NEW.nilai_tugas * 0.15) +
        (NEW.nilai_uts * 0.25) +
        (NEW.nilai_uas * 0.25) +
        (NEW.nilai_praktikum * 0.10) +
        (NEW.nilai_kehadiran * 0.05)
    );
    
    -- Assign letter grade
    IF NEW.nilai_akhir >= 85 THEN
        NEW.nilai_huruf := 'A';
    ELSIF NEW.nilai_akhir >= 80 THEN
        NEW.nilai_huruf := 'A-';
    ELSIF NEW.nilai_akhir >= 75 THEN
        NEW.nilai_huruf := 'B+';
    ELSIF NEW.nilai_akhir >= 70 THEN
        NEW.nilai_huruf := 'B';
    ELSIF NEW.nilai_akhir >= 65 THEN
        NEW.nilai_huruf := 'B-';
    ELSIF NEW.nilai_akhir >= 60 THEN
        NEW.nilai_huruf := 'C+';
    ELSIF NEW.nilai_akhir >= 55 THEN
        NEW.nilai_huruf := 'C';
    ELSIF NEW.nilai_akhir >= 50 THEN
        NEW.nilai_huruf := 'D';
    ELSE
        NEW.nilai_huruf := 'E';
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_nilai_akhir
    BEFORE INSERT OR UPDATE ON nilai
    FOR EACH ROW
    EXECUTE FUNCTION calculate_final_grade();

-- Quiz attempt validation
CREATE OR REPLACE FUNCTION validate_quiz_attempt()
RETURNS TRIGGER AS $
DECLARE
    quiz_record RECORD;
    attempt_count INTEGER;
BEGIN
    -- Get quiz details
    SELECT * INTO quiz_record FROM kuis WHERE id = NEW.kuis_id;
    
    -- Check if quiz is published
    IF quiz_record.status != 'published' THEN
        RAISE EXCEPTION 'Quiz is not published yet';
    END IF;
    
    -- Check if within time window
    IF NOW() < quiz_record.tanggal_mulai OR NOW() > quiz_record.tanggal_selesai THEN
        RAISE EXCEPTION 'Quiz attempt outside allowed time window';
    END IF;
    
    -- Check max attempts
    SELECT COUNT(*) INTO attempt_count 
    FROM attempt_kuis 
    WHERE kuis_id = NEW.kuis_id 
    AND mahasiswa_id = NEW.mahasiswa_id
    AND status IN ('submitted', 'graded');
    
    IF attempt_count >= quiz_record.max_attempts THEN
        RAISE EXCEPTION 'Maximum attempts reached for this quiz';
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER validate_attempt_before_insert
    BEFORE INSERT ON attempt_kuis
    FOR EACH ROW
    EXECUTE FUNCTION validate_quiz_attempt();

-- Update inventory availability
CREATE OR REPLACE FUNCTION update_inventory_availability()
RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'approved' THEN
            UPDATE inventaris 
            SET jumlah_tersedia = jumlah_tersedia - NEW.jumlah_pinjam
            WHERE id = NEW.inventaris_id;
        ELSIF NEW.status = 'returned' AND OLD.status = 'approved' THEN
            UPDATE inventaris 
            SET jumlah_tersedia = jumlah_tersedia + NEW.jumlah_pinjam
            WHERE id = NEW.inventaris_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'approved' THEN
            UPDATE inventaris 
            SET jumlah_tersedia = jumlah_tersedia + OLD.jumlah_pinjam
            WHERE id = OLD.inventaris_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventaris_availability
    AFTER INSERT OR UPDATE OR DELETE ON peminjaman
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_availability();

-- Offline sync: increment attempt count
CREATE OR REPLACE FUNCTION increment_sync_attempt()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        NEW.attempt_count := OLD.attempt_count + 1;
        NEW.last_attempt_at := NOW();
        
        -- Mark as permanently failed if max attempts reached
        IF NEW.attempt_count >= NEW.max_attempts THEN
            NEW.status := 'failed';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER track_sync_attempts
    BEFORE UPDATE ON offline_queue
    FOR EACH ROW
    EXECUTE FUNCTION increment_sync_attempt();


-- ============================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
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

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $
    SELECT role FROM users WHERE id = auth.uid();
$ LANGUAGE sql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (get_user_role() = 'admin');

-- Mahasiswa policies
CREATE POLICY "Mahasiswa can view own profile" ON mahasiswa FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('admin', 'dosen'));
CREATE POLICY "Mahasiswa can update own profile" ON mahasiswa FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage mahasiswa" ON mahasiswa FOR ALL USING (get_user_role() = 'admin');

-- Dosen policies  
CREATE POLICY "Dosen viewable by authenticated users" ON dosen FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Dosen can update own profile" ON dosen FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage dosen" ON dosen FOR ALL USING (get_user_role() = 'admin');

-- Mata Kuliah policies
CREATE POLICY "Mata kuliah viewable by authenticated users" ON mata_kuliah FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin and Dosen can manage mata kuliah" ON mata_kuliah FOR ALL USING (get_user_role() IN ('admin', 'dosen'));

-- Kelas policies
CREATE POLICY "Kelas viewable by authenticated users" ON kelas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Dosen can manage own kelas" ON kelas FOR ALL USING (
    get_user_role() = 'dosen' AND dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all kelas" ON kelas FOR ALL USING (get_user_role() = 'admin');

-- Kelas Mahasiswa policies
CREATE POLICY "Students can view own enrollments" ON kelas_mahasiswa FOR SELECT USING (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) OR 
    get_user_role() IN ('admin', 'dosen')
);
CREATE POLICY "Admin and Dosen can manage enrollments" ON kelas_mahasiswa FOR ALL USING (get_user_role() IN ('admin', 'dosen'));

-- Laboratorium policies (viewable by all, manageable by admin/laboran)
CREATE POLICY "Laboratorium viewable by all" ON laboratorium FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin and Laboran can manage laboratorium" ON laboratorium FOR ALL USING (get_user_role() IN ('admin', 'laboran'));

-- Jadwal policies
CREATE POLICY "Jadwal viewable by authenticated users" ON jadwal_praktikum FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Dosen can manage jadwal for own kelas" ON jadwal_praktikum FOR ALL USING (
    get_user_role() = 'dosen' AND 
    kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid()))
);
CREATE POLICY "Admins can manage all jadwal" ON jadwal_praktikum FOR ALL USING (get_user_role() = 'admin');

-- Materi policies
CREATE POLICY "Materi viewable by kelas members" ON materi FOR SELECT USING (
    kelas_id IN (
        SELECT kelas_id FROM kelas_mahasiswa WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
    ) OR
    kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())) OR
    get_user_role() = 'admin'
);
CREATE POLICY "Dosen can manage materi for own kelas" ON materi FOR ALL USING (
    get_user_role() = 'dosen' AND 
    dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())
);

-- Kuis policies (CRITICAL - Offline support)
CREATE POLICY "Students can view published kuis in their kelas" ON kuis FOR SELECT USING (
    status = 'published' AND kelas_id IN (
        SELECT kelas_id FROM kelas_mahasiswa WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
    ) OR
    get_user_role() IN ('admin', 'dosen')
);
CREATE POLICY "Dosen can manage kuis for own kelas" ON kuis FOR ALL USING (
    get_user_role() = 'dosen' AND 
    dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())
);

-- Soal policies
CREATE POLICY "Students can view soal when attempting quiz" ON soal FOR SELECT USING (
    kuis_id IN (
        SELECT kuis_id FROM attempt_kuis WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) AND status = 'in_progress'
    ) OR
    get_user_role() IN ('admin', 'dosen')
);
CREATE POLICY "Dosen can manage soal for own kuis" ON soal FOR ALL USING (
    get_user_role() = 'dosen' AND 
    kuis_id IN (SELECT id FROM kuis WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid()))
);

-- Attempt Kuis policies (CRITICAL - Offline support)
CREATE POLICY "Students can view own attempts" ON attempt_kuis FOR SELECT USING (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) OR
    get_user_role() IN ('admin', 'dosen')
);
CREATE POLICY "Students can create own attempts" ON attempt_kuis FOR INSERT WITH CHECK (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
);
CREATE POLICY "Students can update own in-progress attempts" ON attempt_kuis FOR UPDATE USING (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) AND
    status = 'in_progress'
);
CREATE POLICY "Dosen can grade attempts" ON attempt_kuis FOR UPDATE USING (
    get_user_role() = 'dosen' AND
    kuis_id IN (SELECT id FROM kuis WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid()))
);

-- Jawaban policies (CRITICAL - Offline support)
CREATE POLICY "Students can view own jawaban" ON jawaban FOR SELECT USING (
    attempt_id IN (SELECT id FROM attempt_kuis WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())) OR
    get_user_role() IN ('admin', 'dosen')
);
CREATE POLICY "Students can insert own jawaban" ON jawaban FOR INSERT WITH CHECK (
    attempt_id IN (SELECT id FROM attempt_kuis WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) AND status = 'in_progress')
);
CREATE POLICY "Students can update own jawaban" ON jawaban FOR UPDATE USING (
    attempt_id IN (SELECT id FROM attempt_kuis WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) AND status = 'in_progress')
);

-- Nilai policies
CREATE POLICY "Students can view own grades" ON nilai FOR SELECT USING (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) OR
    get_user_role() IN ('admin', 'dosen')
);
CREATE POLICY "Dosen can manage grades for own kelas" ON nilai FOR ALL USING (
    get_user_role() = 'dosen' AND
    kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid()))
);

-- Inventaris policies
CREATE POLICY "Inventaris viewable by authenticated users" ON inventaris FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin and Laboran can manage inventaris" ON inventaris FOR ALL USING (get_user_role() IN ('admin', 'laboran'));

-- Peminjaman policies
CREATE POLICY "Users can view own peminjaman" ON peminjaman FOR SELECT USING (
    peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) OR
    get_user_role() IN ('admin', 'dosen', 'laboran')
);
CREATE POLICY "Students can create peminjaman" ON peminjaman FOR INSERT WITH CHECK (
    peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
);
CREATE POLICY "Students can update own pending peminjaman" ON peminjaman FOR UPDATE USING (
    peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) AND status = 'pending'
);
CREATE POLICY "Admin and Laboran can manage peminjaman" ON peminjaman FOR ALL USING (get_user_role() IN ('admin', 'laboran'));

-- Pengumuman policies
CREATE POLICY "Users can view pengumuman" ON pengumuman FOR SELECT USING (
    is_active = true AND
    (target_role IS NULL OR get_user_role() = ANY(target_role))
);
CREATE POLICY "Admin and Dosen can manage pengumuman" ON pengumuman FOR ALL USING (get_user_role() IN ('admin', 'dosen'));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Offline Queue policies (CRITICAL)
CREATE POLICY "Users can view own offline queue" ON offline_queue FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own offline queue" ON offline_queue FOR ALL USING (user_id = auth.uid());

-- Sync History policies
CREATE POLICY "Users can view own sync history" ON sync_history FOR SELECT USING (user_id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY "Users can insert own sync history" ON sync_history FOR INSERT WITH CHECK (user_id = auth.uid());

-- Conflict Log policies
CREATE POLICY "Users can view own conflicts" ON conflict_log FOR SELECT USING (user_id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY "Users can manage own conflicts" ON conflict_log FOR ALL USING (user_id = auth.uid());

-- Cache Metadata policies
CREATE POLICY "Users can manage own cache" ON cache_metadata FOR ALL USING (user_id = auth.uid());


-- ============================================================================
-- SECTION 8: SEED DATA
-- ============================================================================

-- Insert Laboratorium (9 Labs + 1 Depo Alat)
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
('depo-alat', 'Ruangan Depo Alat', 0, 'Gedung A Lantai Ground', ARRAY['Rak Penyimpanan', 'Sistem Inventaris', 'Area Sterilisasi']);

-- Insert sample admin user (password: admin123 - should be hashed in production)
-- Note: This requires creating the user in Supabase Auth first
-- INSERT INTO users (id, email, full_name, role) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'admin@praktikum.ac.id', 'Super Admin', 'admin');

-- ============================================================================
-- SECTION 9: HELPFUL VIEWS
-- ============================================================================

-- View: Kuis with attempt statistics
CREATE OR REPLACE VIEW vw_kuis_statistics AS
SELECT 
    k.id,
    k.judul,
    k.kelas_id,
    k.status,
    k.tanggal_mulai,
    k.tanggal_selesai,
    COUNT(DISTINCT a.id) as total_attempts,
    COUNT(DISTINCT a.mahasiswa_id) as unique_students,
    AVG(a.percentage) as avg_score,
    COUNT(DISTINCT CASE WHEN a.status = 'submitted' THEN a.id END) as submitted_count,
    COUNT(DISTINCT CASE WHEN a.status = 'in_progress' THEN a.id END) as in_progress_count
FROM kuis k
LEFT JOIN attempt_kuis a ON k.id = a.kuis_id
GROUP BY k.id;

-- View: Student dashboard summary
CREATE OR REPLACE VIEW vw_mahasiswa_dashboard AS
SELECT 
    m.id as mahasiswa_id,
    m.user_id,
    m.nim,
    u.full_name,
    COUNT(DISTINCT km.kelas_id) as total_kelas,
    COUNT(DISTINCT CASE WHEN j.tanggal_praktikum >= CURRENT_DATE THEN j.id END) as upcoming_jadwal,
    COUNT(DISTINCT CASE WHEN k.tanggal_selesai >= NOW() THEN k.id END) as active_kuis,
    COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as pending_peminjaman
FROM mahasiswa m
JOIN users u ON m.user_id = u.id
LEFT JOIN kelas_mahasiswa km ON m.id = km.mahasiswa_id
LEFT JOIN jadwal_praktikum j ON km.kelas_id = j.kelas_id
LEFT JOIN kuis k ON km.kelas_id = k.kelas_id
LEFT JOIN peminjaman p ON m.id = p.peminjam_id
GROUP BY m.id, m.user_id, m.nim, u.full_name;

-- View: Offline sync queue summary
CREATE OR REPLACE VIEW vw_sync_queue_summary AS
SELECT 
    user_id,
    table_name,
    operation,
    status,
    COUNT(*) as item_count,
    MIN(created_at) as oldest_item,
    MAX(created_at) as newest_item,
    SUM(CASE WHEN has_conflict THEN 1 ELSE 0 END) as conflict_count
FROM offline_queue
GROUP BY user_id, table_name, operation, status;


-- ============================================================================
-- SECTION 10: UTILITY FUNCTIONS
-- ============================================================================

-- Function: Get active kuis for mahasiswa
CREATE OR REPLACE FUNCTION get_active_kuis_for_mahasiswa(p_mahasiswa_id UUID)
RETURNS TABLE (
    kuis_id UUID,
    judul VARCHAR,
    deskripsi TEXT,
    durasi_menit INTEGER,
    tanggal_mulai TIMESTAMPTZ,
    tanggal_selesai TIMESTAMPTZ,
    attempts_taken INTEGER,
    max_attempts INTEGER
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        k.id,
        k.judul,
        k.deskripsi,
        k.durasi_menit,
        k.tanggal_mulai,
        k.tanggal_selesai,
        COALESCE(COUNT(a.id)::INTEGER, 0) as attempts_taken,
        k.max_attempts
    FROM kuis k
    JOIN kelas kl ON k.kelas_id = kl.id
    JOIN kelas_mahasiswa km ON kl.id = km.kelas_id
    LEFT JOIN attempt_kuis a ON k.id = a.kuis_id AND a.mahasiswa_id = p_mahasiswa_id
    WHERE km.mahasiswa_id = p_mahasiswa_id
        AND k.status = 'published'
        AND k.tanggal_mulai <= NOW()
        AND k.tanggal_selesai >= NOW()
    GROUP BY k.id
    HAVING COUNT(a.id) < k.max_attempts;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Process offline queue item
CREATE OR REPLACE FUNCTION process_offline_queue_item(p_queue_id UUID)
RETURNS BOOLEAN AS $
DECLARE
    v_queue_item RECORD;
    v_success BOOLEAN := false;
BEGIN
    -- Get queue item
    SELECT * INTO v_queue_item FROM offline_queue WHERE id = p_queue_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Update status to syncing
    UPDATE offline_queue SET status = 'syncing', last_attempt_at = NOW()
    WHERE id = p_queue_id;
    
    -- Process based on operation type
    -- This is a simplified version - actual implementation would handle each table
    BEGIN
        CASE v_queue_item.operation
            WHEN 'INSERT' THEN
                -- Handle insert operation
                v_success := true;
            WHEN 'UPDATE' THEN
                -- Handle update operation
                v_success := true;
            WHEN 'DELETE' THEN
                -- Handle delete operation
                v_success := true;
        END CASE;
        
        -- Mark as synced
        IF v_success THEN
            UPDATE offline_queue 
            SET status = 'synced', synced_at = NOW()
            WHERE id = p_queue_id;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Mark as failed
        UPDATE offline_queue 
        SET status = 'failed', 
            error_message = SQLERRM,
            attempt_count = attempt_count + 1
        WHERE id = p_queue_id;
        v_success := false;
    END;
    
    RETURN v_success;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean old sync history
CREATE OR REPLACE FUNCTION cleanup_old_sync_history(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sync_history 
    WHERE completed_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND status = 'synced';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get quiz attempt with answers (for offline mode)
CREATE OR REPLACE FUNCTION get_quiz_attempt_details(p_attempt_id UUID)
RETURNS JSON AS $
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'attempt', row_to_json(a.*),
        'kuis', row_to_json(k.*),
        'soal', (
            SELECT json_agg(
                json_build_object(
                    'soal', row_to_json(s.*),
                    'jawaban', (
                        SELECT row_to_json(j.*) 
                        FROM jawaban j 
                        WHERE j.attempt_id = a.id AND j.soal_id = s.id
                    )
                )
            )
            FROM soal s
            WHERE s.kuis_id = k.id
            ORDER BY s.urutan
        )
    )
    INTO result
    FROM attempt_kuis a
    JOIN kuis k ON a.kuis_id = k.id
    WHERE a.id = p_attempt_id;
    
    RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_kuis_for_mahasiswa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_quiz_attempt_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_offline_queue_item(UUID) TO authenticated;

-- Admin only functions
GRANT EXECUTE ON FUNCTION cleanup_old_sync_history(INTEGER) TO authenticated;


-- ============================================================================
-- DATABASE SETUP COMPLETE
-- ============================================================================

-- Verification queries (commented out - run manually if needed)
/*
-- Count tables
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Count indexes
SELECT COUNT(*) as index_count FROM pg_indexes WHERE schemaname = 'public';

-- Count functions
SELECT COUNT(*) as function_count FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

-- List all tables with RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
*/