/**
 * Inventaris & Peminjaman Types
 */

import type { Database } from './database.types';

type InventarisTable = Database['public']['Tables'] extends { inventaris: { Row: infer R } } 
  ? R 
  : {
      id: string;
      // Fallback shape if 'inventaris' table is not present in generated Database types
      [key: string]: unknown;
    };
type PeminjamanTable = Database['public']['Tables'] extends { peminjaman: { Row: infer R } }
  ? R
  : {
      id: string;
      // Fallback shape if 'peminjaman' table is not present in generated Database types
      [key: string]: unknown;
    };

export type EquipmentCondition = 'baik' | 'rusak_ringan' | 'rusak_berat' | 'maintenance';
export type BorrowingStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';

export interface Inventaris extends InventarisTable {
  laboratorium?: {
    nama_lab: string;
    kode_lab: string;
  };
}

export interface Peminjaman extends PeminjamanTable {
  inventaris?: Inventaris;
  peminjam?: {
    nim: string;
    user?: {
      full_name: string;
    };
  };
  dosen?: {
    nip: string;
    user?: {
      full_name: string;
    };
  };
}

export interface CreatePeminjamanData {
  inventaris_id: string;
  peminjam_id: string;
  dosen_id?: string;
  jumlah_pinjam: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
}