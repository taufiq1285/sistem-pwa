/**
 * Dosen Types
 * Types for dosen dashboard and management
 */

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export interface DosenStats {
  totalKelas: number;
  totalMahasiswa: number;
  activeKuis: number;
  pendingGrading: number;
}

// ============================================================================
// COURSE & CLASS DATA
// ============================================================================

// MataKuliahWithStats is defined in mata-kuliah.types.ts - import from there if needed

export interface KelasWithDetails {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  kuota: number;
  jumlah_mahasiswa: number;
  mata_kuliah: {
    id: string;
    kode_mk: string;
    nama_mk: string;
    sks: number;
  };
}

// ============================================================================
// SCHEDULE DATA
// ============================================================================

export interface UpcomingPracticum {
  id: string;
  tanggal_praktikum: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  topik: string;
  kelas: {
    nama_kelas: string;
    mata_kuliah_nama: string;
  };
  laboratorium: {
    nama_lab: string;
    kode_lab: string;
  };
}

// ============================================================================
// GRADING DATA
// ============================================================================

export interface PendingGrading {
  id: string;
  mahasiswa_nama: string;
  mata_kuliah_nama: string;
  kuis_judul: string;
  submitted_at: string;
  total_score: number | null;
  percentage: number | null;
  attempt_number: number;
}

// ============================================================================
// QUIZ DATA
// ============================================================================

export interface KuisWithStats {
  id: string;
  judul: string;
  status: 'draft' | 'published' | 'closed';
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_attempts: number;
  submitted_count: number;
  graded_count: number;
  avg_score: number | null;
  kelas_nama: string;
}

// ============================================================================
// PROFILE DATA
// ============================================================================

export interface DosenProfile {
  id: string;
  user_id: string;
  nip: string;
  nidn: string | null;
  gelar_depan: string | null;
  gelar_belakang: string | null;
  fakultas: string | null;
  program_studi: string | null;
  phone: string | null;
  office_room: string | null;
  full_name: string;
  email: string;
}