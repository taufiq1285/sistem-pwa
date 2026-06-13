-- Fix kuis table columns to match TypeScript types
-- Migration: Rename and add missing columns

-- Step 1: Rename is_shuffled to randomize_questions
ALTER TABLE kuis
RENAME COLUMN is_shuffled TO randomize_questions;

-- Step 2: Rename show_result to show_results_immediately
ALTER TABLE kuis
RENAME COLUMN show_result TO show_results_immediately;

-- Step 3: Add randomize_options column (was missing)
ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS randomize_options BOOLEAN DEFAULT false;

-- Step 4: Add allow_review column (mentioned in types but missing in schema)
ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS allow_review BOOLEAN DEFAULT true;

-- Step 5: Add offline capability columns (for PWA)
ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS is_offline_capable BOOLEAN DEFAULT false;

ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS auto_save_interval INTEGER DEFAULT 30;

ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Add comment explaining the field names
COMMENT ON COLUMN kuis.randomize_questions IS 'Randomize question order for each student';
COMMENT ON COLUMN kuis.randomize_options IS 'Randomize answer options for each student';
COMMENT ON COLUMN kuis.show_results_immediately IS 'Show quiz results immediately after submission';
