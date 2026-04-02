# ⚠️ FIX URGENT: Table bank_soal Tidak Ada!

## MASALAH
Fitur "Ambil dari Bank Soal" tidak berfungsi karena **table `bank_soal` belum dibuat di database**.

## SOLUSI CEPAT

### 1. Buka Supabase Dashboard
```
https://supabase.com/dashboard/project/YOUR_PROJECT/editor
```

### 2. Klik SQL Editor (di sidebar kiri)

### 3. Copy & Paste SQL ini, lalu RUN:

```sql
-- ============================================================================
-- CREATE TABLE BANK_SOAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_soal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  dosen_id UUID NOT NULL REFERENCES dosen(id) ON DELETE CASCADE,

  -- Question content
  pertanyaan TEXT NOT NULL CHECK (char_length(pertanyaan) >= 10),
  tipe_soal TEXT NOT NULL CHECK (tipe_soal IN ('pilihan_ganda', 'essay')),
  poin INTEGER NOT NULL DEFAULT 1 CHECK (poin >= 1 AND poin <= 100),

  -- Question data
  opsi_jawaban JSONB,
  jawaban_benar TEXT,
  penjelasan TEXT,

  -- Categorization
  mata_kuliah_id UUID REFERENCES mata_kuliah(id) ON DELETE SET NULL,
  tags TEXT[],

  -- Metadata
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_soal_dosen_id ON bank_soal(dosen_id);
CREATE INDEX idx_bank_soal_mata_kuliah_id ON bank_soal(mata_kuliah_id);
CREATE INDEX idx_bank_soal_tipe_soal ON bank_soal(tipe_soal);
CREATE INDEX idx_bank_soal_tags ON bank_soal USING GIN(tags);

-- Enable RLS
ALTER TABLE bank_soal ENABLE ROW LEVEL SECURITY;

-- Policy: Dosen can view own questions
CREATE POLICY "Dosen can view own questions"
  ON bank_soal FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dosen
      WHERE dosen.id = bank_soal.dosen_id
      AND dosen.user_id = auth.uid()
    )
  );

-- Policy: Dosen can create questions
CREATE POLICY "Dosen can create questions"
  ON bank_soal FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dosen
      WHERE dosen.id = bank_soal.dosen_id
      AND dosen.user_id = auth.uid()
    )
  );

-- Policy: Dosen can update own questions
CREATE POLICY "Dosen can update own questions"
  ON bank_soal FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dosen
      WHERE dosen.id = bank_soal.dosen_id
      AND dosen.user_id = auth.uid()
    )
  );

-- Policy: Dosen can delete own questions
CREATE POLICY "Dosen can delete own questions"
  ON bank_soal FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dosen
      WHERE dosen.id = bank_soal.dosen_id
      AND dosen.user_id = auth.uid()
    )
  );

-- Function: Increment usage count
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
```

### 4. Generate Types Baru

Di terminal, jalankan:
```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

ATAU jika pakai remote:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
```

### 5. Restart Dev Server
```bash
npm run dev
```

---

## VERIFIKASI

Setelah selesai, cek di Supabase Dashboard:
1. Buka **Table Editor**
2. Cari table **bank_soal**
3. Harus ada dengan columns: id, dosen_id, pertanyaan, dll

---

## SETELAH INI

Fitur "Ambil dari Bank Soal" akan berfungsi:
1. Buat kuis → Simpan
2. Klik [Ambil dari Bank]
3. Dialog muncul dengan list soal
4. Centang soal
5. Klik [Tambahkan X Soal] ← TOMBOL INI AKAN MUNCUL!

---

**Status:** Table belum ada = Fitur tidak jalan ❌
**Setelah fix:** Table ada = Fitur jalan ✅
