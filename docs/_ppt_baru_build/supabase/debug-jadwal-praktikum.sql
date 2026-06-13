-- Debug jadwal_praktikum 403 Forbidden

-- 1. Cek apakah helper functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_dosen', 'is_admin', 'is_laboran', 'dosen_teaches_kelas', 'get_current_dosen_id');

-- 2. Cek current user metadata (jalankan saat logged in sebagai dosen)
SELECT auth.uid() as user_id, auth.email() as email;

-- 3. Cek user role di tabel users
SELECT id, email, role FROM public.users WHERE id = auth.uid();

-- 4. Cek dosen record untuk current user
SELECT id, nip, nama, user_id FROM public.dosen WHERE user_id = auth.uid();

-- 5. Test is_dosen function
SELECT is_dosen() as is_dosen_result;

-- 6. Jika ada kelas_id tertentu yang ingin test, cek apakah dosen mengajar
-- Ganti 'kelas-uuid-here' dengan ID kelas sebenarnya
SELECT dosen_teaches_kelas('kelas-uuid-here'::uuid) as dosen_teaches;

-- 7. Cek current policies di jadwal_praktikum
SELECT policyname, cmd as action, qual, with_check
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- 8. Coba INSERT test (akan show error detail jika policy gagal)
-- Pastikan uuid dan data sesuai
INSERT INTO public.jadwal_praktikum 
  (kelas_id, hari, jam_mulai, jam_selesai, ruangan, created_at, updated_at)
VALUES 
  ('kelas-uuid-here'::uuid, 'Senin', '08:00:00', '10:00:00', 'Lab 1', NOW(), NOW());
