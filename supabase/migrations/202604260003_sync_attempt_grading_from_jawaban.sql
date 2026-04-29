-- ============================================================================
-- Sync attempt_kuis grading state from jawaban
-- Prevent laporan/essay attempts from staying "submitted" after dosen grading
-- ============================================================================

create or replace function public.sync_attempt_kuis_grading_state_from_jawaban()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_id uuid := coalesce(new.attempt_id, old.attempt_id);
  v_answer_count integer := 0;
  v_graded_count integer := 0;
  v_total_poin numeric := 0;
begin
  if v_attempt_id is null then
    return coalesce(new, old);
  end if;

  select
    count(*),
    count(*) filter (where poin_diperoleh is not null),
    coalesce(sum(poin_diperoleh), 0)
  into
    v_answer_count,
    v_graded_count,
    v_total_poin
  from public.jawaban
  where attempt_id = v_attempt_id;

  update public.attempt_kuis
  set
    total_poin = case
      when v_graded_count > 0 then v_total_poin
      else null
    end,
    status = case
      when v_answer_count > 0 and v_graded_count = v_answer_count
        then 'graded'::attempt_status
      when status = 'graded'::attempt_status
        then 'submitted'::attempt_status
      else status
    end,
    updated_at = now()
  where id = v_attempt_id
    and status in ('submitted', 'graded');

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_attempt_grading_from_jawaban on public.jawaban;

create trigger trg_sync_attempt_grading_from_jawaban
after insert or update of poin_diperoleh, feedback, is_correct or delete
on public.jawaban
for each row
execute function public.sync_attempt_kuis_grading_state_from_jawaban();
