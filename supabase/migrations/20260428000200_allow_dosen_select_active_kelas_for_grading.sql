-- ============================================================================
-- Allow dosen to select active master kelas for grading
-- ============================================================================
-- Penilaian uses admin master kelas + admin master mata kuliah as independent
-- selections, so dosen must be able to read active kelas even when kelas.dosen_id
-- is null or assigned to another teaching context.

alter table public.kelas enable row level security;

drop policy if exists "kelas_select_dosen" on public.kelas;

create policy "kelas_select_dosen"
on public.kelas
for select
using (
  is_dosen()
  and is_active = true
);
