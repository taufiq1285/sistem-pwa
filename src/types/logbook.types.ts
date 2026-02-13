/**
 * Logbook Types - Digital Logbook untuk Praktikum Kebidanan
 * Mahasiswa mengisi logbook per jadwal praktikum
 * Dosen mereview dan menilai logbook
 */

// ========================================
// LOGBOOK ENTRY TYPES
// ========================================

export interface LogbookEntry {
  id: string;
  jadwal_id: string; // Reference to jadwal_praktikum
  mahasiswa_id: string; // Student who created the logbook

  // Konten logbook
  prosedur_dilakukan?: string | null; // Prosedur yang dilakukan saat praktikum
  hasil_observasi?: string | null; // Hasil observasi/pemeriksaan
  skill_dipelajari?: string[]; // Skill yang dipelajari (array of strings)
  kendala_dihadapi?: string | null; // Kendala atau kesulitan saat praktikum
  refleksi?: string | null; // Refleksi pembelajaran mahasiswa
  catatan_tambahan?: string | null;

  // Status & Penilaian
  status: "draft" | "submitted" | "reviewed" | "graded";
  dosen_id?: string | null; // Dosen yang mereview
  dosen_feedback?: string | null; // Feedback dari dosen
  nilai?: number | null; // Nilai logbook (0-100)

  // Metadata
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;

  // Relations (joined data from jadwal)
  jadwal?: {
    id: string;
    topik?: string | null;
    tanggal_praktikum?: string | null;
    laboratorium?: {
      nama_lab: string;
    } | null;
  };
  mahasiswa?: {
    id: string;
    user?: {
      full_name: string;
    };
  };
  dosen?: {
    id: string;
    user?: {
      full_name: string;
    };
  };
}

// ========================================
// CREATE/UPDATE TYPES
// ========================================

export interface CreateLogbookData {
  jadwal_id: string;
  prosedur_dilakukan?: string;
  hasil_observasi?: string;
  skill_dipelajari?: string[];
  kendala_dihadapi?: string;
  refleksi?: string;
  foto_dokumentasi?: string[];
  catatan_tambahan?: string;
}

export interface UpdateLogbookData extends Partial<CreateLogbookData> {
  id: string;
  status?: "draft" | "submitted";
}

export interface SubmitLogbookData {
  id: string;
  // All required fields must be filled before submit
  prosedur_dilakukan: string;
  hasil_observasi: string;
  skill_dipelajari: string[];
}

export interface DosenReviewData {
  id: string;
  feedback: string;
  nilai?: number; // Optional, bisa dinilai nanti
}

export interface GradeLogbookData {
  id: string;
  nilai: number; // 0-100
}

// ========================================
// FILTER TYPES
// ========================================

export interface LogbookFilters {
  jadwal_id?: string;
  mahasiswa_id?: string;
  kelas_id?: string; // Filter by kelas mahasiswa
  dosen_id?: string; // Filter by dosen reviewer
  status?: "draft" | "submitted" | "reviewed" | "graded";
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}

// ========================================
// LOGBOOK STATISTICS
// ========================================

export interface LogbookStats {
  total_logbooks: number;
  draft: number;
  submitted: number;
  reviewed: number;
  graded: number;
  average_grade?: number;
  completion_rate?: number; // Percentage of students with submitted logbooks
}

// ========================================
// CONSTANTS
// ========================================

export const LOGBOOK_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  GRADED: "graded",
} as const;

export const LOGBOOK_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Diserahkan",
  reviewed: "Direview",
  graded: "Dinilai",
};

export const LOGBOOK_STATUS_COLORS: Record<string, string> = {
  draft: "gray",
  submitted: "blue",
  reviewed: "yellow",
  graded: "green",
} as const;

export const SKILL_KEBIDANAN = [
  "Askep Persalinan Normal",
  "Askep Persalinan Patologi",
  "Askep Nifas",
  "Askep Bayi Baru Lahir",
  "Askep KB dan Konseling",
  "Pemeriksaan Kehamilan (ANC)",
  "Pemeriksaan Ginekologi",
  "Askep Gawat Darurat",
  "Askep Komunitas",
  "Manajemen Kasus",
  "Komunikasi Terapeutik",
  "Edukasi Kesehatan",
] as const;
