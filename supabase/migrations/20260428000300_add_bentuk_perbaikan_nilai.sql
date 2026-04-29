-- Add structured revision action chosen by dosen when approving grade revision requests.
-- Existing approved rows are not backfilled; the CHECK is NOT VALID so old data stays readable.

alter table public.permintaan_perbaikan_nilai
add column if not exists bentuk_perbaikan text;

alter table public.permintaan_perbaikan_nilai
add column if not exists instruksi_perbaikan text;

alter table public.permintaan_perbaikan_nilai
drop constraint if exists check_nilai_baru_on_approval;

alter table public.permintaan_perbaikan_nilai
drop constraint if exists check_bentuk_perbaikan_allowed;

alter table public.permintaan_perbaikan_nilai
add constraint check_bentuk_perbaikan_allowed
check (
  bentuk_perbaikan is null
  or bentuk_perbaikan in (
    'remedial',
    'tugas_tambahan',
    'ujian_ulang',
    'koreksi_nilai',
    'konsultasi_dosen',
    'lainnya'
  )
);

alter table public.permintaan_perbaikan_nilai
drop constraint if exists check_approved_revision_instruction;

alter table public.permintaan_perbaikan_nilai
add constraint check_approved_revision_instruction
check (
  status <> 'approved'
  or (
    bentuk_perbaikan is not null
    and nullif(trim(instruksi_perbaikan), '') is not null
  )
) not valid;

comment on column public.permintaan_perbaikan_nilai.bentuk_perbaikan is
'Bentuk perbaikan nilai yang dipilih dosen saat menyetujui pengajuan.';

comment on column public.permintaan_perbaikan_nilai.instruksi_perbaikan is
'Instruksi dosen untuk mahasiswa setelah pengajuan perbaikan nilai disetujui.';
