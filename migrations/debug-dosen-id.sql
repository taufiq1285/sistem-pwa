-- Debug: Cek user yang sedang login
-- Untuk memastikan dosen_id match

-- Jalankan ini untuk cek:
-- 1. User Alfih punya dosen_id apa?
-- 2. Apakah jadwal.dosen_id sama dengan dosen.id milik Alfih?

-- 1. Cek user Alfih dan dosen_id-nya
SELECT
  u.id as user_id,
  u.full_name,
  u.email,
  d.id as dosen_id,
  d.nidn
FROM users u
LEFT JOIN dosen d ON u.id = d.user_id
WHERE u.full_name = 'Alfih'
   OR u.email LIKE '%alfih%'
ORDER BY u.created_at DESC;

-- 2. Cek jadwal dan cocokkan dengan dosen
SELECT
  jp.id as jadwal_id,
  jp.dosen_id as jadwal_dosen_id,
  d.id as dosen_table_id,
  u.full_name as dosen_nama,
  jp.topik,
  jp.status,
  CASE
    WHEN jp.dosen_id = d.id THEN '✅ MATCH - Seharusnya muncul!'
    ELSE '❌ MISMATCH - Tidak akan muncul di list dosen!'
  END as match_status
FROM jadwal_praktikum jp
LEFT JOIN dosen d ON jp.dosen_id = d.id
LEFT JOIN users u ON d.user_id = u.id
ORDER BY jp.created_at DESC;

-- 3. Cek apakah ada issue dengan NULL dosen_id
SELECT
  id,
  dosen_id,
  topik,
  CASE
    WHEN dosen_id IS NULL THEN '❌ NULL dosen_id - Tidak punya pemilik!'
    ELSE '✅ Punya dosen_id'
  END as dosen_check
FROM jadwal_praktikum;
