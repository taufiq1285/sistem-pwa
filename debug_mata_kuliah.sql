-- Debug: Cek mata kuliah yang ada
SELECT
  mk.id,
  mk.kode_mk,
  mk.nama_mk,
  mk.is_active as mk_active,
  COUNT(k.id) as jumlah_kelas,
  COUNT(CASE WHEN k.is_active = true THEN 1 END) as kelas_aktif
FROM mata_kuliah mk
LEFT JOIN kelas k ON k.mata_kuliah_id = mk.id
GROUP BY mk.id, mk.kode_mk, mk.nama_mk, mk.is_active
ORDER BY mk.kode_mk;

-- Debug: Cek kelas yang ada dan dosen yang ditugaskan
SELECT
  mk.kode_mk,
  mk.nama_mk,
  k.nama_kelas,
  k.kode_kelas,
  k.is_active as kelas_active,
  d.nama as dosen_nama,
  d.nip as dosen_nip
FROM kelas k
JOIN mata_kuliah mk ON mk.id = k.mata_kuliah_id
LEFT JOIN dosen d ON d.id = k.dosen_id
ORDER BY mk.kode_mk, k.nama_kelas;
