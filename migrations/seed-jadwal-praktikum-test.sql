-- Development Test Data: Seed data untuk testing conflict detection
-- Data ini untuk mensimulasikan scenario double booking

-- Catatan: Ganti [DOSEN_ID_1], [DOSEN_ID_2], [KELAS_ID], [LAB_ID] dengan ID yang valid dari database Anda

-- 1. Cek ID yang tersedia
-- Jalankan query ini dulu untuk mendapatkan ID yang valid:

-- Cek dosen
-- SELECT id, nama, nidn FROM dosen LIMIT 5;

-- Cek kelas
-- SELECT id, nama, kode FROM kelas LIMIT 5;

-- Cek laboratorium
-- SELECT id, nama, kode FROM laboratorium LIMIT 5;

-- 2. Insert test data - Skenario: Dosen A booking lab terlebih dahulu
-- Ganti UUID di bawah dengan ID yang valid dari database Anda

INSERT INTO jadwal_praktikum (
  id,
  dosen_id,
  kelas_id,
  laboratorium_id,
  topik,
  deskripsi,
  tanggal_praktikum,
  jam_mulai,
  jam_selesai,
  hari,
  status,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Auto generate UUID
  'paste-dosen-id-1-disini', -- Ganti dengan dosen_id valid
  'paste-kelas-id-disini', -- Ganti dengan kelas_id valid
  'paste-lab-id-disini', -- Ganti dengan laboratorium_id valid
  'Praktikum Biologi Dasar',
  'Testing conflict detection - jadwal pertama',
  '2026-02-15', -- Tanggal praktikum
  '08:00', -- Jam mulai
  '10:00', -- Jam selesai
  'senin', -- Hari
  'pending', -- Status pending (menunggu approval laboran)
  true, -- Active
  NOW(), -- created_at
  NOW() -- updated_at
);

-- 3. Verifikasi data terinsert
SELECT
  jp.id,
  jp.topik,
  jp.tanggal_praktikum,
  jp.jam_mulai,
  jp.jam_selesai,
  jp.status,
  d.nama as dosen_nama,
  l.nama as lab_nama
FROM jadwal_praktikum jp
LEFT JOIN dosen d ON jp.dosen_id = d.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
ORDER BY jp.created_at DESC
LIMIT 5;
