-- ============================================================================
-- DAY 8-9: CORE TABLES
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Create enums with error handling
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'mahasiswa', 'laboran');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('L', 'P');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

-- Users table (extends Supabase auth.users)
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

-- Mahasiswa profiles
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
    
    CONSTRAINT mahasiswa_nim_format CHECK (nim ~* '^[0-9]{8,20}$'),
    CONSTRAINT mahasiswa_semester_check CHECK (semester BETWEEN 1 AND 14)
);

-- Dosen profiles
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT dosen_nip_format CHECK (nip ~* '^[0-9]{8,20}$')
);

-- Laboran profiles
CREATE TABLE IF NOT EXISTS laboran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nip VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20),
    shift VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin profiles
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level VARCHAR(20) DEFAULT 'standard',
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACADEMIC STRUCTURE
-- ============================================================================

-- Mata Kuliah (Courses)
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

-- Laboratorium (Laboratory Rooms)
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

-- Kelas (Classes)
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

-- Kelas Mahasiswa (Class Enrollment) - ENROLLMENTS
CREATE TABLE IF NOT EXISTS kelas_mahasiswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(kelas_id, mahasiswa_id)
);

-- ============================================================================
-- SCHEDULE
-- ============================================================================

-- Jadwal Praktikum (Lab Schedule)
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

-- ============================================================================
-- INDEXES FOR CORE TABLES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Mahasiswa indexes
CREATE INDEX idx_mahasiswa_user_id ON mahasiswa(user_id);
CREATE INDEX idx_mahasiswa_nim ON mahasiswa(nim);

-- Dosen indexes
CREATE INDEX idx_dosen_user_id ON dosen(user_id);
CREATE INDEX idx_dosen_nip ON dosen(nip);

-- Mata Kuliah indexes
CREATE INDEX idx_mata_kuliah_kode ON mata_kuliah(kode_mk);
CREATE INDEX idx_mata_kuliah_prodi ON mata_kuliah(program_studi);

-- Kelas indexes
CREATE INDEX idx_kelas_mk_id ON kelas(mata_kuliah_id);
CREATE INDEX idx_kelas_dosen_id ON kelas(dosen_id);

-- Enrollment indexes
CREATE INDEX idx_kelas_mahasiswa_kelas_id ON kelas_mahasiswa(kelas_id);
CREATE INDEX idx_kelas_mahasiswa_mhs_id ON kelas_mahasiswa(mahasiswa_id);

-- Jadwal indexes
CREATE INDEX idx_jadwal_kelas_id ON jadwal_praktikum(kelas_id);
CREATE INDEX idx_jadwal_lab_id ON jadwal_praktikum(laboratorium_id);
CREATE INDEX idx_jadwal_tanggal ON jadwal_praktikum(tanggal_praktikum);

-- ============================================================================
-- BASIC TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to core tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
DROP TRIGGER IF EXISTS update_mahasiswa_updated_at ON mahasiswa;
CREATE TRIGGER update_mahasiswa_updated_at BEFORE UPDATE ON mahasiswa 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
DROP TRIGGER IF EXISTS update_dosen_updated_at ON dosen;
CREATE TRIGGER update_dosen_updated_at BEFORE UPDATE ON dosen 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
DROP TRIGGER IF EXISTS update_mata_kuliah_updated_at ON mata_kuliah;
CREATE TRIGGER update_mata_kuliah_updated_at BEFORE UPDATE ON mata_kuliah 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
DROP TRIGGER IF EXISTS update_kelas_updated_at ON kelas;
CREATE TRIGGER update_kelas_updated_at BEFORE UPDATE ON kelas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
DROP TRIGGER IF EXISTS update_jadwal_updated_at ON jadwal_praktikum;
CREATE TRIGGER update_jadwal_updated_at BEFORE UPDATE ON jadwal_praktikum 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();