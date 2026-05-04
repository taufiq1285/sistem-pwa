create table if not exists public.peminjaman_detail (
  id uuid primary key default gen_random_uuid(),
  peminjaman_id uuid not null references public.peminjaman(id) on delete cascade,
  inventaris_id uuid not null references public.inventaris(id) on delete restrict,
  jumlah_pinjam integer not null check (jumlah_pinjam > 0),
  kondisi_pinjam text null,
  kondisi_kembali text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (peminjaman_id, inventaris_id)
);

create index if not exists idx_peminjaman_detail_peminjaman_id
  on public.peminjaman_detail (peminjaman_id);

create index if not exists idx_peminjaman_detail_inventaris_id
  on public.peminjaman_detail (inventaris_id);

comment on table public.peminjaman_detail is
  'Daftar item alat untuk satu header peminjaman praktikum.';

comment on column public.peminjaman_detail.peminjaman_id is
  'Header pengajuan peminjaman untuk satu kegiatan praktikum.';

comment on column public.peminjaman_detail.inventaris_id is
  'Item inventaris yang dipinjam pada pengajuan ini.';

alter table public.peminjaman_detail enable row level security;

create or replace function public.can_access_peminjaman_detail(
  p_peminjaman_id uuid,
  p_allow_staff boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if p_allow_staff and ((select public.is_admin()) or (select public.is_laboran())) then
    return true;
  end if;

  return exists (
    select 1
    from public.peminjaman p
    where p.id = p_peminjaman_id
      and p.dosen_id = (select public.get_current_dosen_id())
  );
end;
$$;

create or replace function public.can_manage_peminjaman_detail(
  p_peminjaman_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1
    from public.peminjaman p
    where p.id = p_peminjaman_id
      and p.dosen_id = (select public.get_current_dosen_id())
      and p.status = 'pending'
  );
end;
$$;

drop policy if exists "peminjaman_detail_select" on public.peminjaman_detail;
create policy "peminjaman_detail_select" on public.peminjaman_detail
  for select
  using (
    (select public.can_access_peminjaman_detail(peminjaman_id, true))
  );

drop policy if exists "peminjaman_detail_insert" on public.peminjaman_detail;
create policy "peminjaman_detail_insert" on public.peminjaman_detail
  for insert
  with check (
    (select public.can_manage_peminjaman_detail(peminjaman_id))
  );

drop policy if exists "peminjaman_detail_update" on public.peminjaman_detail;
create policy "peminjaman_detail_update" on public.peminjaman_detail
  for update
  using (
    (select public.can_manage_peminjaman_detail(peminjaman_id))
  )
  with check (
    (select public.can_manage_peminjaman_detail(peminjaman_id))
  );

drop policy if exists "peminjaman_detail_delete" on public.peminjaman_detail;
create policy "peminjaman_detail_delete" on public.peminjaman_detail
  for delete
  using (
    (select public.can_manage_peminjaman_detail(peminjaman_id))
  );

insert into public.peminjaman_detail (
  peminjaman_id,
  inventaris_id,
  jumlah_pinjam,
  kondisi_pinjam,
  kondisi_kembali,
  created_at,
  updated_at
)
select
  p.id,
  p.inventaris_id,
  p.jumlah_pinjam,
  p.kondisi_pinjam,
  p.kondisi_kembali,
  coalesce(p.created_at, now()),
  coalesce(p.updated_at, now())
from public.peminjaman p
where p.inventaris_id is not null
  and p.jumlah_pinjam is not null
  and p.jumlah_pinjam > 0
  and not exists (
    select 1
    from public.peminjaman_detail d
    where d.peminjaman_id = p.id
      and d.inventaris_id = p.inventaris_id
  );

create or replace function public.update_peminjaman_detail_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_peminjaman_detail_updated_at on public.peminjaman_detail;
create trigger update_peminjaman_detail_updated_at
before update on public.peminjaman_detail
for each row
execute function public.update_peminjaman_detail_updated_at();

create or replace function public.apply_peminjaman_stock_delta(
  p_peminjaman_id uuid,
  p_direction integer
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_has_detail boolean;
  v_legacy_item record;
  v_detail_item record;
begin
  select exists (
    select 1
    from public.peminjaman_detail
    where peminjaman_id = p_peminjaman_id
  )
  into v_has_detail;

  if v_has_detail then
    for v_detail_item in
      select inventaris_id, jumlah_pinjam
      from public.peminjaman_detail
      where peminjaman_id = p_peminjaman_id
    loop
      update public.inventaris
      set jumlah_tersedia = jumlah_tersedia + (p_direction * v_detail_item.jumlah_pinjam)
      where id = v_detail_item.inventaris_id;
    end loop;
  else
    select inventaris_id, jumlah_pinjam
    into v_legacy_item
    from public.peminjaman
    where id = p_peminjaman_id;

    if v_legacy_item.inventaris_id is not null
       and v_legacy_item.jumlah_pinjam is not null then
      update public.inventaris
      set jumlah_tersedia = jumlah_tersedia + (p_direction * v_legacy_item.jumlah_pinjam)
      where id = v_legacy_item.inventaris_id;
    end if;
  end if;
end;
$$;

create or replace function public.update_inventory_availability()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    if new.status = 'approved'
       and (old is null or old.status is distinct from 'approved') then
      perform public.apply_peminjaman_stock_delta(new.id, -1);
    elsif new.status = 'returned'
       and old.status = 'return_requested' then
      perform public.apply_peminjaman_stock_delta(new.id, 1);
    end if;
  elsif tg_op = 'DELETE' then
    if old.status = 'approved' then
      perform public.apply_peminjaman_stock_delta(old.id, 1);
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists update_inventaris_availability on public.peminjaman;
create trigger update_inventaris_availability
after insert or update or delete on public.peminjaman
for each row
execute function public.update_inventory_availability();
