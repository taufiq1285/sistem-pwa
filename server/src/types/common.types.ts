/**
 * Common Types
 * Shared types across the application
 */

import type { Database } from "./database.types";

// Pengumuman (Announcements)
// Use conditional extraction; if 'pengumuman' table is missing, provide a fallback shape to avoid type errors
type PengumumanTable = Database["public"]["Tables"] extends {
  pengumuman: { Row: infer R };
}
  ? R
  : {
      id: string;
      judul: string;
      konten: string;
      tipe?: string | null;
      prioritas?: string | null;
      target_role?: string[] | null;
      target_kelas_id?: string | null;
      tanggal_mulai?: string | null;
      tanggal_selesai?: string | null;
      attachment_url?: string | null;
      created_at?: string | null;
      updated_at?: string | null;
    };

export type PengumumanTipe = "info" | "penting" | "urgent" | "maintenance";
export type PengumumanPrioritas = "low" | "normal" | "high";

export interface Pengumuman extends PengumumanTable {
  penulis?: {
    full_name: string;
    role: string;
  };
  target_kelas?: {
    nama_kelas: string;
  };
}

export interface CreatePengumumanData {
  judul: string;
  konten: string;
  tipe?: PengumumanTipe;
  prioritas?: PengumumanPrioritas;
  target_role?: string[];
  target_kelas_id?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  attachment_url?: string;
  penulis_id?: string;
}

// Common utility types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ApiResponse is defined in api.types.ts - import from there if needed

export interface SelectOption {
  label: string;
  value: string;
}
