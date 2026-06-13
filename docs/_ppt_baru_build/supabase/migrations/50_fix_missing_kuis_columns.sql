-- ============================================================================
-- FIX MISSING COLUMNS FOR KUIS SYSTEM
-- This migration adds all missing columns that the code expects
-- SAFE VERSION: Does not assume any existing columns exist
-- ============================================================================

-- ============================================================================
-- PART 1: ADD MISSING COLUMNS TO attempt_kuis
-- ============================================================================

-- Add submitted_at column (when the quiz was submitted)
ALTER TABLE attempt_kuis
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Add sisa_waktu column (remaining time in seconds when submitted)
ALTER TABLE attempt_kuis
ADD COLUMN IF NOT EXISTS sisa_waktu INTEGER;

-- Add attempt_number column (which attempt is this for the student)
ALTER TABLE attempt_kuis
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1 NOT NULL;

-- Add started_at column (when quiz started)
ALTER TABLE attempt_kuis
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();

-- Add total_poin column (total points earned)
ALTER TABLE attempt_kuis
ADD COLUMN IF NOT EXISTS total_poin DECIMAL(5,2);

-- ============================================================================
-- PART 2: ADD MISSING COLUMNS TO jawaban
-- ============================================================================

-- Add is_auto_saved column (indicates if answer was auto-saved)
ALTER TABLE jawaban
ADD COLUMN IF NOT EXISTS is_auto_saved BOOLEAN DEFAULT false;

-- Add graded_at column (when the answer was graded by teacher)
ALTER TABLE jawaban
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

-- Add graded_by column (who graded the answer)
ALTER TABLE jawaban
ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES users(id);

-- Add feedback column (teacher's feedback on the answer)
ALTER TABLE jawaban
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- ============================================================================
-- PART 3: UPDATE EXISTING DATA (SAFE - checks if columns exist)
-- ============================================================================

-- Set default attempt_number for existing records that might have NULL
DO $$
BEGIN
  -- Only update if there are rows with NULL attempt_number
  IF EXISTS (SELECT 1 FROM attempt_kuis WHERE attempt_number IS NULL) THEN
    WITH numbered_attempts AS (
      SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY mahasiswa_id, kuis_id ORDER BY created_at) as attempt_num
      FROM attempt_kuis
      WHERE attempt_number IS NULL
    )
    UPDATE attempt_kuis ak
    SET attempt_number = na.attempt_num
    FROM numbered_attempts na
    WHERE ak.id = na.id;

    RAISE NOTICE 'Updated attempt_number for existing records';
  END IF;
END $$;

-- Set started_at from created_at for existing records if started_at is NULL
DO $$
BEGIN
  UPDATE attempt_kuis
  SET started_at = created_at
  WHERE started_at IS NULL AND created_at IS NOT NULL;

  IF FOUND THEN
    RAISE NOTICE 'Set started_at from created_at for existing records';
  END IF;
END $$;

-- ============================================================================
-- PART 4: ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN attempt_kuis.submitted_at IS 'Timestamp when quiz was submitted';
COMMENT ON COLUMN attempt_kuis.sisa_waktu IS 'Remaining time in seconds when submitted';
COMMENT ON COLUMN attempt_kuis.attempt_number IS 'Which attempt number (1st, 2nd, etc.)';
COMMENT ON COLUMN attempt_kuis.started_at IS 'Timestamp when quiz was started';
COMMENT ON COLUMN attempt_kuis.total_poin IS 'Total points earned in this attempt';

COMMENT ON COLUMN jawaban.is_auto_saved IS 'True if answer was auto-saved (not manually submitted)';
COMMENT ON COLUMN jawaban.graded_at IS 'Timestamp when answer was graded';
COMMENT ON COLUMN jawaban.graded_by IS 'User ID of teacher who graded the answer';
COMMENT ON COLUMN jawaban.feedback IS 'Teacher feedback on this answer';

-- ============================================================================
-- PART 5: VERIFY COLUMNS EXIST
-- ============================================================================

DO $$
DECLARE
  missing_cols TEXT[] := ARRAY[]::TEXT[];
  col_name TEXT;
BEGIN
  -- Check attempt_kuis columns
  FOREACH col_name IN ARRAY ARRAY['submitted_at', 'sisa_waktu', 'attempt_number', 'started_at', 'total_poin']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'attempt_kuis' AND column_name = col_name
    ) THEN
      missing_cols := array_append(missing_cols, 'attempt_kuis.' || col_name);
    END IF;
  END LOOP;

  -- Check jawaban columns
  FOREACH col_name IN ARRAY ARRAY['is_auto_saved', 'graded_at', 'graded_by', 'feedback']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'jawaban' AND column_name = col_name
    ) THEN
      missing_cols := array_append(missing_cols, 'jawaban.' || col_name);
    END IF;
  END LOOP;

  IF array_length(missing_cols, 1) > 0 THEN
    RAISE EXCEPTION 'Missing columns: %', array_to_string(missing_cols, ', ');
  ELSE
    RAISE NOTICE '✅ Missing columns migration complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Added to attempt_kuis:';
    RAISE NOTICE '  - submitted_at';
    RAISE NOTICE '  - sisa_waktu';
    RAISE NOTICE '  - attempt_number';
    RAISE NOTICE '  - started_at';
    RAISE NOTICE '  - total_poin';
    RAISE NOTICE '';
    RAISE NOTICE 'Added to jawaban:';
    RAISE NOTICE '  - is_auto_saved';
    RAISE NOTICE '  - graded_at';
    RAISE NOTICE '  - graded_by';
    RAISE NOTICE '  - feedback';
  END IF;
END $$;
