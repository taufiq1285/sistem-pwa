/**
 * Assignment Types
 *
 * Purpose: Type definitions for tracking dosen assignments
 * Features:
 * - Admin monitoring: siapa mengajar apa (from jadwal praktikum)
 * - Assignment tracking via jadwal_praktikum -> kelas -> dosen + mata_kuliah
 *
 * NOTE: Assignment terjadi saat dosen buat jadwal praktikum
 */

/**
 * Dosen Assignment Tracking
 * Data assignment dosen yang didapat dari jadwal praktikum
 */
export interface DosenAssignmentTracking {
  // Jadwal info
  jadwal_id: string;
  jadwal_hari: string;
  jadwal_jam_mulai: string;
  jadwal_jam_selesai: string;
  jadwal_tanggal?: string | null;
  jadwal_minggu_ke?: number | null;
  jadwal_topik?: string | null;
  jadwal_status: string;
  jadwal_is_active: boolean;

  // Laboratorium info
  laboratorium_id: string;
  laboratorium_nama: string;
  laboratorium_kode?: string | null;

  // Kelas info
  kelas_id: string;
  kelas_nama: string;
  kelas_kode?: string | null;
  tahun_ajaran: string;
  semester_ajaran: number;

  // Dosen info
  dosen_id: string;
  dosen_name: string;
  dosen_email: string;
  dosen_nip?: string | null;

  // Mata kuliah info
  mata_kuliah_id: string;
  mata_kuliah_nama: string;
  mata_kuliah_kode: string;
  mata_kuliah_sks?: number;

  // Stats
  mahasiswa_count: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

/**
 * Assignment Summary (grouped by dosen)
 * Untuk summary view di admin
 */
export interface DosenAssignmentSummary {
  dosen_id: string;
  dosen_name: string;
  dosen_email: string;
  dosen_nip?: string | null;

  // Total assignments
  total_jadwal: number;
  total_kelas: number; // unique kelas count
  total_mata_kuliah: number; // unique mata kuliah count
  total_mahasiswa: number; // sum of all students

  // Details (list of assignments)
  assignments: DosenAssignmentTracking[];
}

/**
 * Assignment Statistics
 * Untuk dashboard admin
 */
export interface AssignmentStats {
  // Dosen stats
  total_dosen_aktif: number;
  dosen_dengan_jadwal: number;
  dosen_tanpa_jadwal: number;

  // Kelas stats
  total_kelas: number;
  kelas_dengan_jadwal: number;
  kelas_tanpa_jadwal: number;

  // Jadwal stats
  total_jadwal_aktif: number;
  total_mata_kuliah_diajarkan: number;
}

/**
 * Assignment Filters
 * Untuk filter di admin tracking page
 */
export interface AssignmentFilters {
  dosen_id?: string;
  mata_kuliah_id?: string;
  kelas_id?: string;
  laboratorium_id?: string;
  tahun_ajaran?: string;
  semester_ajaran?: number;
  hari?: string;
  status?: "active" | "inactive" | "all";
  search?: string; // search by dosen name, mata kuliah, atau kelas
}

/**
 * Dosen Info (for dropdowns/selectors)
 */
export interface DosenInfo {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  nip?: string | null;
  is_active?: boolean;
}

/**
 * Mata Kuliah Info (for dropdowns/selectors)
 */
export interface MataKuliahInfo {
  id: string;
  nama_mk: string;
  kode_mk: string;
  sks?: number;
  is_active?: boolean;
}

/**
 * Kelas Info (for dropdowns/selectors)
 */
export interface KelasInfo {
  id: string;
  nama_kelas: string;
  kode_kelas?: string | null;
  tahun_ajaran: string;
  semester_ajaran: number;
  is_active?: boolean;
}
