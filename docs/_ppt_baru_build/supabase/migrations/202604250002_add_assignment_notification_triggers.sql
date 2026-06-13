-- Robust notification triggers for assignment lifecycle.
-- This avoids client-side RLS issues when resolving mahasiswa/dosen targets.

create or replace function public.notify_kuis_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dosen_name text;
  v_kelas_name text;
  v_deadline text;
  v_title text;
  v_message text;
begin
  if new.status <> 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;

  select u.full_name
    into v_dosen_name
  from public.dosen d
  join public.users u on u.id = d.user_id
  where d.id = new.dosen_id;

  select k.nama_kelas
    into v_kelas_name
  from public.kelas k
  where k.id = new.kelas_id;

  v_deadline := coalesce(to_char(new.tanggal_selesai, 'DD Mon YYYY HH24:MI'), '-');
  v_title := case
    when new.tipe_kuis = 'essay' then 'Tugas Laporan Praktikum Tersedia'
    else 'Tugas CBT Praktikum Tersedia'
  end;

  v_message := format(
    '%s telah mempublikasikan %s "%s" untuk kelas %s. Deadline: %s',
    coalesce(v_dosen_name, 'Dosen'),
    case
      when new.tipe_kuis = 'essay' then 'tugas laporan'
      else 'tugas CBT'
    end,
    new.judul,
    coalesce(v_kelas_name, 'Kelas'),
    v_deadline
  );

  insert into public.notifications (user_id, title, message, type, data, is_read)
  select
    m.user_id,
    v_title,
    v_message,
    'kuis_published',
    jsonb_build_object(
      'kuis_id', new.id,
      'kuis', new.judul,
      'dosen', coalesce(v_dosen_name, 'Dosen'),
      'kelas', coalesce(v_kelas_name, 'Kelas'),
      'deadline', coalesce(new.tanggal_selesai::text, ''),
      'tipe_kuis', new.tipe_kuis
    ),
    false
  from public.kelas_mahasiswa km
  join public.mahasiswa m on m.id = km.mahasiswa_id
  where km.kelas_id = new.kelas_id
    and km.is_active = true;

  return new;
end;
$$;

drop trigger if exists trg_notify_kuis_published on public.kuis;
create trigger trg_notify_kuis_published
after insert or update on public.kuis
for each row
execute function public.notify_kuis_published();


create or replace function public.notify_attempt_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dosen_user_id uuid;
  v_mahasiswa_name text;
  v_tugas_name text;
begin
  if new.status not in ('submitted', 'graded') then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status in ('submitted', 'graded') then
    return new;
  end if;

  select d.user_id, k.judul
    into v_dosen_user_id, v_tugas_name
  from public.kuis k
  join public.dosen d on d.id = k.dosen_id
  where k.id = new.kuis_id;

  select u.full_name
    into v_mahasiswa_name
  from public.mahasiswa m
  join public.users u on u.id = m.user_id
  where m.id = new.mahasiswa_id;

  if v_dosen_user_id is not null then
    insert into public.notifications (user_id, title, message, type, data, is_read)
    values (
      v_dosen_user_id,
      'Tugas Praktikum Dikumpulkan',
      format(
        '%s telah mengumpulkan tugas praktikum "%s"',
        coalesce(v_mahasiswa_name, 'Mahasiswa'),
        coalesce(v_tugas_name, 'Tugas Praktikum')
      ),
      'tugas_submitted',
      jsonb_build_object(
        'attempt_id', new.id,
        'kuis_id', new.kuis_id
      ),
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_attempt_submitted on public.attempt_kuis;
create trigger trg_notify_attempt_submitted
after insert or update on public.attempt_kuis
for each row
execute function public.notify_attempt_submitted();
