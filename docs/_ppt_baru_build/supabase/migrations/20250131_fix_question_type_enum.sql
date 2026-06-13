-- Fix question_type enum to support Indonesian language values
-- This adds support for 'pilihan_ganda', 'benar_salah', etc.
-- while keeping backward compatibility with English values

-- ============================================================================
-- APPROACH: Add new enum values then drop old ones
-- ============================================================================

-- Step 1: Add new Indonesian enum values
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'pilihan_ganda';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'benar_salah';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'file_upload';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'jawaban_singkat';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'menjodohkan';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'isian_singkat';

-- ============================================================================
-- NOTES:
-- 1. PostgreSQL enums cannot have values removed in a transaction
-- 2. Old values ('multiple_choice', 'true_false', 'short_answer') are kept for backward compatibility
-- 3. Application code should use Indonesian values going forward:
--    - 'pilihan_ganda' instead of 'multiple_choice'
--    - 'benar_salah' instead of 'true_false'
--    - 'jawaban_singkat' instead of 'short_answer'
-- 4. 'essay' value remains the same (no change needed)
-- ============================================================================

-- Step 2: Create mapping function for backward compatibility (optional)
CREATE OR REPLACE FUNCTION map_question_type(old_type TEXT)
RETURNS question_type AS $$
BEGIN
  -- Map old English values to Indonesian values
  CASE old_type
    WHEN 'multiple_choice' THEN RETURN 'pilihan_ganda'::question_type;
    WHEN 'true_false' THEN RETURN 'benar_salah'::question_type;
    WHEN 'short_answer' THEN RETURN 'jawaban_singkat'::question_type;
    ELSE RETURN old_type::question_type;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ question_type enum updated with Indonesian values';
  RAISE NOTICE '📝 New values: pilihan_ganda, benar_salah, file_upload, jawaban_singkat, menjodohkan, isian_singkat';
END $$;
