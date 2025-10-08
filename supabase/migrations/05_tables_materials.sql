-- ============================================================================
-- MATERIALS & CONTENT TABLES
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