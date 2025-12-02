-- Check RLS is enabled on all tables
SELECT 
    tablename, 
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;
