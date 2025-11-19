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
  nilai_akhir?: number | null;
  nilai_huruf?: string | null;
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
    id: string;
    nama_kelas: string;
    kode_kelas?: string;
    tahun_ajaran?: string;
    semester_ajaran?: number;
    mata_kuliah?: {
      nama_mk: string;
      kode_mk?: string;
      sks?: number;
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

export interface CreateNilaiData {
  mahasiswa_id: string;
  kelas_id: string;
  nilai_kuis?: number;
  nilai_tugas?: number;
  nilai_uts?: number;
  nilai_uas?: number;
  nilai_praktikum?: number;
  nilai_kehadiran?: number;
  keterangan?: string;
}

export interface NilaiWithMahasiswa extends Nilai {
  mahasiswa: {
    id: string;
    nim: string;
    user_id: string;
    user: {
      full_name: string;
      email: string;
    };
  };
}

export interface NilaiSummary {
  total_mahasiswa: number;
  sudah_dinilai: number;
  belum_dinilai: number;
  rata_rata: number;
}
