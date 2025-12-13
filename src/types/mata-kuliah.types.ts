/**
 * Mata Kuliah Types
 * Types for mata kuliah (course) management
 */

// ============================================================================
// MAIN ENTITY
// ============================================================================

/**
 * Mata Kuliah (Course) entity
 */
export interface MataKuliah {
  id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
  program_studi: string;
  deskripsi?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Mata Kuliah with statistics
 */
export interface MataKuliahWithStats extends MataKuliah {
  total_kelas: number;
  total_mahasiswa: number;
  total_dosen: number;
}

/**
 * Mata Kuliah with relations
 */
export interface MataKuliahWithRelations extends MataKuliah {
  kelas?: Array<{
    id: string;
    kode_kelas: string;
    nama_kelas: string;
    jumlah_mahasiswa: number;
  }>;
  dosen?: Array<{
    id: string;
    nip: string;
    nama: string;
  }>;
}

// ============================================================================
// FORM DATA
// ============================================================================

/**
 * Form data untuk create mata kuliah
 */
export interface CreateMataKuliahData {
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
  program_studi: string;
  deskripsi?: string;
}

/**
 * Form data untuk update mata kuliah
 */
export interface UpdateMataKuliahData {
  kode_mk?: string;
  nama_mk?: string;
  sks?: number;
  semester?: number;
  program_studi?: string;
  deskripsi?: string;
}

// ============================================================================
// QUERY & FILTER
// ============================================================================

/**
 * Mata kuliah filter options
 */
export interface MataKuliahFilters {
  search?: string;
  program_studi?: string;
  semester?: number;
  sks?: number;
  sortBy?: "kode_mk" | "nama_mk" | "semester" | "sks" | "created_at";
  sortOrder?: "asc" | "desc";
}

/**
 * Mata kuliah query params
 */
export interface MataKuliahQueryParams extends MataKuliahFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Mata kuliah statistics
 */
export interface MataKuliahStats {
  total: number;
  by_program_studi: Record<string, number>;
  by_semester: Record<string, number>;
  by_sks: Record<string, number>;
  avg_mahasiswa_per_mk: number;
}

// ============================================================================
// ASSIGNMENT (Penugasan Mahasiswa)
// ============================================================================

/**
 * Mahasiswa assignment to mata kuliah
 */
export interface MataKuliahMahasiswa {
  id: string;
  mata_kuliah_id: string;
  mahasiswa_id: string;
  kelas_id: string;
  enrolled_at: string;
  mahasiswa?: {
    id: string;
    nim: string;
    nama: string;
    semester: number;
  };
}

/**
 * Assign mahasiswa payload
 */
export interface AssignMahasiswaPayload {
  mata_kuliah_id: string;
  mahasiswa_ids: string[];
  kelas_id?: string;
}

// ============================================================================
// ENROLLED COURSES (For Mahasiswa Dashboard)
// ============================================================================

/**
 * Enrolled Course for Mahasiswa
 * Represents a course that a student is enrolled in
 */
export interface EnrolledCourse {
  id: string;
  kelas_id: string;
  enrollment_id: string;
  kode_mk: string;
  nama_mk: string;
  nama_kelas: string;
  sks: number;
  semester: number;
  dosen_name: string;
  dosen_gelar: string;
  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  ruangan: string;
  status: "active" | "completed" | "dropped";
  enrolled_at: string;
}

/**
 * Course Statistics for Dashboard
 */
export interface CourseStats {
  total_enrolled: number;
  active_courses: number;
  completed_courses: number;
  average_grade: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Program studi options
 */
export const PROGRAM_STUDI_OPTIONS = [
  "D3 Kebidanan",
  "D4 Kebidanan",
  "S1 Kebidanan",
  "Profesi Bidan",
] as const;

export type ProgramStudi = (typeof PROGRAM_STUDI_OPTIONS)[number];

/**
 * Semester options (1-14)
 */
export const SEMESTER_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1);

/**
 * SKS options (1-6)
 */
export const SKS_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export type SKS = (typeof SKS_OPTIONS)[number];

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if kode_mk is valid format
 * Format: MK001, BID201, etc (2-5 letters + 3 digits)
 */
export function isValidKodeMK(kode: string): boolean {
  return /^[A-Z]{2,5}\d{3}$/.test(kode);
}

/**
 * Check if semester is valid (1-14)
 */
export function isValidSemester(semester: number): boolean {
  return semester >= 1 && semester <= 14;
}

/**
 * Check if SKS is valid (1-6)
 */
export function isValidSKS(sks: number): boolean {
  return sks >= 1 && sks <= 6;
}
