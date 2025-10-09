/**
 * Nilai (Grades) Types
 */

// Local fallback NilaiTable definition because 'nilai' table is missing in generated Database types.
interface NilaiTable {
  id: string;
  mahasiswa_id: string;
  kelas_id: string;
  nilai_kuis: number;
  nilai_tugas: number;
  nilai_uts: number;
  nilai_uas: number;
  nilai_praktikum: number;
  nilai_kehadiran: number;
  keterangan?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Nilai extends NilaiTable {
  mahasiswa?: {
    nim: string;
    user?: {
      full_name: string;
    };
  };
  kelas?: {
    nama_kelas: string;
    mata_kuliah?: {
      nama_mk: string;
    };
  };
}

export interface NilaiComponents {
  nilai_kuis: number;
  nilai_tugas: number;
  nilai_uts: number;
  nilai_uas: number;
  nilai_praktikum: number;
  nilai_kehadiran: number;
}

export interface UpdateNilaiData extends Partial<NilaiComponents> {
  mahasiswa_id: string;
  kelas_id: string;
  keterangan?: string;
}
