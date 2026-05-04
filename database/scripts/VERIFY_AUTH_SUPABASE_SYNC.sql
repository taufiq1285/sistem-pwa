-- ============================================================================
-- VERIFY AUTH + SUPABASE SYNC
-- Jalankan di Supabase SQL Editor untuk mengecek sinkronisasi auth/profile/role
-- ============================================================================

-- 1. Cek apakah trigger auto-create profile masih aktif
select
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
order by trigger_name;

-- 2. Cek function handle_new_user masih ada atau tidak
select
  routine_schema,
  routine_name,
  routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'handle_new_user';

-- 3. Cek user auth yang belum punya public.users
select
  au.id as auth_user_id,
  au.email,
  au.created_at
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null
order by au.created_at desc;

-- 4. Cek public.users yang tidak punya auth.users
select
  pu.id as public_user_id,
  pu.email,
  pu.role,
  pu.created_at
from public.users pu
left join auth.users au on au.id = pu.id
where au.id is null
order by pu.created_at desc;

-- 5. Cek sinkronisasi role utama
select
  u.id,
  u.email,
  u.role,
  case when m.user_id is not null then true else false end as has_mahasiswa,
  case when d.user_id is not null then true else false end as has_dosen,
  case when l.user_id is not null then true else false end as has_laboran,
  case when a.user_id is not null then true else false end as has_admin
from public.users u
left join public.mahasiswa m on m.user_id = u.id
left join public.dosen d on d.user_id = u.id
left join public.laboran l on l.user_id = u.id
left join public.admin a on a.user_id = u.id
order by u.created_at desc nulls last;

-- 6. Cek anomali role-specific: role user tidak cocok dengan tabel profil
select
  u.id,
  u.email,
  u.role,
  case
    when u.role = 'mahasiswa' and m.user_id is null then 'missing mahasiswa profile'
    when u.role = 'dosen' and d.user_id is null then 'missing dosen profile'
    when u.role = 'laboran' and l.user_id is null then 'missing laboran profile'
    when u.role = 'admin' and a.user_id is null then 'missing admin profile'
    else null
  end as anomaly
from public.users u
left join public.mahasiswa m on m.user_id = u.id
left join public.dosen d on d.user_id = u.id
left join public.laboran l on l.user_id = u.id
left join public.admin a on a.user_id = u.id
where
  (u.role = 'mahasiswa' and m.user_id is null) or
  (u.role = 'dosen' and d.user_id is null) or
  (u.role = 'laboran' and l.user_id is null) or
  (u.role = 'admin' and a.user_id is null)
order by u.created_at desc nulls last;

-- 7. Cek metadata auth penting untuk registrasi
select
  au.id,
  au.email,
  au.raw_user_meta_data ->> 'role' as meta_role,
  au.raw_user_meta_data ->> 'full_name' as meta_full_name,
  au.raw_user_meta_data ->> 'nim' as meta_nim,
  au.raw_user_meta_data ->> 'nidn' as meta_nidn,
  au.raw_user_meta_data ->> 'nuptk' as meta_nuptk,
  au.raw_user_meta_data ->> 'nip' as meta_nip
from auth.users au
order by au.created_at desc
limit 50;

-- 8. Cek duplicate identifier di tabel role
select 'mahasiswa.nim' as source, nim as identifier, count(*) as total
from public.mahasiswa
where nim is not null
group by nim
having count(*) > 1

union all

select 'dosen.nidn' as source, nidn as identifier, count(*) as total
from public.dosen
where nidn is not null
group by nidn
having count(*) > 1

union all

select 'dosen.nuptk' as source, nuptk as identifier, count(*) as total
from public.dosen
where nuptk is not null
group by nuptk
having count(*) > 1

union all

select 'dosen.nip' as source, nip as identifier, count(*) as total
from public.dosen
where nip is not null
group by nip
having count(*) > 1

union all

select 'laboran.nip' as source, nip as identifier, count(*) as total
from public.laboran
where nip is not null
group by nip
having count(*) > 1;

-- 9. Ringkasan status auth users
select
  count(*) as total_auth_users,
  count(*) filter (where email_confirmed_at is not null) as confirmed_users,
  count(*) filter (where email_confirmed_at is null) as unconfirmed_users
from auth.users;
