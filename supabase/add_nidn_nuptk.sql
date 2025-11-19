-- ============================================================================
-- ADD NIDN & NUPTK to DOSEN TABLE
-- Mengganti NIP dengan NIDN/NUPTK untuk dosen
-- ============================================================================

-- STEP 1: Tambahkan kolom NIDN dan NUPTK
ALTER TABLE public.dosen
ADD COLUMN IF NOT EXISTS nidn VARCHAR(20),
ADD COLUMN IF NOT EXISTS nuptk VARCHAR(20);

-- STEP 2: Buat NIDN sebagai UNIQUE (karena ini identifier utama dosen)
-- Drop unique constraint dari NIP (karena NIP tidak wajib untuk dosen)
ALTER TABLE public.dosen
DROP CONSTRAINT IF EXISTS dosen_nip_key;

-- Tambahkan unique constraint ke NIDN
ALTER TABLE public.dosen
ADD CONSTRAINT dosen_nidn_key UNIQUE (nidn);

-- STEP 3: Ubah NIP jadi NULLABLE (karena dosen pakai NIDN, bukan NIP)
ALTER TABLE public.dosen
ALTER COLUMN nip DROP NOT NULL;

-- STEP 4: Update data existing - Pindahkan NIP ke NIDN
-- (Untuk dosen yang sudah ada, anggap NIP mereka sebenarnya adalah NIDN)
UPDATE public.dosen
SET nidn = nip,
    nip = NULL  -- Kosongkan NIP
WHERE nidn IS NULL;

-- STEP 5: Verifikasi struktur table
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'dosen'
AND column_name IN ('nip', 'nidn', 'nuptk')
ORDER BY ordinal_position;

-- STEP 6: Cek data dosen yang sudah ada
SELECT
    d.id,
    u.email,
    u.full_name,
    d.nip,
    d.nidn,
    d.nuptk,
    d.gelar_depan,
    d.gelar_belakang
FROM public.dosen d
JOIN public.users u ON d.user_id = u.id
ORDER BY u.email;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- NIDN (Nomor Induk Dosen Nasional) - 10 digit
-- Format: DDMMYYKKNNN
--   DD   = Tanggal lahir
--   MM   = Bulan lahir
--   YY   = 2 digit tahun lahir terakhir
--   KK   = Kode PT
--   NNN  = Nomor urut
--
-- NUPTK (Nomor Unik Pendidik dan Tenaga Kependidikan) - 16 digit
-- Format: XXXXYYYYMMDDNNNN
--
-- NIP (Nomor Induk Pegawai) - Opsional untuk PNS
-- ============================================================================
