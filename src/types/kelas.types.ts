/**
 * Kelas Types
 *
 * Purpose: Type definitions for Kelas (Class) entity
 * NOTE: Updated to match actual database schema
 */

// Grade weight structure
export interface BobotNilai {
  kuis: number;
  tugas: number;
  uts: number;
  uas: number;
  praktikum: number;
  kehadiran: number;
}

export interface Kelas {
  id: string;
  nama_kelas: string;
  kode_kelas: string | null; // Changed: nullable for simple class lists
  mata_kuliah_id: string | null; // Changed: nullable to support standalone classes
  dosen_id: string | null; // Changed: nullable to support standalone classes
  ruangan: string | null;
  kuota: number | null;
  is_active: boolean | null;
  semester_ajaran: number;
  tahun_ajaran: string;
  bobot_nilai?: BobotNilai | null; // Custom grade weights
  created_at: string | null;
  updated_at: string | null;

  // Relations (optional)
  mata_kuliah?: {
    id: string;
    nama_mk: string;
    kode_mk?: string;
  };
  dosen?: {
    id: string;
    users?: {
      full_name: string;
    };
  };
}

export interface KelasFilters {
  dosen_id?: string;
  mata_kuliah_id?: string;
  semester_ajaran?: number;
  tahun_ajaran?: string;
  is_active?: boolean;
}

export interface CreateKelasData {
  nama_kelas: string;
  kode_kelas?: string | null; // Optional: for simple class lists
  mata_kuliah_id?: string | null; // Optional: nullable to support standalone classes
  dosen_id?: string | null; // Optional: nullable to support standalone classes
  ruangan?: string | null;
  kuota?: number | null;
  is_active?: boolean | null;
  semester_ajaran: number;
  tahun_ajaran: string;
  bobot_nilai?: BobotNilai | null; // Optional: custom grade weights
}

export type UpdateKelasData = Partial<CreateKelasData>;
