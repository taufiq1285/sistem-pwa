-- ============================================================================
-- FIX CBT GRADING FROM pilihan_jawaban.is_correct
-- Gunakan jika soal CBT lama menyimpan kunci benar di pilihan_jawaban[].is_correct
-- sementara jawaban_benar kosong/null, sehingga auto-grading lama salah memberi 0.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. PREVIEW: lihat jawaban CBT yang berpotensi salah grading
-- ----------------------------------------------------------------------------
select
  j.id as jawaban_id,
  j.attempt_id,
  j.soal_id,
  j.jawaban_mahasiswa,
  j.poin_diperoleh as poin_lama,
  j.is_correct as is_correct_lama,
  s.poin as poin_maksimal,
  (
    select opt->>'id'
    from jsonb_array_elements(s.pilihan_jawaban) opt
    where coalesce((opt->>'is_correct')::boolean, false) = true
    limit 1
  ) as correct_option_id,
  (
    select opt->>'label'
    from jsonb_array_elements(s.pilihan_jawaban) opt
    where coalesce((opt->>'is_correct')::boolean, false) = true
    limit 1
  ) as correct_option_label,
  case
    when j.jawaban_mahasiswa = (
      select opt->>'id'
      from jsonb_array_elements(s.pilihan_jawaban) opt
      where coalesce((opt->>'is_correct')::boolean, false) = true
      limit 1
    ) then true
    when j.jawaban_mahasiswa = (
      select opt->>'label'
      from jsonb_array_elements(s.pilihan_jawaban) opt
      where coalesce((opt->>'is_correct')::boolean, false) = true
      limit 1
    ) then true
    else false
  end as is_correct_hasil_fix
from jawaban j
join soal s on s.id = j.soal_id
join attempt_kuis ak on ak.id = j.attempt_id
join kuis k on k.id = ak.kuis_id
where k.tipe_kuis = 'pilihan_ganda'
  and s.pilihan_jawaban is not null
order by ak.updated_at desc nulls last;

-- ----------------------------------------------------------------------------
-- B. FIX jawaban CBT berdasarkan pilihan_jawaban[].is_correct
-- ----------------------------------------------------------------------------
/*
with cbt_answer_fix as (
  select
    j.id as jawaban_id,
    s.poin as poin_maksimal,
    case
      when j.jawaban_mahasiswa = (
        select opt->>'id'
        from jsonb_array_elements(s.pilihan_jawaban) opt
        where coalesce((opt->>'is_correct')::boolean, false) = true
        limit 1
      ) then true
      when j.jawaban_mahasiswa = (
        select opt->>'label'
        from jsonb_array_elements(s.pilihan_jawaban) opt
        where coalesce((opt->>'is_correct')::boolean, false) = true
        limit 1
      ) then true
      else false
    end as is_correct_baru
  from jawaban j
  join soal s on s.id = j.soal_id
  join attempt_kuis ak on ak.id = j.attempt_id
  join kuis k on k.id = ak.kuis_id
  where k.tipe_kuis = 'pilihan_ganda'
    and s.pilihan_jawaban is not null
)
update jawaban j
set
  is_correct = f.is_correct_baru,
  poin_diperoleh = case when f.is_correct_baru then f.poin_maksimal else 0 end,
  updated_at = now()
from cbt_answer_fix f
where j.id = f.jawaban_id;
*/

-- ----------------------------------------------------------------------------
-- C. FIX attempt_kuis CBT sesudah jawaban diperbaiki
-- ----------------------------------------------------------------------------
/*
update attempt_kuis ak
set
  status = 'graded',
  total_poin = agg.total_poin_baru,
  updated_at = now()
from (
  select
    j.attempt_id,
    coalesce(sum(j.poin_diperoleh), 0) as total_poin_baru
  from jawaban j
  join attempt_kuis ak2 on ak2.id = j.attempt_id
  join kuis k on k.id = ak2.kuis_id
  where k.tipe_kuis = 'pilihan_ganda'
  group by j.attempt_id
) agg
where ak.id = agg.attempt_id;
*/

-- ----------------------------------------------------------------------------
-- D. VERIFY satu attempt tertentu (opsional)
-- Ganti ATTEMPT_ID sesuai kebutuhan.
-- ----------------------------------------------------------------------------
/*
select
  ak.id,
  ak.status,
  ak.total_poin,
  ak.updated_at
from attempt_kuis ak
where ak.id = 'ATTEMPT_ID';
*/
