-- Disable legacy automatic grade mutation on approved revision requests.
-- The current flow only records approval + repair instructions; dosen updates
-- final grades manually from Penilaian Mahasiswa so weighting stays consistent.

drop trigger if exists trigger_auto_update_nilai_on_approval
on public.permintaan_perbaikan_nilai;

drop function if exists public.auto_update_nilai_on_approval();

comment on column public.permintaan_perbaikan_nilai.nilai_baru is
'Legacy approved score field. Current flow keeps this null and stores bentuk_perbaikan + instruksi_perbaikan; final nilai is updated manually from Penilaian Mahasiswa.';
