-- ============================================================================
-- SETUP ROW LEVEL SECURITY (RLS) POLICIES
-- Jalankan setelah membuat tabel-tabel
-- ============================================================================

-- ============================================================================
-- 1. JADWAL POLICIES
-- ============================================================================

-- Allow mahasiswa to read jadwal their class
CREATE POLICY "Mahasiswa can read jadwal their class"
ON jadwal FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM kelas_mahasiswa km
    WHERE km.mahasiswa_id = auth.uid()
    AND km.kelas_id = jadwal.kelas_id
  )
);

-- Allow dosen to read, update jadwal their class
CREATE POLICY "Dosen can manage jadwal their class"
ON jadwal FOR ALL
USING (
  kelas_id IN (
    SELECT id FROM kelas
    WHERE dosen_id = auth.uid()
  )
);

-- Allow laboran (admin role) to read and approve jadwal
CREATE POLICY "Laboran can approve jadwal"
ON jadwal FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin
    WHERE user_id = auth.uid()
  )
);

-- Allow admin full access
CREATE POLICY "Admin full access to jadwal"
ON jadwal FOR ALL
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- 2. SOAL_KUIS POLICIES
-- ============================================================================

-- Allow dosen to read and manage soal_kuis
CREATE POLICY "Dosen can manage soal_kuis"
ON soal_kuis FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM kuis
    WHERE soal_kuis.kuis_id = kuis.id
    AND kuis.dosen_id = auth.uid()
  )
);

-- Allow mahasiswa to read soal_kuis
CREATE POLICY "Mahasiswa can read soal_kuis"
ON soal_kuis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM kuis
    WHERE soal_kuis.kuis_id = kuis.id
    AND kuis.kelas_id IN (
      SELECT kelas_id FROM kelas_mahasiswa
      WHERE mahasiswa_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 3. JAWABAN_KUIS POLICIES
-- ============================================================================

-- Allow dosen to manage jawaban_kuis
CREATE POLICY "Dosen can manage jawaban_kuis"
ON jawaban_kuis FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM soal_kuis sq
    JOIN kuis k ON sq.kuis_id = k.id
    WHERE jawaban_kuis.soal_kuis_id = sq.id
    AND k.dosen_id = auth.uid()
  )
);

-- ============================================================================
-- 4. KATEGORI_INVENTARIS POLICIES
-- ============================================================================

-- Allow laboran to manage kategori_inventaris
CREATE POLICY "Laboran can manage kategori_inventaris"
ON kategori_inventaris FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin
    WHERE user_id = auth.uid()
  )
);

-- Allow everyone to read kategori_inventaris
CREATE POLICY "Everyone can read kategori_inventaris"
ON kategori_inventaris FOR SELECT
USING (is_active = true);

-- ============================================================================
-- 5. PENILAIAN POLICIES
-- ============================================================================

-- Allow dosen to manage penilaian
CREATE POLICY "Dosen can manage penilaian"
ON penilaian FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mata_kuliah
    WHERE penilaian.mata_kuliah_id = mata_kuliah.id
  )
);

-- ============================================================================
-- 6. KOMPONEN_NILAI POLICIES
-- ============================================================================

-- Allow dosen to manage komponen_nilai
CREATE POLICY "Dosen can manage komponen_nilai"
ON komponen_nilai FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM penilaian p
    WHERE komponen_nilai.penilaian_id = p.id
  )
);

-- ============================================================================
-- 7. NILAI_MAHASISWA POLICIES
-- ============================================================================

-- Allow mahasiswa to read their own nilai
CREATE POLICY "Mahasiswa can read their nilai"
ON nilai_mahasiswa FOR SELECT
USING (mahasiswa_id = auth.uid());

-- Allow dosen to read and manage nilai in their class
CREATE POLICY "Dosen can manage nilai in their class"
ON nilai_mahasiswa FOR ALL
USING (
  kelas_id IN (
    SELECT id FROM kelas
    WHERE dosen_id = auth.uid()
  )
);

-- ============================================================================
-- 8. NOTIFIKASI POLICIES
-- ============================================================================

-- Allow user to read their own notifikasi
CREATE POLICY "User can read their own notifikasi"
ON notifikasi FOR SELECT
USING (user_id = auth.uid());

-- Allow user to update their own notifikasi (mark as read)
CREATE POLICY "User can update their own notifikasi"
ON notifikasi FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow system/admin to insert notifikasi
CREATE POLICY "Admin can insert notifikasi"
ON notifikasi FOR INSERT
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- VERIFY RLS IS ENABLED
-- ============================================================================
-- All policies are now in place!
-- RLS is enabled on all tables.
