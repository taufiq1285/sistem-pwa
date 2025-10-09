-- ============================================================================
-- DAY 12: SUPPORTING TABLES
-- Materials, Grades, Announcements, Inventory, Borrowing
-- ============================================================================

-- ============================================================================
-- MATERIALS & CONTENT
-- ============================================================================

-- Materi Praktikum (Learning Materials)
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
    
    -- Offline support
    cache_version INTEGER DEFAULT 1,
    last_cached_at TIMESTAMPTZ,
    
    CONSTRAINT materi_minggu_check CHECK (minggu_ke BETWEEN 1 AND 16),
    CONSTRAINT materi_file_size_check CHECK (file_size > 0)
);

-- ============================================================================
-- GRADING & ASSESSMENT
-- ============================================================================

-- Nilai (Grades)
CREATE TABLE IF NOT EXISTS nilai (
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT pengumuman_tipe_check CHECK (tipe IN ('info', 'penting', 'urgent', 'maintenance')),
    CONSTRAINT pengumuman_prioritas_check CHECK (prioritas IN ('low', 'normal', 'high'))
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT notifications_type_check CHECK (type IN ('info', 'warning', 'error', 'success', 'quiz', 'grade', 'announcement', 'booking'))
);

-- ============================================================================
-- EQUIPMENT & INVENTORY MANAGEMENT
-- ============================================================================

-- Equipment Condition Enum
DO $$ BEGIN
    CREATE TYPE equipment_condition AS ENUM ('baik', 'rusak_ringan', 'rusak_berat', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Borrowing Status Enum
DO $$ BEGIN
    CREATE TYPE borrowing_status AS ENUM ('pending', 'approved', 'rejected', 'returned', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Inventaris (Equipment Inventory)
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

-- Peminjaman Alat (Equipment Borrowing)
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
-- INDEXES FOR SUPPORTING TABLES
-- ============================================================================

-- Materials indexes
CREATE INDEX IF NOT EXISTS idx_materi_kelas_id ON materi(kelas_id);
CREATE INDEX IF NOT EXISTS idx_materi_dosen_id ON materi(dosen_id);
CREATE INDEX IF NOT EXISTS idx_materi_published ON materi(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materi_active ON materi(is_active) WHERE is_active = true;

-- Grades indexes
CREATE INDEX IF NOT EXISTS idx_nilai_mahasiswa_id ON nilai(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_nilai_kelas_id ON nilai(kelas_id);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_pengumuman_aktif ON pengumuman(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pengumuman_tanggal ON pengumuman(tanggal_mulai, tanggal_selesai);
CREATE INDEX IF NOT EXISTS idx_pengumuman_penulis ON pengumuman(penulis_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventaris_lab_id ON inventaris(laboratorium_id);
CREATE INDEX IF NOT EXISTS idx_inventaris_kode ON inventaris(kode_barang);
CREATE INDEX IF NOT EXISTS idx_inventaris_tersedia ON inventaris(is_available_for_borrowing) WHERE is_available_for_borrowing = true;
CREATE INDEX IF NOT EXISTS idx_inventaris_kondisi ON inventaris(kondisi);

-- Borrowing indexes
CREATE INDEX IF NOT EXISTS idx_peminjaman_inventaris_id ON peminjaman(inventaris_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_peminjam_id ON peminjaman(peminjam_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_status ON peminjaman(status);
CREATE INDEX IF NOT EXISTS idx_peminjaman_dosen_id ON peminjaman(dosen_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_materi_search ON materi 
USING gin(to_tsvector('indonesian', judul || ' ' || COALESCE(deskripsi, '')));

CREATE INDEX IF NOT EXISTS idx_inventaris_search ON inventaris 
USING gin(to_tsvector('indonesian', nama_barang || ' ' || COALESCE(keterangan, '')));

-- ============================================================================
-- TRIGGERS FOR SUPPORTING TABLES
-- ============================================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_materi_updated_at ON materi;
CREATE TRIGGER update_materi_updated_at BEFORE UPDATE ON materi 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nilai_updated_at ON nilai;
CREATE TRIGGER update_nilai_updated_at BEFORE UPDATE ON nilai 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pengumuman_updated_at ON pengumuman;
CREATE TRIGGER update_pengumuman_updated_at BEFORE UPDATE ON pengumuman 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventaris_updated_at ON inventaris;
CREATE TRIGGER update_inventaris_updated_at BEFORE UPDATE ON inventaris 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_peminjaman_updated_at ON peminjaman;
CREATE TRIGGER update_peminjaman_updated_at BEFORE UPDATE ON peminjaman 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR SUPPORTING TABLES
-- ============================================================================

-- Calculate final grade function
CREATE OR REPLACE FUNCTION calculate_final_grade()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Apply trigger for automatic grade calculation
DROP TRIGGER IF EXISTS calculate_nilai_akhir ON nilai;
CREATE TRIGGER calculate_nilai_akhir
    BEFORE INSERT OR UPDATE ON nilai
    FOR EACH ROW
    EXECUTE FUNCTION calculate_final_grade();

-- Update inventory availability function
CREATE OR REPLACE FUNCTION update_inventory_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
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
$$ LANGUAGE plpgsql;

-- Apply trigger for inventory management
DROP TRIGGER IF EXISTS update_inventaris_availability ON peminjaman;
CREATE TRIGGER update_inventaris_availability
    AFTER INSERT OR UPDATE OR DELETE ON peminjaman
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_availability();