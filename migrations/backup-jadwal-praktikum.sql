-- Backup Script: Jadwal Praktikum
-- Run this to export all jadwal_praktikum data before testing
-- Output format: JSON with all related data

-- 1. Backup semua jadwal praktikum
SELECT
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
  updated_at,
  created_by,
  updated_by
FROM jadwal_praktikum
ORDER BY created_at DESC;

-- 2. Backup dengan relasi (dosen, kelas, laboratorium)
SELECT
  jp.id,
  jp.topik,
  jp.tanggal_praktikum,
  jp.jam_mulai,
  jp.jam_selesai,
  jp.status,
  jp.is_active,
  -- Dosen info
  d.nama as dosen_nama,
  d.nidn,
  -- Kelas info
  k.nama as kelas_nama,
  k.kode as kelas_kode,
  -- Lab info
  l.nama as lab_nama,
  l.kode as lab_kode,
  jp.created_at
FROM jadwal_praktikum jp
LEFT JOIN dosen d ON jp.dosen_id = d.id
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
ORDER BY jp.created_at DESC;

-- 3. Backup untuk restore (INSERT statements)
-- Copy output from this query and save as restore-jadwal.sql
SELECT
  'INSERT INTO jadwal_praktikum (id, dosen_id, kelas_id, laboratorium_id, topik, deskripsi, tanggal_praktikum, jam_mulai, jam_selesai, hari, status, is_active, created_at, updated_at, created_by, updated_by) VALUES (' ||
  '''' || id || ''',' ||
  '''' || dosen_id || ''',' ||
  '''' || kelas_id || ''',' ||
  '''' || laboratorium_id || ''',' ||
  '''' || REPLACE(topik, '''', '''''') || ''',' ||
  '''' || COALESCE(REPLACE(deskripsi, '''', ''''''), '') || ''',' ||
  '''' || tanggal_praktikum || ''',' ||
  '''' || jam_mulai || ''',' ||
  '''' || jam_selesai || ''',' ||
  '''' || hari || ''',' ||
  '''' || status || ''',' ||
  is_active || ',' ||
  '''' || created_at || ''',' ||
  '''' || updated_at || ''',' ||
  '''' || created_by || ''',' ||
  '''' || updated_by || '''' ||
  ');' as restore_statement
FROM jadwal_praktikum
ORDER BY created_at DESC;

-- 4. Check total count
SELECT
  COUNT(*) as total_jadwal,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive
FROM jadwal_praktikum;
