-- ============================================================================
-- DAY 14: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- MAHASISWA POLICIES
-- ============================================================================

CREATE POLICY "Mahasiswa can view own profile" ON mahasiswa 
FOR SELECT USING (
    user_id = auth.uid() OR 
    get_user_role() IN ('admin', 'dosen')
);

CREATE POLICY "Mahasiswa can update own profile" ON mahasiswa 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage mahasiswa" ON mahasiswa 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- DOSEN POLICIES
-- ============================================================================

CREATE POLICY "Dosen viewable by authenticated users" ON dosen 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Dosen can update own profile" ON dosen 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage dosen" ON dosen 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- LABORAN POLICIES
-- ============================================================================

CREATE POLICY "Laboran viewable by authenticated users" ON laboran 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Laboran can update own profile" ON laboran 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage laboran" ON laboran 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- ADMIN POLICIES
-- ============================================================================

CREATE POLICY "Admins can view all admin" ON admin 
FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can manage admin" ON admin 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- MATA KULIAH POLICIES
-- ============================================================================

CREATE POLICY "Mata kuliah viewable by authenticated users" ON mata_kuliah 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Dosen can manage mata kuliah" ON mata_kuliah 
FOR ALL USING (get_user_role() IN ('admin', 'dosen'));

-- ============================================================================
-- LABORATORIUM POLICIES
-- ============================================================================

CREATE POLICY "Laboratorium viewable by all" ON laboratorium 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Laboran can manage laboratorium" ON laboratorium 
FOR ALL USING (get_user_role() IN ('admin', 'laboran'));

-- ============================================================================
-- KELAS POLICIES
-- ============================================================================

CREATE POLICY "Kelas viewable by authenticated users" ON kelas 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Dosen can manage own kelas" ON kelas 
FOR ALL USING (
    get_user_role() = 'dosen' AND 
    dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all kelas" ON kelas 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- KELAS MAHASISWA POLICIES
-- ============================================================================

CREATE POLICY "Students can view own enrollments" ON kelas_mahasiswa 
FOR SELECT USING (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) OR 
    get_user_role() IN ('admin', 'dosen')
);

CREATE POLICY "Admin and Dosen can manage enrollments" ON kelas_mahasiswa 
FOR ALL USING (get_user_role() IN ('admin', 'dosen'));

-- ============================================================================
-- JADWAL PRAKTIKUM POLICIES
-- ============================================================================

CREATE POLICY "Jadwal viewable by authenticated users" ON jadwal_praktikum 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Dosen can manage jadwal for own kelas" ON jadwal_praktikum 
FOR ALL USING (
    get_user_role() = 'dosen' AND 
    kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid()))
);

CREATE POLICY "Admins can manage all jadwal" ON jadwal_praktikum 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- MATERI POLICIES
-- ============================================================================

CREATE POLICY "Materi viewable by kelas members" ON materi 
FOR SELECT USING (
    kelas_id IN (
        SELECT kelas_id FROM kelas_mahasiswa 
        WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
    ) OR
    kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())) OR
    get_user_role() = 'admin'
);

CREATE POLICY "Dosen can manage materi for own kelas" ON materi 
FOR ALL USING (
    get_user_role() = 'dosen' AND 
    dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all materi" ON materi 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- KUIS POLICIES (CRITICAL - Offline support)
-- ============================================================================

CREATE POLICY "Students can view published kuis in their kelas" ON kuis 
FOR SELECT USING (
    status = 'published' AND kelas_id IN (
        SELECT kelas_id FROM kelas_mahasiswa 
        WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
    ) OR
    get_user_role() IN ('admin', 'dosen')
);

CREATE POLICY "Dosen can manage kuis for own kelas" ON kuis 
FOR ALL USING (
    get_user_role() = 'dosen' AND 
    dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all kuis" ON kuis 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- SOAL POLICIES
-- ============================================================================

CREATE POLICY "Students can view soal when attempting quiz" ON soal 
FOR SELECT USING (
    kuis_id IN (
        SELECT kuis_id FROM attempt_kuis 
        WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) 
        AND status = 'in_progress'
    ) OR
    get_user_role() IN ('admin', 'dosen')
);

CREATE POLICY "Dosen can manage soal for own kuis" ON soal 
FOR ALL USING (
    get_user_role() = 'dosen' AND 
    kuis_id IN (SELECT id FROM kuis WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid()))
);

CREATE POLICY "Admins can manage all soal" ON soal 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- ATTEMPT KUIS POLICIES (CRITICAL - Offline support)
-- ============================================================================

CREATE POLICY "Students can view own attempts" ON attempt_kuis 
FOR SELECT USING (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) OR
    get_user_role() IN ('admin', 'dosen')
);

CREATE POLICY "Students can create own attempts" ON attempt_kuis 
FOR INSERT WITH CHECK (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
);

CREATE POLICY "Students can update own in-progress attempts" ON attempt_kuis 
FOR UPDATE USING (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) AND
    status = 'in_progress'
);

CREATE POLICY "Dosen can grade attempts" ON attempt_kuis 
FOR UPDATE USING (
    get_user_role() = 'dosen' AND
    kuis_id IN (SELECT id FROM kuis WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid()))
);

-- ============================================================================
-- JAWABAN POLICIES (CRITICAL - Offline support)
-- ============================================================================

CREATE POLICY "Students can view own jawaban" ON jawaban 
FOR SELECT USING (
    attempt_id IN (
        SELECT id FROM attempt_kuis 
        WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
    ) OR
    get_user_role() IN ('admin', 'dosen')
);

CREATE POLICY "Students can insert own jawaban" ON jawaban 
FOR INSERT WITH CHECK (
    attempt_id IN (
        SELECT id FROM attempt_kuis 
        WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) 
        AND status = 'in_progress'
    )
);

CREATE POLICY "Students can update own jawaban" ON jawaban 
FOR UPDATE USING (
    attempt_id IN (
        SELECT id FROM attempt_kuis 
        WHERE mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) 
        AND status = 'in_progress'
    )
);

-- ============================================================================
-- NILAI POLICIES
-- ============================================================================

CREATE POLICY "Students can view own grades" ON nilai 
FOR SELECT USING (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) OR
    get_user_role() IN ('admin', 'dosen')
);

CREATE POLICY "Dosen can manage grades for own kelas" ON nilai 
FOR ALL USING (
    get_user_role() = 'dosen' AND
    kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid()))
);

CREATE POLICY "Admins can manage all nilai" ON nilai 
FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- INVENTARIS POLICIES
-- ============================================================================

CREATE POLICY "Inventaris viewable by authenticated users" ON inventaris 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Laboran can manage inventaris" ON inventaris 
FOR ALL USING (get_user_role() IN ('admin', 'laboran'));

-- ============================================================================
-- PEMINJAMAN POLICIES
-- ============================================================================

CREATE POLICY "Users can view own peminjaman" ON peminjaman 
FOR SELECT USING (
    peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) OR
    get_user_role() IN ('admin', 'dosen', 'laboran')
);

CREATE POLICY "Students can create peminjaman" ON peminjaman 
FOR INSERT WITH CHECK (
    peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
);

CREATE POLICY "Students can update own pending peminjaman" ON peminjaman 
FOR UPDATE USING (
    peminjam_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid()) AND 
    status = 'pending'
);

CREATE POLICY "Admin and Laboran can manage peminjaman" ON peminjaman 
FOR ALL USING (get_user_role() IN ('admin', 'laboran'));

-- ============================================================================
-- PENGUMUMAN POLICIES
-- ============================================================================

CREATE POLICY "Users can view active pengumuman" ON pengumuman 
FOR SELECT USING (
    is_active = true AND
    (target_role IS NULL OR get_user_role() = ANY(target_role))
);

CREATE POLICY "Admin and Dosen can manage pengumuman" ON pengumuman 
FOR ALL USING (get_user_role() IN ('admin', 'dosen'));

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own notifications" ON notifications 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications 
FOR INSERT WITH CHECK (true);