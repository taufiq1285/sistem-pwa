-- ============================================================================
-- EXPORT SQL UNTUK MIGRASI KE PROJECT SUPABASE BARU
-- Fokus: TABLE, CONSTRAINT, INDEX, RLS POLICY, TRIGGER, FUNCTION
--
-- Cara pakai:
-- 1) Jalankan script ini di Supabase SQL Editor project lama
-- 2) Copy hasil kolom "sql_text" dari tiap section
-- 3) Simpan jadi file .sql terpisah per section (urutan eksekusi ada di bawah)
-- ============================================================================

-- ==========================
-- [A] KONFIGURASI TABEL TARGET
-- ==========================
WITH target_tables AS (
  SELECT unnest(ARRAY[
    'mata_kuliah',
    'kelas',
    'jadwal_praktikum',
    'kuis',
    'attempt_kuis',
    'soal',
    'jawaban'
  ]) AS table_name
)
SELECT 'TARGET_TABLE' AS section, table_name AS sql_text
FROM target_tables;

-- ==========================
-- [B] CREATE TABLE (kolom + tipe + default + nullability)
-- Catatan: constraint & index diexport di section lain
-- ==========================
WITH target_tables AS (
  SELECT unnest(ARRAY[
    'mata_kuliah','kelas','jadwal_praktikum','kuis','attempt_kuis','soal','jawaban'
  ]) AS table_name
), col AS (
  SELECT
    c.table_name,
    c.ordinal_position,
    format(
      '%I %s%s%s',
      c.column_name,
      c.udt_name,
      CASE
        WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default
        ELSE ''
      END,
      CASE
        WHEN c.is_nullable = 'NO' THEN ' NOT NULL'
        ELSE ''
      END
    ) AS col_def
  FROM information_schema.columns c
  JOIN target_tables t ON t.table_name = c.table_name
  WHERE c.table_schema = 'public'
)
SELECT
  'CREATE_TABLE' AS section,
  format(
    'CREATE TABLE IF NOT EXISTS public.%I (%s);',
    table_name,
    string_agg(col_def, ', ' ORDER BY ordinal_position)
  ) AS sql_text
FROM col
GROUP BY table_name
ORDER BY table_name;

-- ==========================
-- [C] CONSTRAINT (PK/FK/UNIQUE/CHECK)
-- ==========================
WITH target_tables AS (
  SELECT unnest(ARRAY[
    'mata_kuliah','kelas','jadwal_praktikum','kuis','attempt_kuis','soal','jawaban'
  ]) AS table_name
)
SELECT
  'CONSTRAINT' AS section,
  format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I %s;',
    rel.relname,
    con.conname,
    pg_get_constraintdef(con.oid)
  ) AS sql_text
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
JOIN target_tables t ON t.table_name = rel.relname
WHERE nsp.nspname = 'public'
ORDER BY rel.relname, con.conname;

-- ==========================
-- [D] INDEX
-- ==========================
WITH target_tables AS (
  SELECT unnest(ARRAY[
    'mata_kuliah','kelas','jadwal_praktikum','kuis','attempt_kuis','soal','jawaban'
  ]) AS table_name
)
SELECT
  'INDEX' AS section,
  indexdef || ';' AS sql_text
FROM pg_indexes i
JOIN target_tables t ON t.table_name = i.tablename
WHERE i.schemaname = 'public'
ORDER BY i.tablename, i.indexname;

-- ==========================
-- [E] ENABLE RLS (penting sebelum CREATE POLICY)
-- ==========================
WITH target_tables AS (
  SELECT unnest(ARRAY[
    'mata_kuliah','kelas','jadwal_praktikum','kuis','attempt_kuis','soal','jawaban'
  ]) AS table_name
)
SELECT
  'ENABLE_RLS' AS section,
  format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', c.relname) AS sql_text
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN target_tables t ON t.table_name = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- ==========================
-- [F] CREATE POLICY (RLS)
-- ==========================
WITH target_tables AS (
  SELECT unnest(ARRAY[
    'mata_kuliah','kelas','jadwal_praktikum','kuis','attempt_kuis','soal','jawaban'
  ]) AS table_name
)
SELECT
  'RLS_POLICY' AS section,
  format(
    'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s;',
    p.policyname,
    p.tablename,
    p.permissive,
    p.cmd,
    array_to_string(p.roles, ', '),
    CASE WHEN p.qual IS NOT NULL THEN E'\nUSING (' || p.qual || ')' ELSE '' END,
    CASE WHEN p.with_check IS NOT NULL THEN E'\nWITH CHECK (' || p.with_check || ')' ELSE '' END
  ) AS sql_text
FROM pg_policies p
JOIN target_tables t ON t.table_name = p.tablename
WHERE p.schemaname = 'public'
ORDER BY p.tablename, p.policyname;

-- ==========================
-- [G] TRIGGER
-- ==========================
WITH target_tables AS (
  SELECT unnest(ARRAY[
    'mata_kuliah','kelas','jadwal_praktikum','kuis','attempt_kuis','soal','jawaban'
  ]) AS table_name
)
SELECT
  'TRIGGER' AS section,
  pg_get_triggerdef(t.oid) || ';' AS sql_text
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN target_tables tt ON tt.table_name = c.relname
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ==========================
-- [H] FUNCTION yang dipakai trigger atau policy
-- ==========================
WITH funcs_from_trigger AS (
  SELECT DISTINCT p.oid
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_proc p ON p.oid = t.tgfoid
  WHERE n.nspname = 'public'
    AND c.relname IN ('mata_kuliah','kelas','jadwal_praktikum','kuis','attempt_kuis','soal','jawaban')
    AND NOT t.tgisinternal
), funcs_helper_common AS (
  SELECT p.oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'is_admin','is_dosen','is_laboran','is_mahasiswa',
      'get_current_dosen_id','get_dosen_id','get_current_mahasiswa_id',
      'dosen_teaches_mata_kuliah'
    )
), all_funcs AS (
  SELECT oid FROM funcs_from_trigger
  UNION
  SELECT oid FROM funcs_helper_common
)
SELECT
  'FUNCTION' AS section,
  pg_get_functiondef(oid) AS sql_text
FROM all_funcs
ORDER BY sql_text;

-- ==========================
-- [I] OPSIONAL: EXPORT DATA (INSERT) untuk tabel inti
-- Catatan: jalankan per tabel agar ringan.
-- Contoh satu tabel:
--   SELECT format('INSERT INTO public.mata_kuliah SELECT * FROM public.mata_kuliah WHERE id = %L;', id)
--   FROM public.mata_kuliah;
-- Untuk data besar, lebih aman pakai pg_dump --data-only dari local.
-- ==========================

-- ============================================================================
-- URUTAN RESTORE di project baru (disarankan):
-- 1) CREATE_TABLE
-- 2) FUNCTION
-- 3) CONSTRAINT
-- 4) INDEX
-- 5) ENABLE_RLS
-- 6) RLS_POLICY
-- 7) TRIGGER
-- 8) DATA (jika perlu)
-- ============================================================================
