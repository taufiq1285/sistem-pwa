/**
 * Application Constants
 *
 * Purpose: Application-wide constant values
 * Priority: Medium
 * Dependencies: None
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  /** Default request timeout in milliseconds */
  TIMEOUT: 30000,
  /** Maximum number of retry attempts for failed requests */
  RETRY_ATTEMPTS: 3,
  /** Initial delay between retries in milliseconds */
  RETRY_DELAY: 1000,
} as const;

/**
 * Pagination Configuration
 */
export const PAGINATION = {
  /** Default number of items per page */
  DEFAULT_PAGE_SIZE: 10,
  /** Maximum number of items per page */
  MAX_PAGE_SIZE: 100,
  /** Available page size options */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/**
 * File Upload Configuration
 */
export const FILE_UPLOAD = {
  /** Maximum file size in bytes (10MB) */
  MAX_SIZE: 10 * 1024 * 1024,
  /** Allowed image MIME types */
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  /** Allowed document MIME types */
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ],
} as const;

/**
 * Quiz Configuration
 */
export const QUIZ = {
  /** Minimum number of questions in a quiz */
  MIN_QUESTIONS: 1,
  /** Maximum number of questions in a quiz */
  MAX_QUESTIONS: 100,
  /** Minimum number of options for multiple choice */
  MIN_OPTIONS: 2,
  /** Maximum number of options for multiple choice */
  MAX_OPTIONS: 6,
  /** Default time limit in minutes */
  DEFAULT_TIME_LIMIT: 60,
  /** Auto-save interval in milliseconds (30 seconds) */
  AUTO_SAVE_INTERVAL: 30000,
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  /** Authentication token */
  AUTH_TOKEN: "auth_token",
  /** User data */
  USER: "user_data",
  /** Theme preference */
  THEME: "theme",
  /** Offline data cache */
  OFFLINE_DATA: "offline_data",
  /** Sync queue */
  SYNC_QUEUE: "sync_queue",
  /** Last sync timestamp */
  LAST_SYNC: "last_sync",
} as const;

/**
 * User Roles
 */
export const ROLES = {
  /** Administrator role */
  ADMIN: "admin",
  /** Dosen (Lecturer) role */
  DOSEN: "dosen",
  /** Laboran (Lab Assistant) role */
  LABORAN: "laboran",
  /** Mahasiswa (Student) role */
  MAHASISWA: "mahasiswa",
} as const;

/**
 * Sync Configuration
 */
export const SYNC = {
  /** Maximum retry attempts for failed sync operations */
  RETRY_LIMIT: 3,
  /** Number of items to sync in a single batch */
  BATCH_SIZE: 10,
  /** Conflict resolution strategy */
  CONFLICT_RESOLUTION: {
    /** Server data takes precedence */
    SERVER_WINS: "server-wins",
    /** Client data takes precedence */
    CLIENT_WINS: "client-wins",
    /** Most recent update wins */
    LAST_WRITE_WINS: "last-write-wins",
    /** Require manual resolution */
    MANUAL: "manual",
  },
} as const;

/**
 * Network Status
 */
export const NETWORK = {
  /** Interval to check network status in milliseconds */
  CHECK_INTERVAL: 5000,
  /** Timeout for network requests in milliseconds */
  REQUEST_TIMEOUT: 10000,
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum password length */
  MAX_PASSWORD_LENGTH: 128,
  /** Minimum username length */
  MIN_USERNAME_LENGTH: 3,
  /** Maximum username length */
  MAX_USERNAME_LENGTH: 50,
  /** Email regex pattern */
  EMAIL_PATTERN: /^[^s@]+@[^s@]+.[^s@]+$/,
} as const;

/**
 * Date/Time Formats
 */
export const DATE_FORMATS = {
  /** Display format: DD/MM/YYYY */
  DISPLAY: "DD/MM/YYYY",
  /** Display with time: DD/MM/YYYY HH:mm */
  DISPLAY_WITH_TIME: "DD/MM/YYYY HH:mm",
  /** ISO format for API: YYYY-MM-DDTHH:mm:ss */
  ISO: "YYYY-MM-DDTHH:mm:ss",
  /** Time only: HH:mm */
  TIME_ONLY: "HH:mm",
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ═══════════════════════════════════════════════════════════════════
// ✅ STATUS CONSTANTS - Menggantikan magic strings
// Added: 2025-12-08 - Code Quality Improvement
// ═══════════════════════════════════════════════════════════════════

/**
 * Quiz Status
 * Menggantikan: "draft", "published", "archived"
 */
export const QUIZ_STATUS = {
  /** Kuis masih draft, belum bisa dikerjakan */
  DRAFT: "draft",
  /** Kuis sudah dipublish, bisa dikerjakan mahasiswa */
  PUBLISHED: "published",
  /** Kuis sudah diarsipkan */
  ARCHIVED: "archived",
} as const;

export type QuizStatus = (typeof QUIZ_STATUS)[keyof typeof QUIZ_STATUS];

/**
 * Quiz Attempt Status
 * Menggantikan: "in_progress", "submitted", "graded", "pending_sync"
 */
export const ATTEMPT_STATUS = {
  /** Mahasiswa sedang mengerjakan */
  IN_PROGRESS: "in_progress",
  /** Mahasiswa sudah submit */
  SUBMITTED: "submitted",
  /** Sudah dinilai oleh dosen */
  GRADED: "graded",
  /** Submit offline, menunggu sync */
  PENDING_SYNC: "pending_sync",
} as const;

export type AttemptStatus =
  (typeof ATTEMPT_STATUS)[keyof typeof ATTEMPT_STATUS];

/**
 * Question Types
 * Menggantikan: "multiple_choice", "true_false", "essay", "short_answer"
 */
export const QUESTION_TYPE = {
  /** Pilihan ganda (A, B, C, D) */
  MULTIPLE_CHOICE: "multiple_choice",
  /** Benar/Salah */
  TRUE_FALSE: "true_false",
  /** Essay (jawaban panjang) */
  ESSAY: "essay",
  /** Jawaban singkat */
  SHORT_ANSWER: "short_answer",
} as const;

export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];

/**
 * Peminjaman Status
 * Menggantikan: "pending", "approved", "rejected", "returned", "overdue"
 */
export const PEMINJAMAN_STATUS = {
  /** Menunggu approval dosen/laboran */
  PENDING: "pending",
  /** Sudah disetujui */
  APPROVED: "approved",
  /** Ditolak */
  REJECTED: "rejected",
  /** Sudah dikembalikan */
  RETURNED: "returned",
  /** Terlambat mengembalikan */
  OVERDUE: "overdue",
} as const;

export type PeminjamanStatus =
  (typeof PEMINJAMAN_STATUS)[keyof typeof PEMINJAMAN_STATUS];

/**
 * Kondisi Barang Inventaris
 * Menggantikan: "baik", "rusak_ringan", "rusak_berat", "maintenance"
 */
export const KONDISI_BARANG = {
  /** Kondisi baik */
  BAIK: "baik",
  /** Rusak ringan, masih bisa dipakai */
  RUSAK_RINGAN: "rusak_ringan",
  /** Rusak berat, tidak bisa dipakai */
  RUSAK_BERAT: "rusak_berat",
  /** Sedang maintenance */
  MAINTENANCE: "maintenance",
} as const;

export type KondisiBarang =
  (typeof KONDISI_BARANG)[keyof typeof KONDISI_BARANG];

/**
 * Attendance Status (Kehadiran)
 * Menggantikan: "hadir", "izin", "sakit", "alpha"
 */
export const ATTENDANCE_STATUS = {
  /** Hadir */
  HADIR: "hadir",
  /** Izin (dengan keterangan) */
  IZIN: "izin",
  /** Sakit (dengan surat) */
  SAKIT: "sakit",
  /** Tidak hadir tanpa keterangan */
  ALPHA: "alpha",
} as const;

export type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

/**
 * Sync Queue Status
 * Menggantikan: "pending", "syncing", "synced", "failed"
 */
export const SYNC_STATUS = {
  /** Menunggu untuk di-sync */
  PENDING: "pending",
  /** Sedang proses sync */
  SYNCING: "syncing",
  /** Berhasil di-sync */
  SYNCED: "synced",
  /** Gagal sync */
  FAILED: "failed",
} as const;

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

/**
 * Nilai Huruf (Grades)
 * Menggantikan: "A", "B", "C", "D", "E"
 */
export const NILAI_HURUF = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
} as const;

export type NilaiHuruf = (typeof NILAI_HURUF)[keyof typeof NILAI_HURUF];

/**
 * Semester (1-8)
 */
export const SEMESTER = {
  S1: 1,
  S2: 2,
  S3: 3,
  S4: 4,
  S5: 5,
  S6: 6,
  S7: 7,
  S8: 8,
} as const;

export type Semester = (typeof SEMESTER)[keyof typeof SEMESTER];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS untuk validasi status
// ═══════════════════════════════════════════════════════════════════

/**
 * Check apakah quiz bisa dikerjakan (published & dalam rentang waktu)
 */
export function isQuizAvailable(
  status: string,
  startDate: Date,
  endDate: Date,
): boolean {
  if (status !== QUIZ_STATUS.PUBLISHED) return false;

  const now = new Date();
  return now >= startDate && now <= endDate;
}

/**
 * Check apakah attempt masih bisa di-edit
 */
export function isAttemptEditable(status: string): boolean {
  return status === ATTEMPT_STATUS.IN_PROGRESS;
}

/**
 * Check apakah barang bisa dipinjam
 */
export function isBarangAvailable(kondisi: string): boolean {
  return (
    kondisi === KONDISI_BARANG.BAIK || kondisi === KONDISI_BARANG.RUSAK_RINGAN
  );
}

/**
 * Convert nilai angka ke huruf
 */
export function getNilaiHuruf(nilai: number): NilaiHuruf {
  if (nilai >= 80) return NILAI_HURUF.A;
  if (nilai >= 70) return NILAI_HURUF.B;
  if (nilai >= 60) return NILAI_HURUF.C;
  if (nilai >= 50) return NILAI_HURUF.D;
  return NILAI_HURUF.E;
}
