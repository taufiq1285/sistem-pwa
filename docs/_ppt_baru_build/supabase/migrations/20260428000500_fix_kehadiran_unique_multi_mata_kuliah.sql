-- Fix attendance uniqueness for classes that share many mata kuliah.
-- A student may have attendance on the same class/date in different mata kuliah.

-- Diagnostic SQL for Supabase before/after running this migration:
-- select c.conname, pg_get_constraintdef(c.oid) as constraint_def
-- from pg_constraint c
-- where c.conrelid = 'public.kehadiran'::regclass
-- order by c.conname;
--
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'kehadiran'
-- order by indexname;

alter table public.kehadiran
add column if not exists mata_kuliah_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'kehadiran_mata_kuliah_id_fkey'
  ) then
    alter table public.kehadiran
    add constraint kehadiran_mata_kuliah_id_fkey
    foreign key (mata_kuliah_id)
    references public.mata_kuliah(id)
    on delete set null;
  end if;
end $$;

-- Backfill legacy rows so old attendance keeps the correct subject context.
update public.kehadiran k
set mata_kuliah_id = coalesce(j.mata_kuliah_id, kelas_data.mata_kuliah_id)
from public.jadwal_praktikum j, public.kelas kelas_data
where k.jadwal_id = j.id
  and kelas_data.id = coalesce(k.kelas_id, j.kelas_id)
  and k.mata_kuliah_id is null;

update public.kehadiran k
set mata_kuliah_id = kelas_data.mata_kuliah_id
from public.kelas kelas_data
where k.kelas_id = kelas_data.id
  and k.jadwal_id is null
  and k.mata_kuliah_id is null
  and kelas_data.mata_kuliah_id is not null;

-- Remove old rules that can treat different mata kuliah as the same attendance.
alter table public.kehadiran
drop constraint if exists kehadiran_unique;

alter table public.kehadiran
drop constraint if exists kehadiran_unique_hybrid;

drop index if exists public.kehadiran_unique;
drop index if exists public.kehadiran_unique_hybrid;
drop index if exists public.idx_kehadiran_unique;
drop index if exists public.idx_kehadiran_unique_hybrid;
drop index if exists public.idx_kehadiran_unique_kelas_tanggal_mahasiswa;

alter table public.kehadiran
add constraint kehadiran_unique_hybrid
unique nulls not distinct (
  jadwal_id,
  kelas_id,
  mata_kuliah_id,
  tanggal,
  mahasiswa_id
);

create index if not exists idx_kehadiran_kelas_mk_tanggal
on public.kehadiran(kelas_id, mata_kuliah_id, tanggal)
where kelas_id is not null
  and mata_kuliah_id is not null
  and tanggal is not null;

comment on constraint kehadiran_unique_hybrid on public.kehadiran is
'Satu mahasiswa hanya boleh punya satu record kehadiran untuk kombinasi jadwal + kelas + mata kuliah + tanggal.';

comment on index public.idx_kehadiran_kelas_mk_tanggal is
'Lookup cepat untuk riwayat dan simpan kehadiran per kelas, mata kuliah, dan tanggal.';
