alter table public.peminjaman
add column if not exists jadwal_praktikum_id uuid null references public.jadwal_praktikum(id) on delete set null;

alter table public.peminjaman
add column if not exists laboratorium_tujuan_id uuid null references public.laboratorium(id) on delete set null;

alter table public.peminjaman
add column if not exists laboratorium_tujuan_nama text null;

create index if not exists idx_peminjaman_jadwal_praktikum_id
  on public.peminjaman (jadwal_praktikum_id);

create index if not exists idx_peminjaman_laboratorium_tujuan_id
  on public.peminjaman (laboratorium_tujuan_id);

comment on column public.peminjaman.jadwal_praktikum_id is
  'Referensi jadwal praktikum yang menjadi konteks penggunaan alat.';

comment on column public.peminjaman.laboratorium_tujuan_id is
  'Snapshot foreign key lab tujuan praktikum saat peminjaman dibuat.';

comment on column public.peminjaman.laboratorium_tujuan_nama is
  'Snapshot nama lab tujuan praktikum agar data riwayat tetap stabil.';
