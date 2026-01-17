-- ============================================================================
-- COMPREHENSIVE DATABASE MIGRATION
-- Sistem Praktikum PWA - Current State Database Schema
-- Generated: December 15, 2024
-- ============================================================================

-- ============================================================================
-- PART 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 2: CUSTOM ENUM TYPES
-- ============================================================================

-- User role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'mahasiswa', 'laboran');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Gender type enum
DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'laki-laki', 'perempuan');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Day of week enum
DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Equipment condition enum
DO $$ BEGIN
    CREATE TYPE equipment_condition AS ENUM ('baik', 'rusak_ringan', 'rusak_berat', 'dalam_perbaikan', 'hilang');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Borrowing status enum
DO $$ BEGIN
    CREATE TYPE borrowing_status AS ENUM ('pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue', 'lost');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Quiz status enum
DO $$ BEGIN
    CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'active', 'closed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Question type enum
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('pilihan_ganda', 'multiple_choice', 'essay', 'true_false', 'short_answer', 'matching', 'fill_blank', 'file_upload');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Attempt status enum
DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'graded', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Sync status enum
DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed', 'conflict');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Conflict resolution strategy enum
DO $$ BEGIN
    CREATE TYPE conflict_strategy AS ENUM ('client_wins', 'server_wins', 'merge', 'manual', 'latest_wins');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 3: CORE USER TABLES
-- ============================================================================

-- Users table (main authentication/identity table)
CREATE TABLE IF NOT EXISTS users (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role user_role NOT NULL,
    avatar_url text,
    is_active boolean DEFAULT true,
    last_seen_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- Admin table
CREATE TABLE IF NOT EXISTS admin (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    level character varying(20) DEFAULT 'standard'::character varying,
    permissions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_pkey PRIMARY KEY (id),
    CONSTRAINT admin_user_id_key UNIQUE (user_id),
    CONSTRAINT admin_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Dosen table
CREATE TABLE IF NOT EXISTS dosen (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    nip character varying(20),
    nidn character varying(20),
    nuptk character varying(20),
    gelar_depan character varying(50),
    gelar_belakang character varying(50),
    fakultas character varying(100),
    program_studi character varying(100),
    phone character varying(20),
    office_room character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dosen_pkey PRIMARY KEY (id),
    CONSTRAINT dosen_user_id_key UNIQUE (user_id),
    CONSTRAINT dosen_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mahasiswa table
CREATE TABLE IF NOT EXISTS mahasiswa (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    nim character varying(20) NOT NULL,
    program_studi character varying(100) NOT NULL,
    angkatan integer NOT NULL,
    semester integer DEFAULT 1,
    phone character varying(20),
    address text,
    gender gender_type,
    date_of_birth date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT mahasiswa_pkey PRIMARY KEY (id),
    CONSTRAINT mahasiswa_user_id_key UNIQUE (user_id),
    CONSTRAINT mahasiswa_nim_key UNIQUE (nim),
    CONSTRAINT mahasiswa_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Laboran table
CREATE TABLE IF NOT EXISTS laboran (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    nip character varying(20) NOT NULL,
    phone character varying(20),
    shift character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT laboran_pkey PRIMARY KEY (id),
    CONSTRAINT laboran_user_id_key UNIQUE (user_id),
    CONSTRAINT laboran_nip_key UNIQUE (nip),
    CONSTRAINT laboran_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 4: ACADEMIC STRUCTURE TABLES
-- ============================================================================

-- Mata Kuliah (Courses) table
CREATE TABLE IF NOT EXISTS mata_kuliah (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    kode_mk character varying(20) NOT NULL,
    nama_mk character varying(255) NOT NULL,
    sks integer NOT NULL,
    semester integer NOT NULL,
    program_studi character varying(100) NOT NULL,
    deskripsi text,
    silabus_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT mata_kuliah_pkey PRIMARY KEY (id),
    CONSTRAINT mata_kuliah_kode_mk_key UNIQUE (kode_mk)
);

-- Kelas (Classes) table
CREATE TABLE IF NOT EXISTS kelas (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    mata_kuliah_id uuid NOT NULL,
    dosen_id uuid NOT NULL,
    kode_kelas character varying(50),
    nama_kelas character varying(100) NOT NULL,
    tahun_ajaran character varying(20) NOT NULL,
    semester_ajaran integer NOT NULL,
    kuota integer DEFAULT 40,
    ruangan character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    bobot_nilai jsonb DEFAULT '{"uas": 30, "uts": 25, "kuis": 15, "tugas": 20, "kehadiran": 5, "praktikum": 5}'::jsonb,
    CONSTRAINT kelas_pkey PRIMARY KEY (id),
    CONSTRAINT kelas_mata_kuliah_id_fkey FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE CASCADE,
    CONSTRAINT kelas_dosen_id_fkey FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE CASCADE
);

-- Kelas Mahasiswa (Class Enrollment) table
CREATE TABLE IF NOT EXISTS kelas_mahasiswa (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    kelas_id uuid NOT NULL,
    mahasiswa_id uuid NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    semester_saat_enroll integer,
    semester_terakhir integer,
    CONSTRAINT kelas_mahasiswa_pkey PRIMARY KEY (id),
    CONSTRAINT kelas_mahasiswa_unique UNIQUE (kelas_id, mahasiswa_id),
    CONSTRAINT kelas_mahasiswa_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    CONSTRAINT kelas_mahasiswa_mahasiswa_id_fkey FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- Mahasiswa Semester Audit table
CREATE TABLE IF NOT EXISTS mahasiswa_semester_audit (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    mahasiswa_id uuid NOT NULL,
    semester_lama integer NOT NULL,
    semester_baru integer NOT NULL,
    updated_by_admin_id uuid,
    updated_at timestamp without time zone DEFAULT now(),
    notes character varying,
    CONSTRAINT mahasiswa_semester_audit_pkey PRIMARY KEY (id),
    CONSTRAINT mahasiswa_semester_audit_mahasiswa_id_fkey FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
    CONSTRAINT mahasiswa_semester_audit_admin_id_fkey FOREIGN KEY (updated_by_admin_id) REFERENCES admin(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 5: LABORATORY & INVENTORY TABLES
-- ============================================================================

-- Laboratorium table
CREATE TABLE IF NOT EXISTS laboratorium (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    kode_lab character varying(50) NOT NULL,
    nama_lab character varying(255) NOT NULL,
    kapasitas integer DEFAULT 0,
    lokasi character varying(255),
    fasilitas text[],
    is_active boolean DEFAULT true,
    keterangan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT laboratorium_pkey PRIMARY KEY (id),
    CONSTRAINT laboratorium_kode_lab_key UNIQUE (kode_lab)
);

-- Inventaris (Equipment Inventory) table
CREATE TABLE IF NOT EXISTS inventaris (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    laboratorium_id uuid,
    kode_barang character varying(50) NOT NULL,
    nama_barang character varying(255) NOT NULL,
    kategori character varying(100),
    merk character varying(100),
    spesifikasi text,
    jumlah integer NOT NULL DEFAULT 1,
    jumlah_tersedia integer NOT NULL DEFAULT 1,
    kondisi equipment_condition DEFAULT 'baik'::equipment_condition,
    tahun_pengadaan integer,
    harga_satuan numeric(12,2),
    keterangan text,
    foto_url text,
    is_available_for_borrowing boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT inventaris_pkey PRIMARY KEY (id),
    CONSTRAINT inventaris_kode_barang_key UNIQUE (kode_barang),
    CONSTRAINT inventaris_laboratorium_id_fkey FOREIGN KEY (laboratorium_id) REFERENCES laboratorium(id) ON DELETE SET NULL
);

-- Peminjaman (Equipment Borrowing) table
CREATE TABLE IF NOT EXISTS peminjaman (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    inventaris_id uuid NOT NULL,
    peminjam_id uuid NOT NULL,
    peminjam_id_backup uuid,
    dosen_id uuid,
    jumlah_pinjam integer NOT NULL DEFAULT 1,
    keperluan text NOT NULL,
    tanggal_pinjam date NOT NULL DEFAULT CURRENT_DATE,
    tanggal_kembali_rencana date NOT NULL,
    tanggal_kembali_aktual date,
    status borrowing_status DEFAULT 'pending'::borrowing_status,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text,
    kondisi_pinjam equipment_condition DEFAULT 'baik'::equipment_condition,
    kondisi_kembali equipment_condition,
    keterangan_kembali text,
    denda numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT peminjaman_pkey PRIMARY KEY (id),
    CONSTRAINT peminjaman_inventaris_id_fkey FOREIGN KEY (inventaris_id) REFERENCES inventaris(id) ON DELETE RESTRICT,
    CONSTRAINT peminjaman_peminjam_id_fkey FOREIGN KEY (peminjam_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT peminjaman_dosen_id_fkey FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE SET NULL,
    CONSTRAINT peminjaman_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 6: SCHEDULING & ATTENDANCE TABLES
-- ============================================================================

-- Jadwal Praktikum (Lab Schedule) table
CREATE TABLE IF NOT EXISTS jadwal_praktikum (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    laboratorium_id uuid NOT NULL,
    kelas_id uuid NOT NULL,
    hari day_of_week NOT NULL,
    jam_mulai time without time zone NOT NULL,
    jam_selesai time without time zone NOT NULL,
    minggu_ke integer,
    tanggal_praktikum date,
    topik character varying(255),
    deskripsi text,
    catatan text,
    is_active boolean DEFAULT false,
    status character varying(20) DEFAULT 'approved'::character varying,
    cancelled_by uuid,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT jadwal_praktikum_pkey PRIMARY KEY (id),
    CONSTRAINT jadwal_praktikum_laboratorium_id_fkey FOREIGN KEY (laboratorium_id) REFERENCES laboratorium(id) ON DELETE CASCADE,
    CONSTRAINT jadwal_praktikum_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    CONSTRAINT jadwal_praktikum_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Kehadiran (Attendance) table
CREATE TABLE IF NOT EXISTS kehadiran (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    jadwal_id uuid NOT NULL,
    mahasiswa_id uuid NOT NULL,
    status character varying(20) NOT NULL DEFAULT 'hadir'::character varying,
    waktu_check_in timestamp with time zone,
    waktu_check_out timestamp with time zone,
    keterangan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kehadiran_pkey PRIMARY KEY (id),
    CONSTRAINT kehadiran_unique UNIQUE (jadwal_id, mahasiswa_id),
    CONSTRAINT kehadiran_jadwal_id_fkey FOREIGN KEY (jadwal_id) REFERENCES jadwal_praktikum(id) ON DELETE CASCADE,
    CONSTRAINT kehadiran_mahasiswa_id_fkey FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 7: LEARNING MATERIALS TABLE
-- ============================================================================

-- Materi (Learning Materials) table
CREATE TABLE IF NOT EXISTS materi (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    kelas_id uuid NOT NULL,
    dosen_id uuid NOT NULL,
    judul character varying(255) NOT NULL,
    deskripsi text,
    tipe_file character varying(50),
    file_url text NOT NULL,
    file_size bigint,
    minggu_ke integer,
    is_downloadable boolean DEFAULT true,
    download_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cache_version integer DEFAULT 1,
    last_cached_at timestamp with time zone,
    CONSTRAINT materi_pkey PRIMARY KEY (id),
    CONSTRAINT materi_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    CONSTRAINT materi_dosen_id_fkey FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 8: QUIZ & ASSESSMENT TABLES
-- ============================================================================

-- Kuis (Quiz) table
CREATE TABLE IF NOT EXISTS kuis (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    kelas_id uuid NOT NULL,
    dosen_id uuid NOT NULL,
    judul character varying(255) NOT NULL,
    deskripsi text,
    durasi_menit integer NOT NULL,
    passing_score integer DEFAULT 70,
    max_attempts integer DEFAULT 1,
    randomize_questions boolean DEFAULT false,
    randomize_options boolean DEFAULT false,
    show_results_immediately boolean DEFAULT true,
    allow_review boolean DEFAULT true,
    status quiz_status DEFAULT 'draft'::quiz_status,
    tanggal_mulai timestamp with time zone NOT NULL,
    tanggal_selesai timestamp with time zone NOT NULL,
    published_at timestamp with time zone,
    is_offline_capable boolean DEFAULT false,
    auto_save_interval integer DEFAULT 30,
    version integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kuis_pkey PRIMARY KEY (id),
    CONSTRAINT kuis_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    CONSTRAINT kuis_dosen_id_fkey FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE CASCADE
);

-- Bank Soal (Question Bank) table
CREATE TABLE IF NOT EXISTS bank_soal (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    dosen_id uuid NOT NULL,
    pertanyaan text NOT NULL,
    tipe_soal text NOT NULL,
    poin integer NOT NULL DEFAULT 1,
    opsi_jawaban jsonb,
    jawaban_benar text,
    penjelasan text,
    mata_kuliah_id uuid,
    tags text[],
    is_public boolean DEFAULT false,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bank_soal_pkey PRIMARY KEY (id),
    CONSTRAINT bank_soal_dosen_id_fkey FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE CASCADE,
    CONSTRAINT bank_soal_mata_kuliah_id_fkey FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE SET NULL
);

-- Soal (Quiz Questions) table
CREATE TABLE IF NOT EXISTS soal (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    kuis_id uuid NOT NULL,
    tipe question_type NOT NULL,
    pertanyaan text NOT NULL,
    poin integer NOT NULL DEFAULT 1,
    urutan integer NOT NULL,
    pilihan_jawaban jsonb,
    jawaban_benar text,
    rubrik_penilaian jsonb,
    pembahasan text,
    media_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT soal_pkey PRIMARY KEY (id),
    CONSTRAINT soal_kuis_id_fkey FOREIGN KEY (kuis_id) REFERENCES kuis(id) ON DELETE CASCADE
);

-- Soal Mahasiswa View table (for student-safe question view)
CREATE TABLE IF NOT EXISTS soal_mahasiswa (
    id uuid,
    kuis_id uuid,
    pertanyaan text,
    tipe_soal question_type,
    poin integer,
    urutan integer,
    opsi_jawaban jsonb,
    jawaban_benar text,
    rubrik_penilaian jsonb,
    penjelasan text,
    media_url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Attempt Kuis (Quiz Attempts) table
CREATE TABLE IF NOT EXISTS attempt_kuis (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    kuis_id uuid NOT NULL,
    mahasiswa_id uuid NOT NULL,
    attempt_number integer NOT NULL DEFAULT 1,
    status attempt_status DEFAULT 'in_progress'::attempt_status,
    started_at timestamp with time zone DEFAULT now(),
    submitted_at timestamp with time zone,
    time_spent integer,
    sisa_waktu integer,
    total_score numeric(5,2),
    total_poin numeric(5,2),
    percentage numeric(5,2),
    is_passed boolean,
    is_offline_attempt boolean DEFAULT false,
    sync_status sync_status DEFAULT 'synced'::sync_status,
    sync_attempted_at timestamp with time zone,
    sync_error text,
    device_id character varying(255),
    last_auto_save_at timestamp with time zone,
    auto_save_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    _version integer NOT NULL DEFAULT 1,
    CONSTRAINT attempt_kuis_pkey PRIMARY KEY (id),
    CONSTRAINT attempt_kuis_kuis_id_fkey FOREIGN KEY (kuis_id) REFERENCES kuis(id) ON DELETE CASCADE,
    CONSTRAINT attempt_kuis_mahasiswa_id_fkey FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- Jawaban (Quiz Answers) table
CREATE TABLE IF NOT EXISTS jawaban (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    attempt_id uuid NOT NULL,
    soal_id uuid NOT NULL,
    jawaban_mahasiswa text,
    jawaban_data jsonb,
    is_correct boolean,
    poin_diperoleh numeric(5,2) DEFAULT 0,
    feedback text,
    graded_by uuid,
    graded_at timestamp with time zone,
    is_auto_saved boolean DEFAULT false,
    saved_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    _version integer NOT NULL DEFAULT 1,
    CONSTRAINT jawaban_pkey PRIMARY KEY (id),
    CONSTRAINT jawaban_attempt_soal_unique UNIQUE (attempt_id, soal_id),
    CONSTRAINT jawaban_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES attempt_kuis(id) ON DELETE CASCADE,
    CONSTRAINT jawaban_soal_id_fkey FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE,
    CONSTRAINT jawaban_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES dosen(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 9: GRADING & SCORING TABLES
-- ============================================================================

-- Nilai (Grades) table
CREATE TABLE IF NOT EXISTS nilai (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    mahasiswa_id uuid NOT NULL,
    kelas_id uuid NOT NULL,
    nilai_kuis numeric(5,2) DEFAULT 0,
    nilai_tugas numeric(5,2) DEFAULT 0,
    nilai_uts numeric(5,2) DEFAULT 0,
    nilai_uas numeric(5,2) DEFAULT 0,
    nilai_praktikum numeric(5,2) DEFAULT 0,
    nilai_kehadiran numeric(5,2) DEFAULT 0,
    nilai_akhir numeric(5,2),
    nilai_huruf character varying(2),
    keterangan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT nilai_pkey PRIMARY KEY (id),
    CONSTRAINT nilai_unique UNIQUE (mahasiswa_id, kelas_id),
    CONSTRAINT nilai_mahasiswa_id_fkey FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
    CONSTRAINT nilai_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

-- Permintaan Perbaikan Nilai (Grade Correction Requests) table
CREATE TABLE IF NOT EXISTS permintaan_perbaikan_nilai (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    mahasiswa_id uuid NOT NULL,
    nilai_id uuid NOT NULL,
    kelas_id uuid NOT NULL,
    komponen_nilai character varying(20) NOT NULL,
    nilai_lama numeric(5,2) NOT NULL,
    nilai_usulan numeric(5,2),
    alasan_permintaan text NOT NULL,
    bukti_pendukung text[],
    status character varying(20) NOT NULL DEFAULT 'pending'::character varying,
    response_dosen text,
    nilai_baru numeric(5,2),
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT permintaan_perbaikan_nilai_pkey PRIMARY KEY (id),
    CONSTRAINT permintaan_perbaikan_nilai_mahasiswa_id_fkey FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
    CONSTRAINT permintaan_perbaikan_nilai_nilai_id_fkey FOREIGN KEY (nilai_id) REFERENCES nilai(id) ON DELETE CASCADE,
    CONSTRAINT permintaan_perbaikan_nilai_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    CONSTRAINT permintaan_perbaikan_nilai_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES dosen(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 10: COMMUNICATION TABLES
-- ============================================================================

-- Pengumuman (Announcements) table
CREATE TABLE IF NOT EXISTS pengumuman (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    judul character varying(255) NOT NULL,
    konten text NOT NULL,
    tipe character varying(50) DEFAULT 'info'::character varying,
    prioritas character varying(20) DEFAULT 'normal'::character varying,
    penulis_id uuid NOT NULL,
    target_role user_role[],
    target_kelas_id uuid,
    is_active boolean DEFAULT true,
    is_pinned boolean DEFAULT false,
    tanggal_mulai date DEFAULT CURRENT_DATE,
    tanggal_selesai date,
    attachment_url text,
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pengumuman_pkey PRIMARY KEY (id),
    CONSTRAINT pengumuman_penulis_id_fkey FOREIGN KEY (penulis_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT pengumuman_target_kelas_id_fkey FOREIGN KEY (target_kelas_id) REFERENCES kelas(id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 11: OFFLINE SYNC & CACHING TABLES
-- ============================================================================

-- Offline Queue table
CREATE TABLE IF NOT EXISTS offline_queue (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    operation character varying(20) NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id uuid,
    data jsonb NOT NULL,
    status sync_status DEFAULT 'pending'::sync_status,
    priority integer DEFAULT 5,
    attempt_count integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    created_at timestamp with time zone DEFAULT now(),
    last_attempt_at timestamp with time zone,
    synced_at timestamp with time zone,
    error_message text,
    error_stack text,
    has_conflict boolean DEFAULT false,
    conflict_data jsonb,
    conflict_resolution conflict_strategy,
    device_id character varying(255),
    client_timestamp timestamp with time zone,
    CONSTRAINT offline_queue_pkey PRIMARY KEY (id),
    CONSTRAINT offline_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conflict Log table
CREATE TABLE IF NOT EXISTS conflict_log (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    queue_item_id uuid,
    user_id uuid NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id uuid NOT NULL,
    client_data jsonb NOT NULL,
    server_data jsonb NOT NULL,
    resolution_strategy conflict_strategy NOT NULL,
    resolved_data jsonb,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    local_version integer,
    remote_version integer,
    status text DEFAULT 'pending'::text,
    winner text,
    CONSTRAINT conflict_log_pkey PRIMARY KEY (id),
    CONSTRAINT conflict_log_queue_item_id_fkey FOREIGN KEY (queue_item_id) REFERENCES offline_queue(id) ON DELETE SET NULL,
    CONSTRAINT conflict_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT conflict_log_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Sync History table
CREATE TABLE IF NOT EXISTS sync_history (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    sync_type character varying(50) NOT NULL,
    table_name character varying(100),
    records_synced integer DEFAULT 0,
    records_failed integer DEFAULT 0,
    status sync_status NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    duration_ms integer,
    error_summary jsonb,
    device_id character varying(255),
    CONSTRAINT sync_history_pkey PRIMARY KEY (id),
    CONSTRAINT sync_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cache Metadata table
CREATE TABLE IF NOT EXISTS cache_metadata (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id uuid NOT NULL,
    cache_key character varying(255) NOT NULL,
    cached_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    version integer DEFAULT 1,
    data_hash character varying(64),
    last_modified_at timestamp with time zone,
    CONSTRAINT cache_metadata_pkey PRIMARY KEY (id),
    CONSTRAINT cache_metadata_unique UNIQUE (user_id, cache_key),
    CONSTRAINT cache_metadata_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 12: AUDIT & SECURITY TABLES
-- ============================================================================

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    user_role text NOT NULL,
    user_email text,
    user_name text,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    resource_description text,
    old_values jsonb,
    new_values jsonb,
    changes jsonb,
    ip_address inet,
    user_agent text,
    request_path text,
    request_method text,
    success boolean DEFAULT true,
    error_message text,
    error_code text,
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- Audit Logs Archive table
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    user_role text NOT NULL,
    user_email text,
    user_name text,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    resource_description text,
    old_values jsonb,
    new_values jsonb,
    changes jsonb,
    ip_address inet,
    user_agent text,
    request_path text,
    request_method text,
    success boolean DEFAULT true,
    error_message text,
    error_code text,
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT audit_logs_archive_pkey PRIMARY KEY (id)
);

-- Sensitive Operations table
CREATE TABLE IF NOT EXISTS sensitive_operations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    audit_log_id uuid,
    operation_type text NOT NULL,
    severity text NOT NULL,
    requires_review boolean DEFAULT false,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sensitive_operations_pkey PRIMARY KEY (id),
    CONSTRAINT sensitive_operations_audit_log_id_fkey FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id) ON DELETE SET NULL,
    CONSTRAINT sensitive_operations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 13: INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Mahasiswa indexes
CREATE INDEX IF NOT EXISTS idx_mahasiswa_nim ON mahasiswa(nim);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_program_studi ON mahasiswa(program_studi);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_angkatan ON mahasiswa(angkatan);

-- Dosen indexes
CREATE INDEX IF NOT EXISTS idx_dosen_nip ON dosen(nip);
CREATE INDEX IF NOT EXISTS idx_dosen_nidn ON dosen(nidn);

-- Kelas indexes
CREATE INDEX IF NOT EXISTS idx_kelas_mata_kuliah_id ON kelas(mata_kuliah_id);
CREATE INDEX IF NOT EXISTS idx_kelas_dosen_id ON kelas(dosen_id);
CREATE INDEX IF NOT EXISTS idx_kelas_tahun_ajaran ON kelas(tahun_ajaran);
CREATE INDEX IF NOT EXISTS idx_kelas_is_active ON kelas(is_active);

-- Kelas Mahasiswa indexes
CREATE INDEX IF NOT EXISTS idx_kelas_mahasiswa_kelas_id ON kelas_mahasiswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_kelas_mahasiswa_mahasiswa_id ON kelas_mahasiswa(mahasiswa_id);

-- Kuis indexes
CREATE INDEX IF NOT EXISTS idx_kuis_kelas_id ON kuis(kelas_id);
CREATE INDEX IF NOT EXISTS idx_kuis_dosen_id ON kuis(dosen_id);
CREATE INDEX IF NOT EXISTS idx_kuis_status ON kuis(status);
CREATE INDEX IF NOT EXISTS idx_kuis_tanggal ON kuis(tanggal_mulai, tanggal_selesai);

-- Soal indexes
CREATE INDEX IF NOT EXISTS idx_soal_kuis_id ON soal(kuis_id);
CREATE INDEX IF NOT EXISTS idx_soal_urutan ON soal(urutan);

-- Attempt Kuis indexes
CREATE INDEX IF NOT EXISTS idx_attempt_kuis_kuis_id ON attempt_kuis(kuis_id);
CREATE INDEX IF NOT EXISTS idx_attempt_kuis_mahasiswa_id ON attempt_kuis(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_attempt_kuis_status ON attempt_kuis(status);
CREATE INDEX IF NOT EXISTS idx_attempt_kuis_sync_status ON attempt_kuis(sync_status);

-- Jawaban indexes
CREATE INDEX IF NOT EXISTS idx_jawaban_attempt_id ON jawaban(attempt_id);
CREATE INDEX IF NOT EXISTS idx_jawaban_soal_id ON jawaban(soal_id);

-- Nilai indexes
CREATE INDEX IF NOT EXISTS idx_nilai_mahasiswa_id ON nilai(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_nilai_kelas_id ON nilai(kelas_id);

-- Jadwal Praktikum indexes
CREATE INDEX IF NOT EXISTS idx_jadwal_praktikum_laboratorium_id ON jadwal_praktikum(laboratorium_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_praktikum_kelas_id ON jadwal_praktikum(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_praktikum_hari ON jadwal_praktikum(hari);
CREATE INDEX IF NOT EXISTS idx_jadwal_praktikum_tanggal ON jadwal_praktikum(tanggal_praktikum);

-- Kehadiran indexes
CREATE INDEX IF NOT EXISTS idx_kehadiran_jadwal_id ON kehadiran(jadwal_id);
CREATE INDEX IF NOT EXISTS idx_kehadiran_mahasiswa_id ON kehadiran(mahasiswa_id);

-- Materi indexes
CREATE INDEX IF NOT EXISTS idx_materi_kelas_id ON materi(kelas_id);
CREATE INDEX IF NOT EXISTS idx_materi_dosen_id ON materi(dosen_id);

-- Inventaris indexes
CREATE INDEX IF NOT EXISTS idx_inventaris_laboratorium_id ON inventaris(laboratorium_id);
CREATE INDEX IF NOT EXISTS idx_inventaris_kondisi ON inventaris(kondisi);

-- Peminjaman indexes
CREATE INDEX IF NOT EXISTS idx_peminjaman_inventaris_id ON peminjaman(inventaris_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_peminjam_id ON peminjaman(peminjam_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_status ON peminjaman(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Offline Queue indexes
CREATE INDEX IF NOT EXISTS idx_offline_queue_user_id ON offline_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_queue(status);
CREATE INDEX IF NOT EXISTS idx_offline_queue_priority ON offline_queue(priority);

-- Bank Soal indexes
CREATE INDEX IF NOT EXISTS idx_bank_soal_dosen_id ON bank_soal(dosen_id);
CREATE INDEX IF NOT EXISTS idx_bank_soal_mata_kuliah_id ON bank_soal(mata_kuliah_id);
CREATE INDEX IF NOT EXISTS idx_bank_soal_is_public ON bank_soal(is_public);

-- ============================================================================
-- PART 14: TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to increment version on update
CREATE OR REPLACE FUNCTION increment_version_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW._version = COALESCE(OLD._version, 0) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate final grade
CREATE OR REPLACE FUNCTION calculate_nilai_akhir()
RETURNS TRIGGER AS $$
DECLARE
    bobot jsonb;
    nilai_akhir_calc numeric(5,2);
BEGIN
    -- Get bobot from kelas
    SELECT k.bobot_nilai INTO bobot
    FROM kelas k
    WHERE k.id = NEW.kelas_id;
    
    -- Use default if not found
    IF bobot IS NULL THEN
        bobot := '{"uas": 30, "uts": 25, "kuis": 15, "tugas": 20, "kehadiran": 5, "praktikum": 5}'::jsonb;
    END IF;
    
    -- Calculate nilai_akhir
    nilai_akhir_calc := (
        COALESCE(NEW.nilai_kuis, 0) * COALESCE((bobot->>'kuis')::numeric, 15) / 100 +
        COALESCE(NEW.nilai_tugas, 0) * COALESCE((bobot->>'tugas')::numeric, 20) / 100 +
        COALESCE(NEW.nilai_uts, 0) * COALESCE((bobot->>'uts')::numeric, 25) / 100 +
        COALESCE(NEW.nilai_uas, 0) * COALESCE((bobot->>'uas')::numeric, 30) / 100 +
        COALESCE(NEW.nilai_praktikum, 0) * COALESCE((bobot->>'praktikum')::numeric, 5) / 100 +
        COALESCE(NEW.nilai_kehadiran, 0) * COALESCE((bobot->>'kehadiran')::numeric, 5) / 100
    );
    
    NEW.nilai_akhir := ROUND(nilai_akhir_calc, 2);
    
    -- Determine letter grade
    NEW.nilai_huruf := CASE
        WHEN NEW.nilai_akhir >= 85 THEN 'A'
        WHEN NEW.nilai_akhir >= 80 THEN 'A-'
        WHEN NEW.nilai_akhir >= 75 THEN 'B+'
        WHEN NEW.nilai_akhir >= 70 THEN 'B'
        WHEN NEW.nilai_akhir >= 65 THEN 'B-'
        WHEN NEW.nilai_akhir >= 60 THEN 'C+'
        WHEN NEW.nilai_akhir >= 55 THEN 'C'
        WHEN NEW.nilai_akhir >= 50 THEN 'D'
        ELSE 'E'
    END;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- PART 15: TRIGGERS
-- ============================================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_updated_at ON admin;
CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dosen_updated_at ON dosen;
CREATE TRIGGER update_dosen_updated_at BEFORE UPDATE ON dosen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mahasiswa_updated_at ON mahasiswa;
CREATE TRIGGER update_mahasiswa_updated_at BEFORE UPDATE ON mahasiswa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_laboran_updated_at ON laboran;
CREATE TRIGGER update_laboran_updated_at BEFORE UPDATE ON laboran
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mata_kuliah_updated_at ON mata_kuliah;
CREATE TRIGGER update_mata_kuliah_updated_at BEFORE UPDATE ON mata_kuliah
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kelas_updated_at ON kelas;
CREATE TRIGGER update_kelas_updated_at BEFORE UPDATE ON kelas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_laboratorium_updated_at ON laboratorium;
CREATE TRIGGER update_laboratorium_updated_at BEFORE UPDATE ON laboratorium
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventaris_updated_at ON inventaris;
CREATE TRIGGER update_inventaris_updated_at BEFORE UPDATE ON inventaris
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_peminjaman_updated_at ON peminjaman;
CREATE TRIGGER update_peminjaman_updated_at BEFORE UPDATE ON peminjaman
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jadwal_praktikum_updated_at ON jadwal_praktikum;
CREATE TRIGGER update_jadwal_praktikum_updated_at BEFORE UPDATE ON jadwal_praktikum
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kehadiran_updated_at ON kehadiran;
CREATE TRIGGER update_kehadiran_updated_at BEFORE UPDATE ON kehadiran
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_materi_updated_at ON materi;
CREATE TRIGGER update_materi_updated_at BEFORE UPDATE ON materi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kuis_updated_at ON kuis;
CREATE TRIGGER update_kuis_updated_at BEFORE UPDATE ON kuis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_soal_updated_at ON soal;
CREATE TRIGGER update_soal_updated_at BEFORE UPDATE ON soal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attempt_kuis_updated_at ON attempt_kuis;
CREATE TRIGGER update_attempt_kuis_updated_at BEFORE UPDATE ON attempt_kuis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jawaban_updated_at ON jawaban;
CREATE TRIGGER update_jawaban_updated_at BEFORE UPDATE ON jawaban
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nilai_updated_at ON nilai;
CREATE TRIGGER update_nilai_updated_at BEFORE UPDATE ON nilai
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_soal_updated_at ON bank_soal;
CREATE TRIGGER update_bank_soal_updated_at BEFORE UPDATE ON bank_soal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pengumuman_updated_at ON pengumuman;
CREATE TRIGGER update_pengumuman_updated_at BEFORE UPDATE ON pengumuman
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_permintaan_perbaikan_nilai_updated_at ON permintaan_perbaikan_nilai;
CREATE TRIGGER update_permintaan_perbaikan_nilai_updated_at BEFORE UPDATE ON permintaan_perbaikan_nilai
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Version increment triggers for offline sync
DROP TRIGGER IF EXISTS increment_attempt_kuis_version ON attempt_kuis;
CREATE TRIGGER increment_attempt_kuis_version BEFORE UPDATE ON attempt_kuis
    FOR EACH ROW EXECUTE FUNCTION increment_version_column();

DROP TRIGGER IF EXISTS increment_jawaban_version ON jawaban;
CREATE TRIGGER increment_jawaban_version BEFORE UPDATE ON jawaban
    FOR EACH ROW EXECUTE FUNCTION increment_version_column();

-- Nilai calculation trigger
DROP TRIGGER IF EXISTS calculate_nilai_akhir_trigger ON nilai;
CREATE TRIGGER calculate_nilai_akhir_trigger BEFORE INSERT OR UPDATE ON nilai
    FOR EACH ROW EXECUTE FUNCTION calculate_nilai_akhir();

-- ============================================================================
-- PART 16: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboran ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_kuliah ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratorium ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_praktikum ENABLE ROW LEVEL SECURITY;
ALTER TABLE kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE kuis ENABLE ROW LEVEL SECURITY;
ALTER TABLE soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_kuis ENABLE ROW LEVEL SECURITY;
ALTER TABLE jawaban ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 16.1: HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is dosen
CREATE OR REPLACE FUNCTION is_dosen()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'dosen');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is mahasiswa
CREATE OR REPLACE FUNCTION is_mahasiswa()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'mahasiswa');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is laboran
CREATE OR REPLACE FUNCTION is_laboran()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'laboran');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current dosen_id
CREATE OR REPLACE FUNCTION get_dosen_id()
RETURNS uuid AS $$
BEGIN
    RETURN (SELECT id FROM dosen WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current mahasiswa_id
CREATE OR REPLACE FUNCTION get_mahasiswa_id()
RETURNS uuid AS $$
BEGIN
    RETURN (SELECT id FROM mahasiswa WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if mahasiswa enrolled in kelas
CREATE OR REPLACE FUNCTION is_enrolled_in_kelas(p_kelas_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM kelas_mahasiswa km
        JOIN mahasiswa m ON m.id = km.mahasiswa_id
        WHERE km.kelas_id = p_kelas_id
        AND m.user_id = auth.uid()
        AND km.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if dosen owns kelas
CREATE OR REPLACE FUNCTION owns_kelas(p_kelas_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM kelas k
        JOIN dosen d ON d.id = k.dosen_id
        WHERE k.id = p_kelas_id
        AND d.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 16.2: RLS POLICIES - USERS TABLE
-- ============================================================================

-- Users: Everyone can read basic user info
DROP POLICY IF EXISTS "users_select_all" ON users;
CREATE POLICY "users_select_all" ON users
    FOR SELECT USING (true);

-- Users: Users can update their own profile
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users: Admin can manage all users
DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users
    FOR ALL USING (is_admin());

-- ============================================================================
-- PART 16.3: RLS POLICIES - ADMIN TABLE
-- ============================================================================

DROP POLICY IF EXISTS "admin_select_all" ON admin;
CREATE POLICY "admin_select_all" ON admin
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "admin_manage" ON admin;
CREATE POLICY "admin_manage" ON admin
    FOR ALL USING (is_admin());

-- ============================================================================
-- PART 16.4: RLS POLICIES - DOSEN TABLE
-- ============================================================================

DROP POLICY IF EXISTS "dosen_select_all" ON dosen;
CREATE POLICY "dosen_select_all" ON dosen
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "dosen_update_own" ON dosen;
CREATE POLICY "dosen_update_own" ON dosen
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "dosen_admin_manage" ON dosen;
CREATE POLICY "dosen_admin_manage" ON dosen
    FOR ALL USING (is_admin());

-- ============================================================================
-- PART 16.5: RLS POLICIES - MAHASISWA TABLE
-- ============================================================================

DROP POLICY IF EXISTS "mahasiswa_select_all" ON mahasiswa;
CREATE POLICY "mahasiswa_select_all" ON mahasiswa
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "mahasiswa_update_own" ON mahasiswa;
CREATE POLICY "mahasiswa_update_own" ON mahasiswa
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mahasiswa_admin_manage" ON mahasiswa;
CREATE POLICY "mahasiswa_admin_manage" ON mahasiswa
    FOR ALL USING (is_admin());

-- ============================================================================
-- PART 16.6: RLS POLICIES - LABORAN TABLE
-- ============================================================================

DROP POLICY IF EXISTS "laboran_select_all" ON laboran;
CREATE POLICY "laboran_select_all" ON laboran
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "laboran_update_own" ON laboran;
CREATE POLICY "laboran_update_own" ON laboran
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "laboran_admin_manage" ON laboran;
CREATE POLICY "laboran_admin_manage" ON laboran
    FOR ALL USING (is_admin());

-- ============================================================================
-- PART 16.7: RLS POLICIES - MATA KULIAH TABLE
-- ============================================================================

DROP POLICY IF EXISTS "mata_kuliah_select_all" ON mata_kuliah;
CREATE POLICY "mata_kuliah_select_all" ON mata_kuliah
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "mata_kuliah_admin_manage" ON mata_kuliah;
CREATE POLICY "mata_kuliah_admin_manage" ON mata_kuliah
    FOR ALL USING (is_admin());

-- ============================================================================
-- PART 16.8: RLS POLICIES - KELAS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "kelas_select_all" ON kelas;
CREATE POLICY "kelas_select_all" ON kelas
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "kelas_dosen_manage" ON kelas;
CREATE POLICY "kelas_dosen_manage" ON kelas
    FOR ALL USING (
        is_admin() OR 
        (is_dosen() AND dosen_id = get_dosen_id())
    );

-- ============================================================================
-- PART 16.9: RLS POLICIES - KELAS MAHASISWA TABLE
-- ============================================================================

DROP POLICY IF EXISTS "kelas_mahasiswa_select" ON kelas_mahasiswa;
CREATE POLICY "kelas_mahasiswa_select" ON kelas_mahasiswa
    FOR SELECT USING (
        is_admin() OR
        is_dosen() OR
        mahasiswa_id = get_mahasiswa_id()
    );

DROP POLICY IF EXISTS "kelas_mahasiswa_insert" ON kelas_mahasiswa;
CREATE POLICY "kelas_mahasiswa_insert" ON kelas_mahasiswa
    FOR INSERT WITH CHECK (
        is_admin() OR
        owns_kelas(kelas_id)
    );

DROP POLICY IF EXISTS "kelas_mahasiswa_update" ON kelas_mahasiswa;
CREATE POLICY "kelas_mahasiswa_update" ON kelas_mahasiswa
    FOR UPDATE USING (
        is_admin() OR
        owns_kelas(kelas_id)
    );

DROP POLICY IF EXISTS "kelas_mahasiswa_delete" ON kelas_mahasiswa;
CREATE POLICY "kelas_mahasiswa_delete" ON kelas_mahasiswa
    FOR DELETE USING (
        is_admin() OR
        owns_kelas(kelas_id)
    );

-- ============================================================================
-- PART 16.10: RLS POLICIES - LABORATORIUM TABLE
-- ============================================================================

DROP POLICY IF EXISTS "laboratorium_select_all" ON laboratorium;
CREATE POLICY "laboratorium_select_all" ON laboratorium
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "laboratorium_manage" ON laboratorium;
CREATE POLICY "laboratorium_manage" ON laboratorium
    FOR ALL USING (is_admin() OR is_laboran());

-- ============================================================================
-- PART 16.11: RLS POLICIES - INVENTARIS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "inventaris_select_all" ON inventaris;
CREATE POLICY "inventaris_select_all" ON inventaris
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "inventaris_manage" ON inventaris;
CREATE POLICY "inventaris_manage" ON inventaris
    FOR ALL USING (is_admin() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'laboran'));

-- ============================================================================
-- PART 16.12: RLS POLICIES - PEMINJAMAN TABLE
-- ============================================================================

DROP POLICY IF EXISTS "peminjaman_select" ON peminjaman;
CREATE POLICY "peminjaman_select" ON peminjaman
    FOR SELECT USING (
        is_admin() OR
        is_laboran() OR
        peminjam_id = auth.uid()
    );

DROP POLICY IF EXISTS "peminjaman_insert" ON peminjaman;
CREATE POLICY "peminjaman_insert" ON peminjaman
    FOR INSERT WITH CHECK (
        peminjam_id = auth.uid() OR is_admin() OR is_laboran()
    );

DROP POLICY IF EXISTS "peminjaman_update" ON peminjaman;
CREATE POLICY "peminjaman_update" ON peminjaman
    FOR UPDATE USING (
        is_admin() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'laboran') OR
        (peminjam_id = auth.uid() AND status = 'pending')
    );

DROP POLICY IF EXISTS "peminjaman_delete" ON peminjaman;
CREATE POLICY "peminjaman_delete" ON peminjaman
    FOR DELETE USING (is_admin() OR is_laboran());

-- ============================================================================
-- PART 16.13: RLS POLICIES - JADWAL PRAKTIKUM TABLE
-- ============================================================================

DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;
CREATE POLICY "jadwal_praktikum_select_all" ON jadwal_praktikum
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "jadwal_praktikum_manage" ON jadwal_praktikum;
CREATE POLICY "jadwal_praktikum_manage" ON jadwal_praktikum
    FOR ALL USING (
        is_admin() OR 
        is_laboran() OR
        owns_kelas(kelas_id)
    );

-- ============================================================================
-- PART 16.14: RLS POLICIES - KEHADIRAN TABLE
-- ============================================================================

DROP POLICY IF EXISTS "kehadiran_select" ON kehadiran;
CREATE POLICY "kehadiran_select" ON kehadiran
    FOR SELECT USING (
        is_admin() OR
        is_laboran() OR
        is_dosen() OR
        mahasiswa_id = get_mahasiswa_id()
    );

DROP POLICY IF EXISTS "kehadiran_manage" ON kehadiran;
CREATE POLICY "kehadiran_manage" ON kehadiran
    FOR ALL USING (
        is_admin() OR 
        is_laboran() OR
        is_dosen()
    );

-- ============================================================================
-- PART 16.15: RLS POLICIES - MATERI TABLE
-- ============================================================================

DROP POLICY IF EXISTS "materi_select" ON materi;
CREATE POLICY "materi_select" ON materi
    FOR SELECT USING (
        is_admin() OR
        is_dosen() OR
        is_enrolled_in_kelas(kelas_id)
    );

DROP POLICY IF EXISTS "materi_manage" ON materi;
CREATE POLICY "materi_manage" ON materi
    FOR ALL USING (
        is_admin() OR
        dosen_id = get_dosen_id()
    );

-- ============================================================================
-- PART 16.16: RLS POLICIES - KUIS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "kuis_select" ON kuis;
CREATE POLICY "kuis_select" ON kuis
    FOR SELECT USING (
        is_admin() OR
        dosen_id = get_dosen_id() OR
        (is_enrolled_in_kelas(kelas_id) AND status IN ('published', 'active', 'closed'))
    );

DROP POLICY IF EXISTS "kuis_insert" ON kuis;
CREATE POLICY "kuis_insert" ON kuis
    FOR INSERT WITH CHECK (
        is_admin() OR
        (is_dosen() AND dosen_id = get_dosen_id())
    );

DROP POLICY IF EXISTS "kuis_update" ON kuis;
CREATE POLICY "kuis_update" ON kuis
    FOR UPDATE USING (
        is_admin() OR
        dosen_id = get_dosen_id()
    );

DROP POLICY IF EXISTS "kuis_delete" ON kuis;
CREATE POLICY "kuis_delete" ON kuis
    FOR DELETE USING (
        is_admin() OR
        (dosen_id = get_dosen_id() AND status = 'draft')
    );

-- ============================================================================
-- PART 16.17: RLS POLICIES - SOAL TABLE
-- ============================================================================

DROP POLICY IF EXISTS "soal_select" ON soal;
CREATE POLICY "soal_select" ON soal
    FOR SELECT USING (
        is_admin() OR
        EXISTS (SELECT 1 FROM kuis k WHERE k.id = kuis_id AND k.dosen_id = get_dosen_id()) OR
        EXISTS (
            SELECT 1 FROM kuis k 
            WHERE k.id = kuis_id 
            AND is_enrolled_in_kelas(k.kelas_id)
            AND k.status IN ('published', 'active', 'closed')
        )
    );

DROP POLICY IF EXISTS "soal_manage" ON soal;
CREATE POLICY "soal_manage" ON soal
    FOR ALL USING (
        is_admin() OR
        EXISTS (SELECT 1 FROM kuis k WHERE k.id = kuis_id AND k.dosen_id = get_dosen_id())
    );

-- ============================================================================
-- PART 16.18: RLS POLICIES - BANK SOAL TABLE
-- ============================================================================

DROP POLICY IF EXISTS "bank_soal_select" ON bank_soal;
CREATE POLICY "bank_soal_select" ON bank_soal
    FOR SELECT USING (
        is_admin() OR
        dosen_id = get_dosen_id() OR
        is_public = true
    );

DROP POLICY IF EXISTS "bank_soal_manage" ON bank_soal;
CREATE POLICY "bank_soal_manage" ON bank_soal
    FOR ALL USING (
        is_admin() OR
        dosen_id = get_dosen_id()
    );

-- ============================================================================
-- PART 16.19: RLS POLICIES - ATTEMPT KUIS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "attempt_kuis_select" ON attempt_kuis;
CREATE POLICY "attempt_kuis_select" ON attempt_kuis
    FOR SELECT USING (
        is_admin() OR
        EXISTS (SELECT 1 FROM kuis k WHERE k.id = kuis_id AND k.dosen_id = get_dosen_id()) OR
        mahasiswa_id = get_mahasiswa_id()
    );

DROP POLICY IF EXISTS "attempt_kuis_insert" ON attempt_kuis;
CREATE POLICY "attempt_kuis_insert" ON attempt_kuis
    FOR INSERT WITH CHECK (
        is_admin() OR
        (is_mahasiswa() AND mahasiswa_id = get_mahasiswa_id())
    );

DROP POLICY IF EXISTS "attempt_kuis_update" ON attempt_kuis;
CREATE POLICY "attempt_kuis_update" ON attempt_kuis
    FOR UPDATE USING (
        is_admin() OR
        EXISTS (SELECT 1 FROM kuis k WHERE k.id = kuis_id AND k.dosen_id = get_dosen_id()) OR
        (mahasiswa_id = get_mahasiswa_id() AND status = 'in_progress')
    );

DROP POLICY IF EXISTS "attempt_kuis_delete" ON attempt_kuis;
CREATE POLICY "attempt_kuis_delete" ON attempt_kuis
    FOR DELETE USING (is_admin());

-- ============================================================================
-- PART 16.20: RLS POLICIES - JAWABAN TABLE
-- ============================================================================

DROP POLICY IF EXISTS "jawaban_select" ON jawaban;
CREATE POLICY "jawaban_select" ON jawaban
    FOR SELECT USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM attempt_kuis a 
            JOIN kuis k ON k.id = a.kuis_id 
            WHERE a.id = attempt_id 
            AND k.dosen_id = get_dosen_id()
        ) OR
        EXISTS (
            SELECT 1 FROM attempt_kuis a 
            WHERE a.id = attempt_id 
            AND a.mahasiswa_id = get_mahasiswa_id()
        )
    );

DROP POLICY IF EXISTS "jawaban_insert" ON jawaban;
CREATE POLICY "jawaban_insert" ON jawaban
    FOR INSERT WITH CHECK (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM attempt_kuis a 
            WHERE a.id = attempt_id 
            AND a.mahasiswa_id = get_mahasiswa_id()
            AND a.status = 'in_progress'
        )
    );

DROP POLICY IF EXISTS "jawaban_update" ON jawaban;
CREATE POLICY "jawaban_update" ON jawaban
    FOR UPDATE USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM attempt_kuis a 
            JOIN kuis k ON k.id = a.kuis_id 
            WHERE a.id = attempt_id 
            AND k.dosen_id = get_dosen_id()
        ) OR
        EXISTS (
            SELECT 1 FROM attempt_kuis a 
            WHERE a.id = attempt_id 
            AND a.mahasiswa_id = get_mahasiswa_id()
            AND a.status = 'in_progress'
        )
    );

DROP POLICY IF EXISTS "jawaban_delete" ON jawaban;
CREATE POLICY "jawaban_delete" ON jawaban
    FOR DELETE USING (is_admin());

-- ============================================================================
-- PART 16.21: RLS POLICIES - NILAI TABLE
-- ============================================================================

DROP POLICY IF EXISTS "nilai_select" ON nilai;
CREATE POLICY "nilai_select" ON nilai
    FOR SELECT USING (
        is_admin() OR
        owns_kelas(kelas_id) OR
        mahasiswa_id = get_mahasiswa_id()
    );

DROP POLICY IF EXISTS "nilai_manage" ON nilai;
CREATE POLICY "nilai_manage" ON nilai
    FOR ALL USING (
        is_admin() OR
        owns_kelas(kelas_id)
    );

-- ============================================================================
-- PART 16.22: RLS POLICIES - PERMINTAAN PERBAIKAN NILAI TABLE
-- ============================================================================

DROP POLICY IF EXISTS "permintaan_perbaikan_nilai_select" ON permintaan_perbaikan_nilai;
CREATE POLICY "permintaan_perbaikan_nilai_select" ON permintaan_perbaikan_nilai
    FOR SELECT USING (
        is_admin() OR
        owns_kelas(kelas_id) OR
        mahasiswa_id = get_mahasiswa_id()
    );

DROP POLICY IF EXISTS "permintaan_perbaikan_nilai_insert" ON permintaan_perbaikan_nilai;
CREATE POLICY "permintaan_perbaikan_nilai_insert" ON permintaan_perbaikan_nilai
    FOR INSERT WITH CHECK (
        is_admin() OR
        mahasiswa_id = get_mahasiswa_id()
    );

DROP POLICY IF EXISTS "permintaan_perbaikan_nilai_update" ON permintaan_perbaikan_nilai;
CREATE POLICY "permintaan_perbaikan_nilai_update" ON permintaan_perbaikan_nilai
    FOR UPDATE USING (
        is_admin() OR
        owns_kelas(kelas_id) OR
        (mahasiswa_id = get_mahasiswa_id() AND status = 'pending')
    );

DROP POLICY IF EXISTS "permintaan_perbaikan_nilai_delete" ON permintaan_perbaikan_nilai;
CREATE POLICY "permintaan_perbaikan_nilai_delete" ON permintaan_perbaikan_nilai
    FOR DELETE USING (is_admin());

-- ============================================================================
-- PART 16.23: RLS POLICIES - PENGUMUMAN TABLE
-- ============================================================================

DROP POLICY IF EXISTS "pengumuman_select" ON pengumuman;
CREATE POLICY "pengumuman_select" ON pengumuman
    FOR SELECT USING (
        is_active = true OR
        is_admin() OR
        penulis_id = auth.uid()
    );

DROP POLICY IF EXISTS "pengumuman_manage" ON pengumuman;
CREATE POLICY "pengumuman_manage" ON pengumuman
    FOR ALL USING (
        is_admin() OR
        penulis_id = auth.uid()
    );

-- ============================================================================
-- PART 16.24: RLS POLICIES - NOTIFICATIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
    FOR INSERT WITH CHECK (is_admin() OR is_dosen() OR is_laboran());

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications
    FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- PART 16.25: RLS POLICIES - OFFLINE SYNC TABLES
-- ============================================================================

-- Offline Queue
DROP POLICY IF EXISTS "offline_queue_own" ON offline_queue;
CREATE POLICY "offline_queue_own" ON offline_queue
    FOR ALL USING (user_id = auth.uid() OR is_admin());

-- Conflict Log
DROP POLICY IF EXISTS "conflict_log_own" ON conflict_log;
CREATE POLICY "conflict_log_own" ON conflict_log
    FOR ALL USING (user_id = auth.uid() OR is_admin());

-- Sync History
DROP POLICY IF EXISTS "sync_history_own" ON sync_history;
CREATE POLICY "sync_history_own" ON sync_history
    FOR ALL USING (user_id = auth.uid() OR is_admin());

-- Cache Metadata
DROP POLICY IF EXISTS "cache_metadata_own" ON cache_metadata;
CREATE POLICY "cache_metadata_own" ON cache_metadata
    FOR ALL USING (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- PART 16.26: RLS POLICIES - AUDIT LOGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "audit_logs_admin_only" ON audit_logs;
CREATE POLICY "audit_logs_admin_only" ON audit_logs
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_all" ON audit_logs;
CREATE POLICY "audit_logs_insert_all" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 17: COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Main user authentication and identity table';
COMMENT ON TABLE admin IS 'Administrator profiles with extended permissions';
COMMENT ON TABLE dosen IS 'Lecturer/instructor profiles';
COMMENT ON TABLE mahasiswa IS 'Student profiles';
COMMENT ON TABLE laboran IS 'Laboratory staff profiles';
COMMENT ON TABLE mata_kuliah IS 'Course/subject definitions';
COMMENT ON TABLE kelas IS 'Class instances for each course per semester';
COMMENT ON TABLE kelas_mahasiswa IS 'Student enrollment in classes';
COMMENT ON TABLE laboratorium IS 'Laboratory rooms';
COMMENT ON TABLE inventaris IS 'Laboratory equipment inventory';
COMMENT ON TABLE peminjaman IS 'Equipment borrowing records';
COMMENT ON TABLE jadwal_praktikum IS 'Practicum/lab session schedules';
COMMENT ON TABLE kehadiran IS 'Student attendance records';
COMMENT ON TABLE materi IS 'Learning materials and resources';
COMMENT ON TABLE kuis IS 'Quiz/assessment definitions';
COMMENT ON TABLE soal IS 'Quiz questions';
COMMENT ON TABLE bank_soal IS 'Question bank for reusable questions';
COMMENT ON TABLE attempt_kuis IS 'Student quiz attempts';
COMMENT ON TABLE jawaban IS 'Student answers to quiz questions';
COMMENT ON TABLE nilai IS 'Student grades';
COMMENT ON TABLE permintaan_perbaikan_nilai IS 'Grade correction requests';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE pengumuman IS 'Announcements';
COMMENT ON TABLE offline_queue IS 'Offline operation queue for sync';
COMMENT ON TABLE conflict_log IS 'Sync conflict resolution log';
COMMENT ON TABLE sync_history IS 'Synchronization history';
COMMENT ON TABLE cache_metadata IS 'Cache metadata for offline support';
COMMENT ON TABLE audit_logs IS 'System audit trail';
COMMENT ON TABLE audit_logs_archive IS 'Archived audit logs';
COMMENT ON TABLE sensitive_operations IS 'Sensitive operation tracking';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
