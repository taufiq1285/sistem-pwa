-- Cek apakah dosen_id sudah terisi di jadwal_praktikum
SELECT
  jp.id,
  jp.tanggal_praktikum,
  jp.hari,
  jp.jam_mulai,
  jp.jam_selesai,
  jp.topik,
  jp.is_active,
  jp.status,
  jp.kelas_id,
  jp.laboratorium_id,
  jp.dosen_id,  -- Cek apakah ini NULL atau ada isinya
  k.nama_kelas,
  mk.nama_mk,
  l.nama_lab,
  d.user_id,
  u.full_name as dosen_nama
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
LEFT JOIN dosen d ON jp.dosen_id = d.id
LEFT JOIN users u ON d.user_id = u.id
WHERE jp.is_active = true
ORDER BY jp.tanggal_praktikum DESC, jp.jam_mulai ASC
LIMIT 20;
