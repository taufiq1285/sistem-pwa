-- ============================================================================
-- DAY 14: SEED DATA
-- Initial data for development
-- ============================================================================

-- Insert Laboratorium (10 Labs dari spesifikasi)
INSERT INTO laboratorium (kode_lab, nama_lab, kapasitas, lokasi, fasilitas) VALUES
('lab-ktd', 'Lab Keterampilan Dasar Praktik Kebidanan', 30, 'Gedung A Lantai 1', ARRAY['Phantom', 'Bed Praktik', 'Alat Kebidanan Dasar']),
('lab-anc', 'Lab ANC (Antenatal Care)', 25, 'Gedung A Lantai 1', ARRAY['Phantom Ibu Hamil', 'Doppler', 'Tensimeter', 'Timbangan']),
('lab-pnc', 'Lab PNC (Postnatal Care)', 25, 'Gedung A Lantai 2', ARRAY['Bed Pasien', 'Alat Pemeriksaan Nifas', 'Phantom Nifas']),
('lab-inc', 'Lab INC (Intranatal Care)', 20, 'Gedung A Lantai 2', ARRAY['Phantom Persalinan', 'Partus Set', 'CTG', 'Resusitasi Bayi']),
('lab-bbl', 'Lab BBL (Bayi Baru Lahir)', 20, 'Gedung A Lantai 2', ARRAY['Infant Warmer', 'Phantom Bayi', 'Timbangan Bayi', 'Alat Resusitasi']),
('lab-kb', 'Lab Pelayanan KB', 25, 'Gedung B Lantai 1', ARRAY['Phantom Pemasangan KB', 'Alat Kontrasepsi', 'Model Anatomi']),
('lab-konseling', 'Lab Konseling & Pendidikan Kesehatan', 30, 'Gedung B Lantai 1', ARRAY['Ruang Konseling', 'Media Edukasi', 'Proyektor']),
('lab-komunitas', 'Lab Kebidanan Komunitas', 25, 'Gedung B Lantai 2', ARRAY['Peralatan Kunjungan', 'Tas KIA', 'Alat Pemeriksaan Mobile']),
('lab-anak', 'Lab Bayi, Balita, Anak Prasekolah', 25, 'Gedung B Lantai 2', ARRAY['Phantom Anak', 'Alat Pemeriksaan Anak', 'Mainan Edukasi']),
('depo-alat', 'Ruangan Depo Alat', 0, 'Gedung A Lantai Ground', ARRAY['Rak Penyimpanan', 'Sistem Inventaris', 'Area Sterilisasi'])
ON CONFLICT (kode_lab) DO NOTHING;