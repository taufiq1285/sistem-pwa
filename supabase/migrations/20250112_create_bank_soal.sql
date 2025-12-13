-- ============================================================================
-- MIGRATION: Create Bank Soal Table
-- Purpose: Store reusable questions for quiz creation
-- Author: System
-- Date: 2025-01-12
-- ============================================================================

-- Create bank_soal table
CREATE TABLE IF NOT EXISTS bank_soal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  dosen_id UUID NOT NULL REFERENCES dosen(id) ON DELETE CASCADE,

  -- Question content
  pertanyaan TEXT NOT NULL CHECK (char_length(pertanyaan) >= 10),
  tipe_soal TEXT NOT NULL CHECK (tipe_soal IN ('pilihan_ganda', 'essay')),
  poin INTEGER NOT NULL DEFAULT 1 CHECK (poin >= 1 AND poin <= 100),

  -- Question data (JSON for flexibility)
  opsi_jawaban JSONB, -- For multiple choice: array of {id, label, text, is_correct}
  jawaban_benar TEXT, -- For multiple choice: option id; For essay: rubric/guidelines
  penjelasan TEXT, -- Optional explanation shown after quiz

  -- Categorization
  mata_kuliah_id UUID REFERENCES mata_kuliah(id) ON DELETE SET NULL,
  tags TEXT[], -- For flexible categorization: ['anatomi', 'semester-1', 'easy']

  -- Metadata
  is_public BOOLEAN DEFAULT false, -- Allow sharing with other dosen (future feature)
  usage_count INTEGER DEFAULT 0, -- Track how many times used

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for filtering by dosen
CREATE INDEX idx_bank_soal_dosen_id ON bank_soal(dosen_id);

-- Index for filtering by mata kuliah
CREATE INDEX idx_bank_soal_mata_kuliah_id ON bank_soal(mata_kuliah_id);

-- Index for filtering by tipe soal
CREATE INDEX idx_bank_soal_tipe_soal ON bank_soal(tipe_soal);

-- GIN index for tags (array search)
CREATE INDEX idx_bank_soal_tags ON bank_soal USING GIN(tags);

-- Index for full-text search on pertanyaan
CREATE INDEX idx_bank_soal_pertanyaan_search ON bank_soal USING GIN(to_tsvector('indonesian', pertanyaan));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_bank_soal_updated_at
  BEFORE UPDATE ON bank_soal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE bank_soal ENABLE ROW LEVEL SECURITY;

-- Policy: Dosen can view their own questions
CREATE POLICY "Dosen can view own questions"
  ON bank_soal
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dosen
      WHERE dosen.id = bank_soal.dosen_id
      AND dosen.user_id = auth.uid()
    )
  );

-- Policy: Dosen can create questions
CREATE POLICY "Dosen can create questions"
  ON bank_soal
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dosen
      WHERE dosen.id = bank_soal.dosen_id
      AND dosen.user_id = auth.uid()
    )
  );

-- Policy: Dosen can update own questions
CREATE POLICY "Dosen can update own questions"
  ON bank_soal
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dosen
      WHERE dosen.id = bank_soal.dosen_id
      AND dosen.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dosen
      WHERE dosen.id = bank_soal.dosen_id
      AND dosen.user_id = auth.uid()
    )
  );

-- Policy: Dosen can delete own questions
CREATE POLICY "Dosen can delete own questions"
  ON bank_soal
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dosen
      WHERE dosen.id = bank_soal.dosen_id
      AND dosen.user_id = auth.uid()
    )
  );

-- Policy: Admin can view all questions (for management)
CREATE POLICY "Admin can view all questions"
  ON bank_soal
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Increment usage count when question is used
CREATE OR REPLACE FUNCTION increment_bank_soal_usage(question_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE bank_soal
  SET usage_count = usage_count + 1
  WHERE id = question_id;
END;
$$;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to add sample data for testing
-- INSERT INTO bank_soal (dosen_id, pertanyaan, tipe_soal, poin, opsi_jawaban, jawaban_benar, tags)
-- SELECT
--   d.id,
--   'Apa fungsi utama plasenta pada kehamilan?',
--   'pilihan_ganda',
--   2,
--   '[
--     {"id": "a", "label": "A", "text": "Melindungi janin dari benturan", "is_correct": false},
--     {"id": "b", "label": "B", "text": "Pertukaran nutrisi dan oksigen", "is_correct": true},
--     {"id": "c", "label": "C", "text": "Mengatur suhu tubuh janin", "is_correct": false},
--     {"id": "d", "label": "D", "text": "Produksi ASI", "is_correct": false}
--   ]'::jsonb,
--   'b',
--   ARRAY['anatomi', 'kehamilan', 'semester-2']
-- FROM dosen d
-- LIMIT 1;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE bank_soal IS 'Bank soal untuk menyimpan pertanyaan yang dapat digunakan kembali';
COMMENT ON COLUMN bank_soal.dosen_id IS 'Dosen yang membuat pertanyaan';
COMMENT ON COLUMN bank_soal.tags IS 'Tags untuk kategorisasi dan pencarian (array)';
COMMENT ON COLUMN bank_soal.is_public IS 'Apakah pertanyaan bisa dilihat dosen lain (future feature)';
COMMENT ON COLUMN bank_soal.usage_count IS 'Berapa kali pertanyaan ini digunakan dalam kuis';
