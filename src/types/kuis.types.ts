/**
 * Tugas Praktikum Type Definitions
 * (Previously named "Kuis" - database table name remains "kuis")
 *
 * PURPOSE: Fitur opsional untuk pre-test, post-test, laporan, atau
 * tugas praktikum lainnya. Dosen dapat membuat tugas sesuai kebutuhan.
 *
 * CRITICAL: Updated to match EXACT Supabase database schema
 * Database fields vs Old fields mapping:
 * - durasi_menit (NOT durasi)
 * - passing_score (NOT passing_grade)
 * - randomize_questions (NOT shuffle_soal)
 * - randomize_options (NOT shuffle_jawaban)
 * - show_results_immediately (NOT show_hasil)
 * - status (NEW: draft/published/archived)
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

// TIPE_KUIS removed from database, but kept for backward compatibility
export const TIPE_KUIS = {
  PILIHAN_GANDA: "pilihan_ganda",
  ESSAY: "essay",
  CAMPURAN: "campuran",
} as const;

export type TipeKuis = (typeof TIPE_KUIS)[keyof typeof TIPE_KUIS];

export const TIPE_KUIS_LABELS = {
  pilihan_ganda: "Pilihan Ganda",
  essay: "Essay",
  campuran: "Campuran",
} as const;

export const TIPE_SOAL = {
  PILIHAN_GANDA: "pilihan_ganda",
  ESSAY: "essay",
  FILE_UPLOAD: "file_upload",
  BENAR_SALAH: "benar_salah",
  JAWABAN_SINGKAT: "jawaban_singkat",
  MENJODORKAN: "menjodohkan",
  ISIAN_SINGKAT: "isian_singkat",
} as const;

export type TipeSoal = (typeof TIPE_SOAL)[keyof typeof TIPE_SOAL];

export const TIPE_SOAL_LABELS = {
  pilihan_ganda: "Pilihan Ganda",
  essay: "Essay",
  file_upload: "Upload File (Laporan)",
  benar_salah: "Benar/Salah",
  jawaban_singkat: "Jawaban Singkat",
  menjodohkan: "Menjodohkan",
  isian_singkat: "Isian Singkat",
} as const;

export const QUIZ_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type QuizStatus = (typeof QUIZ_STATUS)[keyof typeof QUIZ_STATUS];

export const QUIZ_STATUS_LABELS = {
  draft: "Draft",
  published: "Aktif",
  archived: "Diarsipkan",
} as const;

export const ATTEMPT_STATUS = {
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  GRADED: "graded",
} as const;

export const ATTEMPT_STATUS_LABELS = {
  in_progress: "Sedang Dikerjakan",
  submitted: "Sudah Dikumpulkan",
  graded: "Sudah Dinilai",
} as const;

// ============================================================================
// UI LABELS - For display purposes (Tugas Praktikum context)
// ============================================================================

export const UI_LABELS = {
  // Main feature name
  FEATURE_NAME: "Tugas Praktikum",
  FEATURE_NAME_SINGULAR: "Tugas Praktikum",
  FEATURE_NAME_PLURAL: "Tugas Praktikum",

  // Actions
  CREATE_NEW: "Buat Tugas Baru",
  EDIT: "Edit Tugas",
  DELETE: "Hapus Tugas",
  DUPLICATE: "Duplikat Tugas",
  PUBLISH: "Publikasikan Tugas",
  UNPUBLISH: "Batalkan Publikasi",

  // Views
  LIST: "Daftar Tugas Praktikum",
  DETAILS: "Detail Tugas",
  RESULTS: "Hasil Tugas",
  BUILDER: "Pembuat Tugas",

  // Student actions
  START: "Mulai Mengerjakan",
  CONTINUE: "Lanjutkan Mengerjakan",
  SUBMIT: "Kumpulkan Tugas",
  VIEW_RESULT: "Lihat Hasil",

  // Descriptions
  OPTIONAL_FEATURE:
    "Fitur opsional untuk pre-test, post-test, laporan, atau tugas praktikum lainnya",
  CREATE_DESCRIPTION:
    "Anda dapat membuat tugas untuk praktikum tertentu sesuai kebutuhan",
} as const;

// ============================================================================
// MAIN KUIS INTERFACE - MATCHES DATABASE EXACTLY
// ============================================================================

export interface Kuis {
  // Primary fields
  id: string;
  kelas_id: string;
  dosen_id: string;
  mata_kuliah_id?: string | null; // NEW: For multi-dosen grading access
  judul: string;
  deskripsi?: string | null;

  // Timing & Duration - EXACT DATABASE FIELD NAMES
  durasi_menit?: number | null; // ✅ NOT "durasi" - NULLABLE for laporan (no time limit)
  tanggal_mulai?: string | null; // timestamp with time zone - auto-set if not provided
  tanggal_selesai?: string | null; // timestamp with time zone - auto-set if not provided

  // Quiz Settings - EXACT DATABASE FIELD NAMES
  passing_score?: number | null; // ✅ NOT "passing_grade" (default: 70)
  max_attempts?: number | null; // ✅ (default: 1)
  randomize_questions?: boolean | null; // ✅ NOT "shuffle_soal" (default: false)
  randomize_options?: boolean | null; // ✅ NOT "shuffle_jawaban" (default: false)
  show_results_immediately?: boolean | null; // ✅ NOT "show_hasil" (default: true)
  allow_review?: boolean | null; // (default: true)

  // Status - EXACT DATABASE FIELD NAMES
  status?: QuizStatus | null; // ✅ enum: draft/published/archived (default: draft)

  // Offline & Versioning
  is_offline_capable?: boolean | null; // (default: false)
  auto_save_interval?: number | null; // seconds (default: 30)
  version?: number | null; // (default: 1)

  // Timestamps
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;

  // Relations (populated when using joins)
  kelas?: {
    nama_kelas: string;
    mata_kuliah?: {
      nama_mk: string;
      kode_mk: string;
    };
  };
  mata_kuliah?: {
    id: string;
    kode_mk: string;
    nama_mk: string;
  };
  dosen?: {
    user?: {
      full_name: string;
    };
    full_name?: string;
    gelar_depan?: string;
    gelar_belakang?: string;
  };
  soal?: Soal[];
  attempts?: AttemptKuis[];
  _count?: {
    soal: number;
    attempts: number;
  };
}

// ============================================================================
// SOAL (QUESTION) INTERFACE
// ============================================================================

export interface Soal {
  id: string;
  kuis_id: string;
  pertanyaan: string;
  tipe_soal: TipeSoal;
  poin: number;
  urutan: number;
  opsi_jawaban?: OpsiJawaban[] | null; // JSON field
  jawaban_benar?: string | null;
  penjelasan?: string | null;
  created_at?: string;
  updated_at?: string;

  // Relations
  kuis?: {
    judul: string;
  };
}

// ============================================================================
// ATTEMPT KUIS INTERFACE
// ============================================================================

export interface AttemptKuis {
  id: string;
  kuis_id: string;
  mahasiswa_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at?: string | null;
  sisa_waktu?: number | null;
  total_poin?: number | null;
  status: "in_progress" | "submitted" | "graded";
  is_synced?: boolean;
  created_at?: string;
  updated_at?: string;

  // Relations
  kuis?: Kuis;
  mahasiswa?: {
    nim: string;
    user?: {
      full_name: string;
    };
  };
  jawaban?: Jawaban[];
  _count?: {
    jawaban: number;
  };
}

// ============================================================================
// JAWABAN (ANSWER) INTERFACE
// ============================================================================

export interface Jawaban {
  id: string;
  attempt_id: string;
  soal_id: string;
  jawaban_mahasiswa: string; // Database column name
  jawaban?: string; // Alias for backward compatibility
  poin_diperoleh?: number | null;
  is_correct?: boolean | null;
  feedback?: string | null;
  is_synced?: boolean; // Client-side only
  created_at?: string;
  updated_at?: string;
  // File upload fields (for file_upload type questions)
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  // Relations
  soal?: Soal;
  attempt?: {
    mahasiswa_id: string;
  };
}

// ============================================================================
// DASHBOARD SPECIFIC TYPES
// ============================================================================

export interface UpcomingQuiz {
  id: string;
  kelas_id: string;
  judul: string;
  nama_mk: string;
  kode_mk: string;
  nama_kelas: string;
  dosen_name: string;

  // Quiz details - UPDATED FIELD NAMES
  durasi_menit?: number | null; // ✅ NULLABLE for laporan (no time limit)
  tanggal_mulai: string;
  tanggal_selesai: string;
  passing_score?: number | null; // ✅ NOT passing_grade
  total_soal: number;

  // Student progress
  attempts_used: number;
  max_attempts: number;
  can_attempt: boolean;
  status: "upcoming" | "ongoing" | "completed" | "missed";
  best_score?: number;
  last_attempt_at?: string | null;
}

export interface QuizStats {
  total_quiz: number;
  completed_quiz: number;
  average_score: number;
  upcoming_quiz: number;
}

export interface RecentQuizResult {
  id: string;
  attempt_id: string;
  judul: string;
  nama_mk: string;
  submitted_at: string;
  total_poin?: number | null;
  max_poin: number;
  percentage: number;
  status: "graded" | "pending";
  passed: boolean;
}

// ============================================================================
// QUIZ ATTEMPT SESSION (OFFLINE-CAPABLE)
// ============================================================================

export interface QuizAttemptSession {
  attempt_id: string;
  kuis_id: string;
  mahasiswa_id: string;
  attempt_number: number;
  started_at: string;
  durasi_menit: number; // ✅ UPDATED
  sisa_waktu: number;

  // Questions & Answers
  soal: SoalWithAnswer[];

  // Sync status
  is_synced: boolean;
  last_saved_at: string;
  sync_errors?: string[];

  // Metadata
  device_id?: string;
  offline_created?: boolean;
}

export interface SoalWithAnswer extends Soal {
  student_answer?: string;
  is_answered: boolean;
  is_flagged?: boolean;
  answered_at?: string;
}

export interface QuizAutoSaveData {
  attempt_id: string;
  soal_id: string;
  jawaban: string;
  saved_at: string;
  is_synced: boolean;
}

// ============================================================================
// FORM DATA TYPES - UPDATED TO MATCH DATABASE
// ============================================================================

export interface CreateKuisData {
  kelas_id: string;
  dosen_id: string;
  mata_kuliah_id?: string | null; // NEW: Auto-populated from kelas, enables multi-dosen grading
  judul: string;
  deskripsi?: string;

  // UPDATED FIELD NAMES TO MATCH DATABASE
  durasi_menit?: number | null; // ✅ NOT durasi - NULLABLE for laporan (default: 10080 menit)
  tanggal_mulai?: string | null; // ✅ Optional - auto-set by API if not provided
  tanggal_selesai?: string | null; // ✅ Optional - auto-set by API if not provided
  passing_score?: number | null; // ✅ NOT passing_grade - NULLABLE to match DB
  max_attempts?: number | null; // ✅ NULLABLE to match form and DB
  randomize_questions?: boolean | null; // ✅ NOT shuffle_soal - NULLABLE
  randomize_options?: boolean | null; // ✅ NOT shuffle_jawaban - NULLABLE
  show_results_immediately?: boolean | null; // ✅ NOT show_hasil - NULLABLE
  status?: QuizStatus | null; // ✅ NEW FIELD - NULLABLE
}

export interface UpdateKuisData extends Partial<CreateKuisData> {
  id: string;
}

export interface CreateSoalData {
  kuis_id: string;
  pertanyaan: string;
  tipe_soal: TipeSoal;
  poin: number;
  urutan: number;
  opsi_jawaban?: OpsiJawaban[];
  jawaban_benar?: string;
  penjelasan?: string;
}

export interface UpdateSoalData extends Partial<CreateSoalData> {
  id: string;
}

export interface OpsiJawaban {
  id: string;
  label: string; // A, B, C, D
  text: string;
  is_correct?: boolean;
}

export interface StartAttemptData {
  kuis_id: string;
  mahasiswa_id: string;
}

export interface SubmitAnswerData {
  attempt_id: string;
  soal_id: string;
  jawaban: string;
}

export interface SubmitQuizData {
  attempt_id: string;
  sisa_waktu: number;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface KuisFilters {
  kelas_id?: string;
  dosen_id?: string;
  status?: QuizStatus; // ✅ UPDATED
  status_waktu?: "upcoming" | "ongoing" | "past";
  search?: string;
}

export interface AttemptFilters {
  kuis_id?: string;
  mahasiswa_id?: string;
  status?: "in_progress" | "submitted" | "graded";
  is_synced?: boolean;
}

// ============================================================================
// AUTO-SAVE & WARNING CONSTANTS
// ============================================================================

export const QUIZ_AUTOSAVE_INTERVAL = 30000; // 30 seconds
export const QUIZ_WARNING_TIME = 300; // 5 minutes before quiz ends
