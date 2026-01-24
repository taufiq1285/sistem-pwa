/**
 * Materi (Learning Materials) Types
 */

import type { Database } from "./database.types";

type MateriTable = Database["public"]["Tables"] extends {
  materi: { Row: infer R };
}
  ? R
  : {
      // Fallback shape (update to match actual 'materi' table once added to Database types)
      id: string;
      kelas_id: string;
      dosen_id: string;
      judul: string;
      deskripsi?: string | null;
      tipe_file: string;
      file_url: string;
      file_size: number;
      minggu_ke?: number | null;
      is_downloadable?: boolean | null;
      created_at?: string;
      updated_at?: string;
    };

export interface Materi extends MateriTable {
  // Relations
  dosen?: {
    id: string;
    users: {
      full_name: string;
    };
    gelar_depan?: string;
    gelar_belakang?: string;
  };
  kelas?: {
    id: string;
    nama_kelas: string;
    mata_kuliah?: {
      nama_mk: string;
      kode_mk?: string;
    };
  };
}

export interface CreateMateriData {
  kelas_id: string;
  dosen_id: string;
  judul: string;
  deskripsi?: string;
  tipe_file: string;
  file_url: string;
  file_size: number;
  minggu_ke?: number;
  is_downloadable?: boolean;
  download_count?: number;
  is_active?: boolean;
  published_at?: string;
}

export interface UpdateMateriData extends Partial<CreateMateriData> {
  id: string;
}
