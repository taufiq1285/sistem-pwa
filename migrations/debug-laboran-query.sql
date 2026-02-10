-- Debug: Test query yang digunakan oleh getAllJadwalForLaboran
-- Ini simulasi query yang dijalankan oleh laboran page

-- Simulasi query ketika statusFilter = 'all'
-- Harusnya mengembalikan SEMUA jadwal aktif (termasuk pending)
SELECT
  jp.*,
  k.nama_kelas,
  k.kode_kelas,
  mk.nama_mk,
  mk.kode_mk,
  l.nama_lab,
  l.kode_lab,
  u.full_name as cancelled_by_name
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
LEFT JOIN users u ON jp.cancelled_by = u.id
WHERE jp.is_active = true  -- Filter is_active
  -- Tidak ADA filter status ketika statusFilter = 'all'
ORDER BY jp.tanggal_praktikum DESC;

-- Cek apakah jadwal pending ada
SELECT
  id,
  status,
  is_active,
  topik,
  tanggal_praktikum,
  created_at
FROM jadwal_praktikum
WHERE is_active = true
ORDER BY created_at DESC;

-- Cek by status
SELECT
  status,
  COUNT(*) as total
FROM jadwal_praktikum
WHERE is_active = true
GROUP BY status;
