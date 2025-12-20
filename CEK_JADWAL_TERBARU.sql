-- Check recent jadwal entries to see if saves are working
SELECT
  jp.id,
  jp.tanggal_praktikum,
  jp.jam_mulai,
  jp.jam_selesai,
  jp.topik,
  jp.status,
  jp.created_at,
  jp.updated_at,
  k.nama_kelas,
  mk.nama_mk,
  l.nama_lab,
  d.full_name as dosen_name
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
LEFT JOIN dosen ds ON jp.dosen_id = ds.id
LEFT JOIN users d ON ds.user_id = d.id
ORDER BY jp.created_at DESC
LIMIT 10;

-- Check if there are any jadwal with null/invalid data
SELECT
  id,
  kelas_id,
  laboratorium_id,
  dosen_id,
  tanggal_praktikum,
  jam_mulai,
  jam_selesai,
  status,
  created_at
FROM jadwal_praktikum
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;