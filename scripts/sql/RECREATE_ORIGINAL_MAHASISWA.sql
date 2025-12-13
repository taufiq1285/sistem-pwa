-- ============================================================================
-- RECREATE: Original Mahasiswa Record dengan NIM format AKBID yang benar
-- ============================================================================

-- Insert original mahasiswa dengan NIM format AKBID (BD + 7 digits)
INSERT INTO mahasiswa (user_id, nim, program_studi, angkatan, semester)
VALUES (
  '5de02c2b-0cbf-46a2-9b8e-7909096d70a2',
  'BD2401000',  -- Format AKBID: BD + 7 digits
  'Kebidanan',
  2024,
  1
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify - seharusnya ada 2 mahasiswa
SELECT
  m.id,
  m.nim,
  u.email,
  u.full_name,
  m.program_studi,
  m.angkatan,
  m.semester
FROM mahasiswa m
LEFT JOIN users u ON m.user_id = u.id
ORDER BY u.email;

SELECT '✅ Original mahasiswa record recreated dengan NIM AKBID format!' as status;
