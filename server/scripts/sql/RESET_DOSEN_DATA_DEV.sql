-- RESET_DOSEN_DATA_DEV.sql
-- Lingkungan: DEVELOPMENT ONLY (jangan jalankan di produksi)
-- Tujuan: Bersihkan seluruh data fitur dosen (jadwal, kuis, peminjaman, kehadiran, materi, penilaian)
-- NOTE: Gunakan di staging/dev, pastikan sudah backup jika perlu.

BEGIN;

-- Truncate tabel yang bergantung (gunakan CASCADE untuk ikut membersihkan relasi)
TRUNCATE TABLE
  kelas_mahasiswa,
  jadwal,
  kehadiran,
  materi_files,
  materi,
  kuis_answer,
  kuis_question,
  kuis,
  nilai,
  peminjaman_items,
  peminjaman,
  announcements,
  kelas
RESTART IDENTITY CASCADE;

-- Jika ada tabel lain yang terkait dosen, tambahkan di bawah ini sebelum COMMIT
-- CONToh: TRUNCATE TABLE tugas, tugas_submission RESTART IDENTITY CASCADE;

COMMIT;

-- =======================================================================
-- Opsi selektif per dosen_id (BUKA KOMENTAR jika mau selective, bukan full)
-- Ganti (:dosen_ids) dengan daftar UUID dosen yang ingin dibersihkan
-- BEGIN;
-- DELETE FROM kuis_answer    WHERE kuis_id IN (SELECT id FROM kuis WHERE dosen_id IN (:dosen_ids));
-- DELETE FROM kuis_question  WHERE kuis_id IN (SELECT id FROM kuis WHERE dosen_id IN (:dosen_ids));
-- DELETE FROM kuis           WHERE dosen_id IN (:dosen_ids);
-- DELETE FROM materi_files   WHERE materi_id IN (SELECT id FROM materi WHERE dosen_id IN (:dosen_ids));
-- DELETE FROM materi         WHERE dosen_id IN (:dosen_ids);
-- DELETE FROM nilai          WHERE kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (:dosen_ids));
-- DELETE FROM kehadiran      WHERE kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (:dosen_ids));
-- DELETE FROM jadwal         WHERE kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (:dosen_ids));
-- DELETE FROM peminjaman_items WHERE peminjaman_id IN (SELECT id FROM peminjaman WHERE dosen_id IN (:dosen_ids));
-- DELETE FROM peminjaman     WHERE dosen_id IN (:dosen_ids);
-- DELETE FROM kelas_mahasiswa WHERE kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (:dosen_ids));
-- DELETE FROM kelas          WHERE dosen_id IN (:dosen_ids);
-- COMMIT;
-- =======================================================================

-- Cara pakai (dev/staging):
-- psql "<connection-string>" -f scripts/sql/RESET_DOSEN_DATA_DEV.sql

