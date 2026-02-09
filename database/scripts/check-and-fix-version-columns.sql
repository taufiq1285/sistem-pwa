-- ============================================================================
-- CHECK AND FIX _VERSION COLUMNS
-- ============================================================================
-- This script checks which tables have _version and adds it where missing
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. CHECK CURRENT STATE
-- ============================================================================

SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = '_version'
ORDER BY table_name;

-- Expected output should show _version on:
-- attempt_kuis, jawaban/kuis_jawaban, kuis, nilai, kehadiran, materi

-- ============================================================================
-- 2. ADD MISSING _VERSION COLUMNS
-- ============================================================================

-- Add to kuis table
ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- Add to kuis_jawaban table (if not already there)
ALTER TABLE kuis_jawaban
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- Add to attempt_kuis table (if not already there)
ALTER TABLE attempt_kuis
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- Add to nilai table
ALTER TABLE nilai
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- Add to kehadiran table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kehadiran') THEN
    ALTER TABLE kehadiran ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;
    RAISE NOTICE '✅ Added _version to kehadiran';
  ELSE
    RAISE NOTICE 'ℹ️ Table kehadiran does not exist, skipping';
  END IF;
END $$;

-- Add to materi table
ALTER TABLE materi
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1 NOT NULL;

-- ============================================================================
-- 3. CREATE/UPDATE INCREMENT TRIGGERS
-- ============================================================================

-- Ensure increment_version function exists
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW._version = COALESCE(OLD._version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to kuis
DROP TRIGGER IF EXISTS trigger_increment_kuis_version ON kuis;
CREATE TRIGGER trigger_increment_kuis_version
  BEFORE UPDATE ON kuis
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Apply trigger to kuis_jawaban
DROP TRIGGER IF EXISTS trigger_increment_kuis_jawaban_version ON kuis_jawaban;
CREATE TRIGGER trigger_increment_kuis_jawaban_version
  BEFORE UPDATE ON kuis_jawaban
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Apply trigger to attempt_kuis
DROP TRIGGER IF EXISTS trigger_increment_attempt_kuis_version ON attempt_kuis;
CREATE TRIGGER trigger_increment_attempt_kuis_version
  BEFORE UPDATE ON attempt_kuis
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Apply trigger to nilai
DROP TRIGGER IF EXISTS trigger_increment_nilai_version ON nilai;
CREATE TRIGGER trigger_increment_nilai_version
  BEFORE UPDATE ON nilai
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Apply trigger to kehadiran (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kehadiran') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_increment_kehadiran_version ON kehadiran';
    EXECUTE 'CREATE TRIGGER trigger_increment_kehadiran_version
      BEFORE UPDATE ON kehadiran
      FOR EACH ROW
      EXECUTE FUNCTION increment_version()';
    RAISE NOTICE '✅ Created trigger for kehadiran';
  END IF;
END $$;

-- Apply trigger to materi
DROP TRIGGER IF EXISTS trigger_increment_materi_version ON materi;
CREATE TRIGGER trigger_increment_materi_version
  BEFORE UPDATE ON materi
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- ============================================================================
-- 4. VERIFY INSTALLATION
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count tables with _version
  SELECT COUNT(DISTINCT table_name)
  INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = '_version'
    AND table_name IN ('kuis', 'kuis_jawaban', 'attempt_kuis', 'nilai', 'materi', 'kehadiran');

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VERSION COLUMN STATUS';
  RAISE NOTICE 'Tables with _version: %', v_count;
  RAISE NOTICE '========================================';

  -- Check each table specifically
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'kuis' AND column_name = '_version') THEN
    RAISE NOTICE '✅ kuis has _version';
  ELSE
    RAISE NOTICE '❌ kuis MISSING _version';
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'kuis_jawaban' AND column_name = '_version') THEN
    RAISE NOTICE '✅ kuis_jawaban has _version';
  ELSE
    RAISE NOTICE '❌ kuis_jawaban MISSING _version';
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'attempt_kuis' AND column_name = '_version') THEN
    RAISE NOTICE '✅ attempt_kuis has _version';
  ELSE
    RAISE NOTICE '❌ attempt_kuis MISSING _version';
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'nilai' AND column_name = '_version') THEN
    RAISE NOTICE '✅ nilai has _version';
  ELSE
    RAISE NOTICE '❌ nilai MISSING _version';
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'materi' AND column_name = '_version') THEN
    RAISE NOTICE '✅ materi has _version';
  ELSE
    RAISE NOTICE '❌ materi MISSING _version';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'kehadiran') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'kehadiran' AND column_name = '_version') THEN
      RAISE NOTICE '✅ kehadiran has _version';
    ELSE
      RAISE NOTICE '❌ kehadiran MISSING _version';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ kehadiran table does not exist';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 5. FINAL VERIFICATION QUERY
-- ============================================================================

-- Run this to see all tables with _version
SELECT
  t.table_name,
  CASE
    WHEN c.column_name IS NOT NULL THEN '✅ HAS _version'
    ELSE '❌ MISSING _version'
  END as status,
  c.data_type,
  c.column_default
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_name = c.table_name
  AND c.column_name = '_version'
  AND c.table_schema = 'public'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN ('kuis', 'kuis_jawaban', 'attempt_kuis', 'nilai', 'materi', 'kehadiran')
ORDER BY t.table_name;
