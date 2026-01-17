/**
 * Permintaan Perbaikan Nilai Types
 *
 * Types for grade revision request system
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Grade component types that can be revised
 */
export type KomponenNilai =
  | "kuis"
  | "tugas"
  | "uts"
  | "uas"
  | "praktikum"
  | "kehadiran";

/**
 * Request status
 */
export type StatusPermintaan =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

// ============================================================================
// MAIN TYPES
// ============================================================================

/**
 * Permintaan Perbaikan Nilai record from database
 */
export interface PermintaanPerbaikanNilai {
  id: string;
  mahasiswa_id: string;
  nilai_id: string;
  kelas_id: string;

  // What to fix
  komponen_nilai: KomponenNilai;
  nilai_lama: number;
  nilai_usulan: number | null;

  // Reason & Evidence
  alasan_permintaan: string;
  bukti_pendukung: string[] | null;

  // Status & Response
  status: StatusPermintaan;
  response_dosen: string | null;
  nilai_baru: number | null;

  // Reviewer
  reviewed_by: string | null;
  reviewed_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Permintaan with populated relations
 */
export interface PermintaanPerbaikanWithRelations extends PermintaanPerbaikanNilai {
  mahasiswa?: {
    id: string;
    nim: string;
    user: {
      full_name: string;
      email: string;
    };
  };
  kelas?: {
    id: string;
    nama_kelas: string;
    kode_kelas: string;
    mata_kuliah: {
      nama_mk: string;
      kode_mk: string;
    };
    dosen: {
      id: string;
      nip: string;
      user: {
        full_name: string;
        email: string;
      };
    };
  };
  reviewer?: {
    id: string;
    nip: string;
    user: {
      full_name: string;
    };
  } | null;
}

// ============================================================================
// CREATE / UPDATE TYPES
// ============================================================================

/**
 * Data required to create a new permintaan perbaikan
 */
export interface CreatePermintaanPerbaikanData {
  mahasiswa_id: string;
  nilai_id: string;
  kelas_id: string;
  komponen_nilai: KomponenNilai;
  nilai_lama: number;
  nilai_usulan?: number;
  alasan_permintaan: string;
  bukti_pendukung?: string[];
}

/**
 * Data for approving a permintaan
 */
export interface ApprovePermintaanData {
  permintaan_id: string;
  nilai_baru: number;
  response_dosen?: string;
  reviewed_by: string; // dosen_id
}

/**
 * Data for rejecting a permintaan
 */
export interface RejectPermintaanData {
  permintaan_id: string;
  response_dosen: string; // Required for rejection
  reviewed_by: string; // dosen_id
}

/**
 * Data for cancelling a permintaan (by student)
 */
export interface CancelPermintaanData {
  permintaan_id: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filters for querying permintaan
 */
export interface PermintaanFilters {
  mahasiswa_id?: string;
  kelas_id?: string;
  dosen_id?: string;
  status?: StatusPermintaan;
  komponen_nilai?: KomponenNilai;
  limit?: number;
  offset?: number;
}

// ============================================================================
// SUMMARY / STATS TYPES
// ============================================================================

/**
 * Summary statistics for permintaan
 */
export interface PermintaanSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

/**
 * Permintaan stats for dosen
 */
export interface PermintaanStatsForDosen {
  total_pending: number;
  total_reviewed: number;
  approval_rate: number; // Percentage
  by_komponen: Record<KomponenNilai, number>;
}

// ============================================================================
// DISPLAY / UI TYPES
// ============================================================================

/**
 * Display labels for komponen nilai
 */
export const KOMPONEN_NILAI_LABELS: Record<KomponenNilai, string> = {
  kuis: "Kuis",
  tugas: "Tugas",
  uts: "UTS",
  uas: "UAS",
  praktikum: "Praktikum",
  kehadiran: "Kehadiran",
};

/**
 * Display labels for status
 */
export const STATUS_PERMINTAAN_LABELS: Record<StatusPermintaan, string> = {
  pending: "Menunggu Review",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

/**
 * Status badge colors for UI
 */
export const STATUS_COLORS: Record<
  StatusPermintaan,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  approved: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  cancelled: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
};
