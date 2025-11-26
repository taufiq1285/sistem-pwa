/**
 * Mock Data
 */

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'mahasiswa',
  created_at: new Date().toISOString(),
};

export const mockKuis = {
  id: 'kuis-1',
  kelas_id: 'kelas-1',
  dosen_id: 'dosen-1',
  judul: 'Test Quiz',
  deskripsi: 'Test quiz description',
  durasi_menit: 60,
  tanggal_mulai: new Date().toISOString(),
  tanggal_selesai: new Date(Date.now() + 86400000).toISOString(),
  max_attempts: 3,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockSoal = {
  id: 'soal-1',
  kuis_id: 'kuis-1',
  nomor_soal: 1,
  teks_soal: 'What is 2 + 2?',
  tipe_soal: 'pilihan_ganda',
  opsi_jawaban: ['2', '3', '4', '5'],
  jawaban_benar: '4',
  poin: 10,
  created_at: new Date().toISOString(),
};

export const mockAttempt = {
  id: 'attempt-1',
  kuis_id: 'kuis-1',
  mahasiswa_id: 'user-1',
  started_at: new Date().toISOString(),
  finished_at: null,
  score: null,
  status: 'in_progress',
};

export const mockJawaban = {
  id: 'jawaban-1',
  attempt_id: 'attempt-1',
  soal_id: 'soal-1',
  jawaban: '4',
  is_correct: true,
  created_at: new Date().toISOString(),
};
