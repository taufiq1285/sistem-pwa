-- ============================================================================
-- MIGRATION 01: ALL TABLES
-- Complete database schema
-- ============================================================================

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

-- Base users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'mahasiswa',
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mahasiswa (Students)
CREATE TABLE IF NOT EXISTS mahasiswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nim VARCHAR(20) UNIQUE NOT NULL,
    program_studi VARCHAR(100) NOT NULL,
    angkatan INTEGER NOT NULL,
    semester INTEGER NOT NULL DEFAULT 1,
    gender gender_type,
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    alamat TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT mahasiswa_semester_check CHECK (semester BETWEEN 1 AND 14)
);

-- Dosen (Lecturers)
CREATE TABLE IF NOT EXISTS dosen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nip VARCHAR(20) UNIQUE NOT NULL,
    gelar_depan VARCHAR(20),
    gelar_belakang VARCHAR(20),
    fakultas VARCHAR(100),
    program_studi VARCHAR(100),
    spesialisasi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Laboran (Lab Staff)
CREATE TABLE IF NOT EXISTS laboran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nip VARCHAR(20) UNIQUE NOT NULL,
    shift VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACADEMIC SYSTEM
-- ============================================================================

-- Mata Kuliah (Courses)
CREATE TABLE IF NOT EXISTS mata_kuliah (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_mk VARCHAR(20) UNIQUE NOT NULL,
    nama_mk VARCHAR(255) NOT NULL,
    sks INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    program_studi VARCHAR(100),
    deskripsi TEXT,
    silabus_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT mata_kuliah_sks_check CHECK (sks BETWEEN 1 AND 6),
    CONSTRAINT mata_kuliah_semester_check CHECK (semester BETWEEN 1 AND 14)
);

-- Laboratorium
CREATE TABLE IF NOT EXISTS laboratorium (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_lab VARCHAR(20) UNIQUE NOT NULL,
    nama_lab VARCHAR(255) NOT NULL,
    kapasitas INTEGER NOT NULL DEFAULT 0,
    lokasi VARCHAR(255),
    fasilitas TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kelas (Classes)
CREATE TABLE IF NOT EXISTS kelas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mata_kuliah_id UUID NOT NULL REFERENCES mata_kuliah(id) ON DELETE RESTRICT,
    dosen_id UUID NOT NULL REFERENCES dosen(id) ON DELETE RESTRICT,
    kode_kelas VARCHAR(10) NOT NULL,
    nama_kelas VARCHAR(255) NOT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL,
    semester_ajaran INTEGER NOT NULL,
    kuota INTEGER DEFAULT 40,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(mata_kuliah_id, kode_kelas, tahun_ajaran, semester_ajaran)
);

-- Kelas Mahasiswa (Enrollments)
CREATE TABLE IF NOT EXISTS kelas_mahasiswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    tanggal_daftar DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(kelas_id, mahasiswa_id)
);

-- Jadwal Praktikum (Schedule)
CREATE TABLE IF NOT EXISTS jadwal_praktikum (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    laboratorium_id UUID NOT NULL REFERENCES laboratorium(id) ON DELETE RESTRICT,
    hari day_of_week NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    minggu_ke INTEGER,
    topik VARCHAR(255),
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT jadwal_jam_check CHECK (jam_selesai > jam_mulai)
);

-- ============================================================================
-- QUIZ SYSTEM (OFFLINE-CAPABLE)
-- ============================================================================

-- Kuis (Quizzes)
CREATE TABLE IF NOT EXISTS kuis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    dosen_id UUID NOT NULL REFERENCES dosen(id) ON DELETE RESTRICT,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    durasi_menit INTEGER NOT NULL DEFAULT 60,
    max_attempts INTEGER DEFAULT 1,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    status quiz_status DEFAULT 'draft',
    tanggal_mulai TIMESTAMPTZ NOT NULL,
    tanggal_selesai TIMESTAMPTZ NOT NULL,
    is_shuffled BOOLEAN DEFAULT false,
    show_result BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT kuis_durasi_check CHECK (durasi_menit > 0),
    CONSTRAINT kuis_tanggal_check CHECK (tanggal_selesai > tanggal_mulai)
);

-- Soal (Questions)
CREATE TABLE IF NOT EXISTS soal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kuis_id UUID NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
    tipe question_type NOT NULL,
    pertanyaan TEXT NOT NULL,
    pilihan_a TEXT,
    pilihan_b TEXT,
    pilihan_c TEXT,
    pilihan_d TEXT,
    pilihan_e TEXT,
    jawaban_benar VARCHAR(10),
    poin DECIMAL(5,2) DEFAULT 1.00,
    urutan INTEGER NOT NULL,
    pembahasan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT soal_poin_check CHECK (poin > 0)
);

-- Attempt Kuis (Quiz Attempts)
CREATE TABLE IF NOT EXISTS attempt_kuis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kuis_id UUID NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    status attempt_status DEFAULT 'pending',
    waktu_mulai TIMESTAMPTZ DEFAULT NOW(),
    waktu_selesai TIMESTAMPTZ,
    skor DECIMAL(5,2),
    nilai_akhir DECIMAL(5,2),
    catatan TEXT,
    is_offline BOOLEAN DEFAULT false,
    sync_status sync_status DEFAULT 'synced',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jawaban (Answers)
CREATE TABLE IF NOT EXISTS jawaban (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES attempt_kuis(id) ON DELETE CASCADE,
    soal_id UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
    jawaban_mahasiswa TEXT,
    is_correct BOOLEAN,
    poin_diperoleh DECIMAL(5,2) DEFAULT 0,
    waktu_jawab TIMESTAMPTZ DEFAULT NOW(),
    is_offline BOOLEAN DEFAULT false,
    sync_status sync_status DEFAULT 'synced',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(attempt_id, soal_id)
);

-- ============================================================================
-- MATERIALS & GRADES
-- ============================================================================

-- Materi (Learning Materials)
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
    cache_version INTEGER DEFAULT 1,
    last_cached_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nilai (Grades)
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
        nilai_kehadiran BETWEEN 0 AND 100 AND
        nilai_akhir BETWEEN 0 AND 100
    )
);

-- ============================================================================
-- INVENTORY & BORROWING
-- ============================================================================

-- Inventaris (Equipment)
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
    
    CONSTRAINT inventaris_jumlah_check CHECK (jumlah > 0),
    CONSTRAINT inventaris_tersedia_check CHECK (jumlah_tersedia >= 0 AND jumlah_tersedia <= jumlah)
);

-- Peminjaman (Borrowing)
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

-- ============================================================================
-- ANNOUNCEMENTS & NOTIFICATIONS
-- ============================================================================

-- Pengumuman (Announcements)
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);