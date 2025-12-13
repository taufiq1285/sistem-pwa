-- ============================================================================
-- INSPECT CUSTOM FUNCTIONS USED IN RLS POLICIES
-- ============================================================================
-- Purpose: Check how custom functions are implemented to determine optimization needs
-- ============================================================================

-- Query 1: Get all user-defined functions in public schema
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition,
  obj_description(p.oid, 'pg_proc') as function_description
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname IN (
    'is_admin',
    'is_dosen', 
    'is_laboran',
    'is_mahasiswa',
    'get_current_dosen_id',
    'get_current_mahasiswa_id',
    'get_mahasiswa_kelas_ids',
    'dosen_teaches_mahasiswa'
  )
ORDER BY p.proname;

-- Query 2: Get all function names in the schema (if custom functions have different names)
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
LIMIT 50;
