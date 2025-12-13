-- ===================================================================
-- FIX: Tombol "Menyimpan" Stuck di Kuis Builder
-- ===================================================================
-- MASALAH: Database columns tidak cocok dengan TypeScript types
-- SOLUSI: Rename dan tambah columns yang hilang
-- ===================================================================

-- STEP 1: Rename is_shuffled → randomize_questions
ALTER TABLE kuis
RENAME COLUMN is_shuffled TO randomize_questions;

-- STEP 2: Rename show_result → show_results_immediately
ALTER TABLE kuis
RENAME COLUMN show_result TO show_results_immediately;

-- STEP 3: Add randomize_options (missing column)
ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS randomize_options BOOLEAN DEFAULT false;

-- STEP 4: Add allow_review (missing column)
ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS allow_review BOOLEAN DEFAULT true;

-- STEP 5: Add PWA offline columns (missing)
ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS is_offline_capable BOOLEAN DEFAULT false;

ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS auto_save_interval INTEGER DEFAULT 30;

ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- ===================================================================
-- SELESAI! Sekarang coba save kuis lagi.
-- ===================================================================
