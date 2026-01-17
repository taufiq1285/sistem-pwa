-- ============================================================================
-- CREATE MISSING TABLES & FIX ISSUES
-- Jalankan di Supabase SQL Editor untuk membuat tabel yang hilang
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE JADWAL (PALING PENTING)
-- ============================================================================
CREATE TABLE IF NOT EXISTS jadwal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  kelas text, -- backward compatibility
  laboratorium_id uuid NOT NULL REFERENCES laboratorium(id),
  tanggal_praktikum date NOT NULL,
  hari varchar(20),
  jam_mulai time NOT NULL,
  jam_selesai time NOT NULL,
  minggu_ke integer,
  topik text,
  deskripsi text,
  catatan text,
  is_active boolean DEFAULT true,
  
  -- NEW: Approval Workflow
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  cancelled_by uuid REFERENCES users(id),
  cancelled_at timestamptz,
  cancellation_reason text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(kelas_id, tanggal_praktikum, jam_mulai, jam_selesai)
);

-- Enable RLS
ALTER TABLE jadwal ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas_id ON jadwal(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_laboratorium_id ON jadwal(laboratorium_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal(tanggal_praktikum);
CREATE INDEX IF NOT EXISTS idx_jadwal_status ON jadwal(status);

-- ============================================================================
-- 2. CREATE TABLE SOAL_KUIS (YANG HILANG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS soal_kuis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kuis_id uuid NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
  nomor_soal integer NOT NULL,
  tipe_soal varchar(50) NOT NULL CHECK (tipe_soal IN ('multiple_choice', 'essay', 'true_false', 'matching')),
  pertanyaan text NOT NULL,
  rubrik text, -- untuk essay
  bobot_nilai numeric(5,2) DEFAULT 1.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(kuis_id, nomor_soal)
);

ALTER TABLE soal_kuis ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_soal_kuis_kuis_id ON soal_kuis(kuis_id);

-- ============================================================================
-- 3. CREATE TABLE JAWABAN_KUIS (YANG HILANG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS jawaban_kuis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soal_kuis_id uuid NOT NULL REFERENCES soal_kuis(id) ON DELETE CASCADE,
  kuis_id uuid NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
  nomor_pilihan integer, -- untuk multiple choice
  teks_jawaban text NOT NULL,
  is_correct boolean DEFAULT false,
  penjelasan text,
  urutan_tampil integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jawaban_kuis ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_jawaban_kuis_soal_id ON jawaban_kuis(soal_kuis_id);
CREATE INDEX IF NOT EXISTS idx_jawaban_kuis_kuis_id ON jawaban_kuis(kuis_id);

-- ============================================================================
-- 4. CREATE TABLE KATEGORI_INVENTARIS (YANG HILANG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS kategori_inventaris (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kategori varchar(100) NOT NULL UNIQUE,
  deskripsi text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kategori_inventaris ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE TABLE PENILAIAN (YANG HILANG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS penilaian (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mata_kuliah_id uuid NOT NULL REFERENCES mata_kuliah(id) ON DELETE CASCADE,
  nama_penilaian varchar(100) NOT NULL,
  deskripsi text,
  bobot_total numeric(5,2) DEFAULT 100.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(mata_kuliah_id, nama_penilaian)
);

ALTER TABLE penilaian ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE TABLE KOMPONEN_NILAI (YANG HILANG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS komponen_nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  penilaian_id uuid NOT NULL REFERENCES penilaian(id) ON DELETE CASCADE,
  nama_komponen varchar(100) NOT NULL,
  bobot numeric(5,2) NOT NULL,
  deskripsi text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(penilaian_id, nama_komponen)
);

ALTER TABLE komponen_nilai ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. CREATE TABLE NILAI_MAHASISWA (YANG HILANG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS nilai_mahasiswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id uuid NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  kelas_id uuid NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  komponen_nilai_id uuid NOT NULL REFERENCES komponen_nilai(id) ON DELETE CASCADE,
  nilai numeric(5,2),
  catatan text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(mahasiswa_id, kelas_id, komponen_nilai_id)
);

ALTER TABLE nilai_mahasiswa ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_nilai_mahasiswa_mahasiswa_id ON nilai_mahasiswa(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_nilai_mahasiswa_kelas_id ON nilai_mahasiswa(kelas_id);

-- ============================================================================
-- 8. CREATE TABLE NOTIFIKASI (YANG HILANG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifikasi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  judul varchar(255) NOT NULL,
  pesan text NOT NULL,
  tipe varchar(50) DEFAULT 'info' CHECK (tipe IN ('info', 'warning', 'error', 'success')),
  is_read boolean DEFAULT false,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notifikasi ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifikasi_user_id ON notifikasi(user_id);
CREATE INDEX IF NOT EXISTS idx_notifikasi_created_at ON notifikasi(created_at);

-- ============================================================================
-- 9. FIX: ADD MISSING COLUMN 'status' TO USERS
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- ============================================================================
-- 10. ADD MISSING COLUMNS TO JADWAL IF NOT EXISTS
-- ============================================================================
ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES users(id);
ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS kelas_id uuid REFERENCES kelas(id) ON DELETE CASCADE;

-- ============================================================================
-- 11. CREATE FUNCTION FOR UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 12. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================
DROP TRIGGER IF EXISTS set_updated_at_jadwal ON jadwal;
CREATE TRIGGER set_updated_at_jadwal BEFORE UPDATE ON jadwal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_soal_kuis ON soal_kuis;
CREATE TRIGGER set_updated_at_soal_kuis BEFORE UPDATE ON soal_kuis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_jawaban_kuis ON jawaban_kuis;
CREATE TRIGGER set_updated_at_jawaban_kuis BEFORE UPDATE ON jawaban_kuis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_kategori_inventaris ON kategori_inventaris;
CREATE TRIGGER set_updated_at_kategori_inventaris BEFORE UPDATE ON kategori_inventaris
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_penilaian ON penilaian;
CREATE TRIGGER set_updated_at_penilaian BEFORE UPDATE ON penilaian
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_komponen_nilai ON komponen_nilai;
CREATE TRIGGER set_updated_at_komponen_nilai BEFORE UPDATE ON komponen_nilai
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_nilai_mahasiswa ON nilai_mahasiswa;
CREATE TRIGGER set_updated_at_nilai_mahasiswa BEFORE UPDATE ON nilai_mahasiswa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_notifikasi ON notifikasi;
CREATE TRIGGER set_updated_at_notifikasi BEFORE UPDATE ON notifikasi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- Database migration complete! 
-- All missing tables have been created.
-- All missing columns have been added.
-- Triggers and functions are in place.
