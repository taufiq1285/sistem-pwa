-- ============================================================================
-- ACADEMIC STRUCTURE TABLES
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