-- Fix question_type enum to support Indonesian language values
-- This combines enum addition and data migration in one script

-- ============================================================================
-- STEP 1: Add Indonesian enum values to question_type
-- ============================================================================

DO $$
BEGIN
  -- Check if we need to add values (skip if already exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'question_type'::regtype
    AND enumlabel = 'pilihan_ganda'
  ) THEN
    ALTER TYPE question_type ADD VALUE 'pilihan_ganda';
    RAISE NOTICE '✅ Added pilihan_ganda to question_type enum';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'question_type'::regtype
    AND enumlabel = 'benar_salah'
  ) THEN
    ALTER TYPE question_type ADD VALUE 'benar_salah';
    RAISE NOTICE '✅ Added benar_salah to question_type enum';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'question_type'::regtype
    AND enumlabel = 'file_upload'
  ) THEN
    ALTER TYPE question_type ADD VALUE 'file_upload';
    RAISE NOTICE '✅ Added file_upload to question_type enum';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'question_type'::regtype
    AND enumlabel = 'jawaban_singkat'
  ) THEN
    ALTER TYPE question_type ADD VALUE 'jawaban_singkat';
    RAISE NOTICE '✅ Added jawaban_singkat to question_type enum';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'question_type'::regtype
    AND enumlabel = 'menjodohkan'
  ) THEN
    ALTER TYPE question_type ADD VALUE 'menjodohkan';
    RAISE NOTICE '✅ Added menjodohkan to question_type enum';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'question_type'::regtype
    AND enumlabel = 'isian_singkat'
  ) THEN
    ALTER TYPE question_type ADD VALUE 'isian_singkat';
    RAISE NOTICE '✅ Added isian_singkat to question_type enum';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Migrate existing data from English to Indonesian values
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
-- VERIFICATION: Check counts after migration
-- ============================================================================

DO $$
DECLARE
  v_pilihan_ganda INT;
  v_benar_salah INT;
  v_essay INT;
  v_jawaban_singkat INT;
  v_multiple_choice INT;
  v_true_false INT;
  v_short_answer INT;
BEGIN
  -- Check Indonesian values
  SELECT COUNT(*) INTO v_pilihan_ganda FROM soal WHERE tipe = 'pilihan_ganda'::question_type;
  SELECT COUNT(*) INTO v_benar_salah FROM soal WHERE tipe = 'benar_salah'::question_type;
  SELECT COUNT(*) INTO v_essay FROM soal WHERE tipe = 'essay'::question_type;
  SELECT COUNT(*) INTO v_jawaban_singkat FROM soal WHERE tipe = 'jawaban_singkat'::question_type;

  -- Check remaining English values (should be 0 after migration)
  SELECT COUNT(*) INTO v_multiple_choice FROM soal WHERE tipe = 'multiple_choice'::question_type;
  SELECT COUNT(*) INTO v_true_false FROM soal WHERE tipe = 'true_false'::question_type;
  SELECT COUNT(*) INTO v_short_answer FROM soal WHERE tipe = 'short_answer'::question_type;

  RAISE NOTICE '';
  RAISE NOTICE '📊 Question type counts after migration:';
  RAISE NOTICE '  ✅ pilihan_ganda: %', v_pilihan_ganda;
  RAISE NOTICE '  ✅ benar_salah: %', v_benar_salah;
  RAISE NOTICE '  ✅ essay: %', v_essay;
  RAISE NOTICE '  ✅ jawaban_singkat: %', v_jawaban_singkat;
  RAISE NOTICE '';

  -- Warn if any old values remain
  IF v_multiple_choice > 0 OR v_true_false > 0 OR v_short_answer > 0 THEN
    RAISE NOTICE '⚠️  Warning: Some old English values remain:';
    IF v_multiple_choice > 0 THEN RAISE NOTICE '    - multiple_choice: %', v_multiple_choice; END IF;
    IF v_true_false > 0 THEN RAISE NOTICE '    - true_false: %', v_true_false; END IF;
    IF v_short_answer > 0 THEN RAISE NOTICE '    - short_answer: %', v_short_answer; END IF;
  ELSE
    RAISE NOTICE '✅ All old English values have been migrated!';
  END IF;
END $$;

-- ============================================================================
-- COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Question type enum migration completed successfully!';
  RAISE NOTICE '📝 Enum now supports Indonesian values:';
  RAISE NOTICE '    - pilihan_ganda (replaces multiple_choice)';
  RAISE NOTICE '    - benar_salah (replaces true_false)';
  RAISE NOTICE '    - jawaban_singkat (replaces short_answer)';
  RAISE NOTICE '    - essay (unchanged)';
  RAISE NOTICE '    - file_upload, menjodohkan, isian_singkat (new)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
