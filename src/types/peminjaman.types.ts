/**
 * Peminjaman (Borrowing) Types
 *
 * Re-exports from inventaris.types.ts with additional utility types
 * for equipment borrowing management
 */

// Import types for use in this file
import type { EquipmentCondition, BorrowingStatus } from './inventaris.types';

// Re-export types from inventaris.types for convenience
export type { Inventaris, Peminjaman, CreatePeminjamanData, EquipmentCondition, BorrowingStatus } from './inventaris.types';

// ============================================================================
// ADDITIONAL PEMINJAMAN TYPES
// ============================================================================

/**
 * Peminjaman filter options
 */
export interface PeminjamanFilterOptions {
  status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
  peminjam_id?: string;
  dosen_id?: string;
  inventaris_id?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}

/**
 * Peminjaman approval data
 */
export interface ApprovePeminjamanData {
  peminjaman_id: string;
  catatan?: string;
}

/**
 * Peminjaman rejection data
 */
export interface RejectPeminjamanData {
  peminjaman_id: string;
  alasan: string;
}

/**
 * Peminjaman return data
 */
export interface ReturnPeminjamanData {
  peminjaman_id: string;
  tanggal_kembali_aktual: string;
  kondisi_kembali: 'baik' | 'rusak_ringan' | 'rusak_berat';
  catatan?: string;
}

/**
 * Peminjaman statistics
 */
export interface PeminjamanStats {
  total_peminjaman: number;
  pending: number;
  approved: number;
  returned: number;
  overdue: number;
  rejected: number;
}

/**
 * Peminjaman with full details (for detail view)
 */
export interface PeminjamanDetail {
  id: string;
  inventaris_id: string;
  peminjam_id: string;
  dosen_id: string | null;
  jumlah_pinjam: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  tanggal_kembali_aktual: string | null;
  status: BorrowingStatus;
  catatan_persetujuan: string | null;
  keterangan_kembali: string | null;
  kondisi_kembali: EquipmentCondition | null;
  created_at: string;
  updated_at: string;

  // Related data
  inventaris: {
    id: string;
    nama_alat: string;
    kode_alat: string;
    kondisi: EquipmentCondition;
    stok_tersedia: number;
    laboratorium?: {
      nama_lab: string;
      kode_lab: string;
    };
  };

  peminjam: {
    id: string;
    nim: string;
    user: {
      full_name: string;
      email: string;
    };
  };

  dosen?: {
    id: string;
    nip: string;
    user: {
      full_name: string;
      email: string;
    };
  } | null;
}