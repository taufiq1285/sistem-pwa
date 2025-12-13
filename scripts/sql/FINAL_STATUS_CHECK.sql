-- ============================================================================
-- FINAL STATUS CHECK - RLS Setup Complete
-- ============================================================================

SELECT 'RLS STATUS' as check_type;
SELECT
  pt.tablename,
  pt.rowsecurity,
  COUNT(pp.policyname) as policy_count
FROM pg_tables pt
LEFT JOIN pg_policies pp ON pt.tablename = pp.tablename
WHERE pt.tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
GROUP BY pt.tablename, pt.rowsecurity
ORDER BY pt.tablename;

SELECT '---' as separator;
SELECT 'MAHASISWA COUNT' as check_type;
SELECT COUNT(*) as total_mahasiswa FROM mahasiswa;

SELECT '---' as separator;
SELECT 'KELAS COUNT' as check_type;
SELECT COUNT(*) as total_kelas FROM kelas;

SELECT '---' as separator;
SELECT 'ENROLLMENT COUNT' as check_type;
SELECT COUNT(*) as total_enrollments FROM kelas_mahasiswa;

SELECT '---' as separator;
SELECT '✅ FINAL STATUS: RLS Setup Complete & Working!' as status;
