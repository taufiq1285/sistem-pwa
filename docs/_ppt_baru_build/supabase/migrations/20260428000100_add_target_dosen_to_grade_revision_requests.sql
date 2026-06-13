-- ============================================================================
-- Scope grade revision requests by selected mata kuliah and target dosen
-- ============================================================================

alter table public.nilai
add column if not exists dosen_id uuid;

alter table public.permintaan_perbaikan_nilai
add column if not exists mata_kuliah_id uuid;

alter table public.permintaan_perbaikan_nilai
add column if not exists target_dosen_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'nilai_dosen_id_fkey'
      and conrelid = 'public.nilai'::regclass
  ) then
    alter table public.nilai
    add constraint nilai_dosen_id_fkey
    foreign key (dosen_id)
    references public.dosen(id)
    on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'permintaan_perbaikan_nilai_mata_kuliah_id_fkey'
      and conrelid = 'public.permintaan_perbaikan_nilai'::regclass
  ) then
    alter table public.permintaan_perbaikan_nilai
    add constraint permintaan_perbaikan_nilai_mata_kuliah_id_fkey
    foreign key (mata_kuliah_id)
    references public.mata_kuliah(id)
    on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'permintaan_perbaikan_nilai_target_dosen_id_fkey'
      and conrelid = 'public.permintaan_perbaikan_nilai'::regclass
  ) then
    alter table public.permintaan_perbaikan_nilai
    add constraint permintaan_perbaikan_nilai_target_dosen_id_fkey
    foreign key (target_dosen_id)
    references public.dosen(id)
    on delete set null;
  end if;
end $$;

update public.nilai n
set dosen_id = k.dosen_id
from public.kelas k
where k.id = n.kelas_id
  and n.dosen_id is null
  and k.dosen_id is not null;

update public.permintaan_perbaikan_nilai ppn
set mata_kuliah_id = n.mata_kuliah_id
from public.nilai n
where n.id = ppn.nilai_id
  and ppn.mata_kuliah_id is null
  and n.mata_kuliah_id is not null;

update public.permintaan_perbaikan_nilai ppn
set target_dosen_id = n.dosen_id
from public.nilai n
where n.id = ppn.nilai_id
  and ppn.target_dosen_id is null
  and n.dosen_id is not null;

update public.permintaan_perbaikan_nilai ppn
set target_dosen_id = k.dosen_id
from public.kelas k
where k.id = ppn.kelas_id
  and ppn.target_dosen_id is null
  and k.dosen_id is not null;

create index if not exists idx_nilai_dosen_id
on public.nilai(dosen_id)
where dosen_id is not null;

create index if not exists idx_perbaikan_nilai_mata_kuliah_id
on public.permintaan_perbaikan_nilai(mata_kuliah_id)
where mata_kuliah_id is not null;

create index if not exists idx_perbaikan_nilai_target_dosen_id
on public.permintaan_perbaikan_nilai(target_dosen_id)
where target_dosen_id is not null;

comment on column public.permintaan_perbaikan_nilai.mata_kuliah_id is
'Mata kuliah nilai yang dipilih mahasiswa saat mengajukan perbaikan.';

comment on column public.permintaan_perbaikan_nilai.target_dosen_id is
'Dosen tujuan yang dipilih mahasiswa untuk review perbaikan nilai.';

comment on column public.nilai.dosen_id is
'Dosen terakhir yang memasukkan atau memperbarui nilai ini.';

-- Keep legacy kelas ownership access, but add direct access for the selected
-- target dosen so requests still work when kelas is master/general data.
drop policy if exists "Dosen can view requests for their classes" on public.permintaan_perbaikan_nilai;
create policy "Dosen can view requests for their classes"
  on public.permintaan_perbaikan_nilai
  for select
  using (
    target_dosen_id = get_current_dosen_id()
    or kelas_id in (
      select id from public.kelas where dosen_id = get_current_dosen_id()
    )
  );

drop policy if exists "Dosen can update requests for their classes" on public.permintaan_perbaikan_nilai;
create policy "Dosen can update requests for their classes"
  on public.permintaan_perbaikan_nilai
  for update
  using (
    target_dosen_id = get_current_dosen_id()
    or kelas_id in (
      select id from public.kelas where dosen_id = get_current_dosen_id()
    )
  );
