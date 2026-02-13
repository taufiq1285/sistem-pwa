-- Cek status jadwal yang ada
SELECT 
  jp.id,
  jp.kelas_id,
  k.nama_kelas,
  jp.topik,
  jp.tanggal_praktikum,
  jp.status,
  jp.is_active,
  l.nama_lab,
  jp.created_at
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
WHERE jp.is_active = true
ORDER BY jp.created_at DESC
LIMIT 10;
