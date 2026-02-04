-- ============================================================================
-- CEK STRUKTUR TABEL KUIS
-- ============================================================================

-- 1. Lihat struktur tabel kuis (kolom apa saja)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kuis'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Lihat semua kuis dengan kolom kategori/jenis
SELECT
  id,
  judul,
  deskripsi,
  kategori,
  jenis,
  STATUS,
  created_at
FROM kuis
ORDER BY created_at DESC;

-- 3. Cek nilai unik di kolom kategori/jenis (untuk tahu cara membedakan)
SELECT DISTINCT kategori
FROM kuis
WHERE kategori IS NOT NULL;

-- 4. Cek apakah ada kolom is_tugas_praktikum atau sejenis
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kuis'
  AND table_schema = 'public'
  AND (
    column_name LIKE '%tugas%'
    OR column_name LIKE '%praktikum%'
    OR column_name LIKE '%jenis%'
    OR column_name LIKE '%type%'
  );
