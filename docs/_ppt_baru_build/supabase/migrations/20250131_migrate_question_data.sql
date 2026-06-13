-- Migrate existing question data from English to Indonesian enum values
-- This should be run AFTER 20250131_fix_question_type_enum.sql

-- ============================================================================
-- BACKUP: Create backup of current soal table data
-- ============================================================================

-- Optional: Create backup table (uncomment if needed)
-- CREATE TABLE soal_backup AS SELECT * FROM soal;

-- ============================================================================
-- MIGRATION: Update existing records to use Indonesian values
-- ============================================================================

-- Update 'multiple_choice' -> 'pilihan_ganda'
UPDATE soal
SET tipe = 'pilihan_ganda'::question_type
WHERE tipe = 'multiple_choice'::question_type;

-- Update 'true_false' -> 'benar_salah'
UPDATE soal
SET tipe = 'benar_salah'::question_type
WHERE tipe = 'true_false'::question_type;

-- Update 'short_answer' -> 'jawaban_singkat'
UPDATE soal
SET tipe = 'jawaban_singkat'::question_type
WHERE tipe = 'short_answer'::question_type;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check counts after migration
DO $$
DECLARE
  v_pilihan_ganda INT;
  v_benar_salah INT;
  v_essay INT;
  v_jawaban_singkat INT;
BEGIN
  SELECT COUNT(*) INTO v_pilihan_ganda FROM soal WHERE tipe = 'pilihan_ganda'::question_type;
  SELECT COUNT(*) INTO v_benar_salah FROM soal WHERE tipe = 'benar_salah'::question_type;
  SELECT COUNT(*) INTO v_essay FROM soal WHERE tipe = 'essay'::question_type;
  SELECT COUNT(*) INTO v_jawaban_singkat FROM soal WHERE tipe = 'jawaban_singkat'::question_type;

  RAISE NOTICE '📊 Question type counts after migration:';
  RAISE NOTICE '  - pilihan_ganda: %', v_pilihan_ganda;
  RAISE NOTICE '  - benar_salah: %', v_benar_salah;
  RAISE NOTICE '  - essay: %', v_essay;
  RAISE NOTICE '  - jawaban_singkat: %', v_jawaban_singkat;
END $$;

-- ============================================================================
-- COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Question data migration completed';
  RAISE NOTICE '📝 English enum values have been converted to Indonesian';
END $$;
