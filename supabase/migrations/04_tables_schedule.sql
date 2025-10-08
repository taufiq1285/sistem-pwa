-- ============================================================================
-- SCHEDULE & ATTENDANCE TABLES
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