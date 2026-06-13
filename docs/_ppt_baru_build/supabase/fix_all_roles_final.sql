-- ============================================================================
-- FIX ALL ROLES - Perbaiki semua role berdasarkan metadata
-- ============================================================================

-- STEP 1: Update role dosen
UPDATE public.users
SET role = 'dosen'::user_role, updated_at = NOW()
WHERE email = 'dosen@akbid.ac.id';

-- STEP 2: Update role laboran
UPDATE public.users
SET role = 'laboran'::user_role, updated_at = NOW()
WHERE email = 'laboran@akbid.ac.id';

-- STEP 3: Update role mahasiswa
UPDATE public.users
SET role = 'mahasiswa'::user_role, updated_at = NOW()
WHERE email = 'mahasiswa@akbid.ac.id';

-- STEP 4: Buat dosen profile
INSERT INTO public.dosen (user_id, nip, gelar_depan, gelar_belakang)
SELECT id, 'NIP-DOSEN-001', NULL, NULL
FROM public.users WHERE email = 'dosen@akbid.ac.id'
ON CONFLICT (user_id) DO NOTHING;

-- STEP 5: Buat laboran profile
INSERT INTO public.laboran (user_id, nip)
SELECT id, 'NIP-LAB-001'
FROM public.users WHERE email = 'laboran@akbid.ac.id'
ON CONFLICT (user_id) DO NOTHING;

-- STEP 6: Buat mahasiswa profile
INSERT INTO public.mahasiswa (user_id, nim, program_studi, angkatan, semester)
SELECT id, 'NIM-2024-001', 'Teknik Informatika', 2024, 1
FROM public.users WHERE email = 'mahasiswa@akbid.ac.id'
ON CONFLICT (user_id) DO NOTHING;

-- STEP 7: Hapus admin profiles yang salah (hanya keep yang benar admin)
DELETE FROM public.admin
WHERE user_id IN (
    SELECT id FROM public.users
    WHERE email IN ('dosen@akbid.ac.id', 'laboran@akbid.ac.id', 'mahasiswa@akbid.ac.id')
);

-- STEP 8: Pastikan admin yang benar punya profile
INSERT INTO public.admin (user_id, level, permissions)
SELECT id, 'super_admin', '{
    "manage_users": true,
    "manage_courses": true,
    "manage_labs": true,
    "manage_equipment": true,
    "view_reports": true,
    "manage_system": true
}'::jsonb
FROM public.users
WHERE email IN ('superadmin@akbid.ac.id', 'test@admin.com')
ON CONFLICT (user_id) DO NOTHING;

-- STEP 9: VERIFIKASI - Cek hasil akhir
SELECT
    u.email,
    u.role,
    CASE
        WHEN u.role = 'admin' THEN (SELECT '✅ Admin: ' || a.level FROM admin a WHERE a.user_id = u.id)
        WHEN u.role = 'dosen' THEN (SELECT '✅ Dosen NIP: ' || d.nip FROM dosen d WHERE d.user_id = u.id)
        WHEN u.role = 'mahasiswa' THEN (SELECT '✅ Mahasiswa NIM: ' || m.nim FROM mahasiswa m WHERE m.user_id = u.id)
        WHEN u.role = 'laboran' THEN (SELECT '✅ Laboran NIP: ' || l.nip FROM laboran l WHERE l.user_id = u.id)
        ELSE '❌ No profile'
    END as status
FROM public.users u
ORDER BY u.role, u.email;
