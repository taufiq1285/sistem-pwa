-- ============================================================================
-- FIX RLS PEMINJAMAN DETAIL
-- Jalankan script ini di Supabase SQL Editor bila insert ke peminjaman_detail
-- gagal dengan error "new row violates row-level security policy".
-- ============================================================================

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

select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'peminjaman_detail'
order by policyname;
