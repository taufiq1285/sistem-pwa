-- ============================================================================
-- RLS POLICY FIX UNTUK TABEL PEMINJAMAN
-- Copy & Paste semua code ini ke Supabase SQL Editor
-- ============================================================================

-- Step 1: Disable RLS temporarily jika diperlukan (optional)
-- ALTER TABLE peminjaman DISABLE ROW LEVEL SECURITY;

-- Step 2: Hapus policy lama yang mungkin blocking (jika ada)
DROP POLICY IF EXISTS "Allow dosen to create borrowing requests" ON peminjaman;
DROP POLICY IF EXISTS "Allow laboran to manage peminjaman" ON peminjaman;
DROP POLICY IF EXISTS "Users can view peminjaman" ON peminjaman;

-- Step 3: Buat policy BARU yang benar

-- Policy 1: Allow dosen/mahasiswa to CREATE borrowing requests (INSERT)
CREATE POLICY "Allow authenticated users to create borrowing requests"
ON peminjaman
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy 2: Allow users to VIEW peminjaman (SELECT)
CREATE POLICY "Allow authenticated users to view peminjaman"
ON peminjaman
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy 3: Allow laboran to UPDATE peminjaman (approve/reject/return)
CREATE POLICY "Allow laboran to update peminjaman"
ON peminjaman
FOR UPDATE
USING (
  -- Check apakah user adalah laboran
  EXISTS (
    SELECT 1 FROM laboran
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM laboran
    WHERE user_id = auth.uid()
  )
);

-- Step 4: Enable RLS (pastikan ini enabled)
ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verifikasi: Cek apakah RLS sudah enabled dengan benar
-- ============================================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'peminjaman';

-- ============================================================================
-- ALTERNATIVE: Jika mau lebih permissive (less secure tapi simpler)
-- Gunakan code di bawah ini saja:
-- ============================================================================

-- DROP POLICY IF EXISTS "Allow authenticated users to create borrowing requests" ON peminjaman;
-- DROP POLICY IF EXISTS "Allow authenticated users to view peminjaman" ON peminjaman;
-- DROP POLICY IF EXISTS "Allow laboran to update peminjaman" ON peminjaman;

-- CREATE POLICY "Allow all authenticated actions on peminjaman"
-- ON peminjaman
-- FOR ALL
-- USING (auth.uid() IS NOT NULL)
-- WITH CHECK (auth.uid() IS NOT NULL);

-- ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;
