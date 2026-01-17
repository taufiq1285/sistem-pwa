/**
 * FASE 3: Conflict Resolution Rules Configuration
 *
 * Business rules for smart conflict resolution
 * Based on actual database schema
 *
 * USAGE:
 * Import and register these rules in smart-conflict-resolver.ts
 *
 * @example
 * import { conflictRules } from './conflict-rules.config';
 * conflictRules.forEach(rule => registerConflictRule(rule));
 */

import type { ConflictRule } from "./smart-conflict-resolver";

// ============================================================================
// ATTEMPT_KUIS - Quiz Attempts
// ============================================================================

const attemptKuisRule: ConflictRule = {
  entity: "attempt_kuis",

  // Fields that should NEVER be overwritten (student ownership)
  protectedFields: [
    "mahasiswa_id", // Student ID - immutable
    "kuis_id", // Quiz ID - immutable
    "started_at", // Start time - first timestamp wins
    "auto_save_data", // Draft answers - student data
    "device_id", // Device identifier
    "attempt_number", // Attempt sequence number
  ],

  // Fields where server is authoritative (grading, final status)
  serverAuthoritativeFields: [
    "status", // Server determines final status
    "total_score", // Server calculates final score
    "percentage", // Calculated by server
    "is_passed", // Pass/fail determined by server
    "synced_at", // Server sync timestamp
    "sync_status", // Server sync status
  ],

  // Validation before merging
  validator: (localData: any, remoteData: any) => {
    // Cannot have two different submissions
    if (
      localData.status === "submitted" &&
      remoteData.status === "submitted" &&
      localData.submitted_at !== remoteData.submitted_at
    ) {
      return "Duplicate submission detected - needs manual review";
    }

    // Cannot change student after creation
    if (localData.mahasiswa_id !== remoteData.mahasiswa_id) {
      return "Student ID mismatch - data corruption?";
    }

    // Cannot change quiz after creation
    if (localData.kuis_id !== remoteData.kuis_id) {
      return "Quiz ID mismatch - data corruption?";
    }

    return null; // Valid
  },
};

// ============================================================================
// JAWABAN - Individual Quiz Answers
// ============================================================================

const jawabanRule: ConflictRule = {
  entity: "jawaban",

  protectedFields: [
    "attempt_id", // Parent attempt - immutable
    "soal_id", // Question ID - immutable
    "jawaban_mahasiswa", // Student answer - protected
    "jawaban_data", // Answer data (for structured answers)
    "saved_at", // When student saved
    "is_auto_saved", // Auto-save flag
  ],

  serverAuthoritativeFields: [
    "poin_diperoleh", // Points awarded by teacher/system
    "is_correct", // Correctness determined by server
    "feedback", // Teacher feedback
    "graded_by", // Who graded it
    "graded_at", // When it was graded
  ],

  validator: (localData: any, remoteData: any) => {
    // Cannot change answer after grading
    if (
      remoteData.graded_at &&
      localData.jawaban_mahasiswa !== remoteData.jawaban_mahasiswa
    ) {
      return "Cannot modify answer after grading";
    }

    // Cannot change question
    if (localData.soal_id !== remoteData.soal_id) {
      return "Question ID mismatch - data corruption?";
    }

    return null;
  },
};

// ============================================================================
// NILAI - Grades
// ============================================================================

const nilaiRule: ConflictRule = {
  entity: "nilai",

  protectedFields: [
    "mahasiswa_id", // Student ID - immutable
    "kelas_id", // Class ID - immutable
  ],

  serverAuthoritativeFields: [
    "nilai_akhir", // Final grade - calculated by server
    "nilai_huruf", // Letter grade - auto-calculated
  ],

  validator: (localData: any, remoteData: any) => {
    // Detect large grade changes (possible error)
    const localFinal = localData.nilai_akhir || 0;
    const remoteFinal = remoteData.nilai_akhir || 0;
    const diff = Math.abs(localFinal - remoteFinal);

    if (diff > 20) {
      return `Large grade difference detected: ${diff} points`;
    }

    // Cannot change student
    if (localData.mahasiswa_id !== remoteData.mahasiswa_id) {
      return "Student ID mismatch";
    }

    return null;
  },
};

// ============================================================================
// KEHADIRAN - Attendance
// ============================================================================

const kehadiranRule: ConflictRule = {
  entity: "kehadiran",

  protectedFields: [
    "mahasiswa_id", // Student ID - immutable
    "jadwal_id", // Schedule ID - immutable
    "waktu_check_in", // Check-in time - first timestamp wins
  ],

  serverAuthoritativeFields: [
    "status", // Final status can be edited by teacher
  ],

  validator: (localData: any, remoteData: any) => {
    if (localData.mahasiswa_id !== remoteData.mahasiswa_id) {
      return "Student ID mismatch";
    }

    if (localData.jadwal_id !== remoteData.jadwal_id) {
      return "Schedule ID mismatch";
    }

    return null;
  },
};

// ============================================================================
// MATERI - Course Materials
// ============================================================================

const materiRule: ConflictRule = {
  entity: "materi",

  protectedFields: [
    "dosen_id", // Teacher ID - immutable
    "kelas_id", // Class ID - immutable
  ],

  serverAuthoritativeFields: [
    "download_count", // Server tracks downloads
    "cache_version", // Server manages cache
    "last_cached_at", // Server timestamp
    "published_at", // Publication time
  ],

  validator: (localData: any, remoteData: any) => {
    if (localData.dosen_id !== remoteData.dosen_id) {
      return "Teacher ID mismatch";
    }

    if (localData.kelas_id !== remoteData.kelas_id) {
      return "Class ID mismatch";
    }

    return null;
  },
};

// ============================================================================
// SOAL - Quiz Questions
// ============================================================================

const soalRule: ConflictRule = {
  entity: "soal",

  protectedFields: [
    "kuis_id", // Quiz ID - immutable
    "urutan", // Question order - immutable
  ],

  serverAuthoritativeFields: [
    "pertanyaan", // Question text - teacher edits
    "pilihan_jawaban", // Answer options - teacher edits
    "jawaban_benar", // Correct answer - teacher sets
    "poin", // Points - teacher sets
    "pembahasan", // Explanation - teacher adds
  ],

  validator: (localData: any, remoteData: any) => {
    if (localData.kuis_id !== remoteData.kuis_id) {
      return "Quiz ID mismatch";
    }

    return null;
  },
};

// ============================================================================
// KUIS - Quiz Definition
// ============================================================================

const kuisRule: ConflictRule = {
  entity: "kuis",

  protectedFields: [
    "dosen_id", // Teacher ID - immutable
    "kelas_id", // Class ID - immutable
  ],

  serverAuthoritativeFields: [
    "published_at", // Publication timestamp
    "status", // Draft/published/archived
  ],

  // Note: kuis table has 'version' not '_version'

  validator: (localData: any, remoteData: any) => {
    if (localData.dosen_id !== remoteData.dosen_id) {
      return "Teacher ID mismatch";
    }

    if (localData.kelas_id !== remoteData.kelas_id) {
      return "Class ID mismatch";
    }

    // Cannot edit published quiz
    if (remoteData.status === "published" && localData.status !== "published") {
      return "Cannot unpublish quiz";
    }

    return null;
  },
};

// ============================================================================
// EXPORT
// ============================================================================

/**
 * All conflict resolution rules
 * Priority order: from most frequently updated to least
 */
export const conflictRules: ConflictRule[] = [
  attemptKuisRule, // HIGH PRIORITY - constantly updated during quiz
  jawabanRule, // HIGH PRIORITY - constantly updated during quiz
  kehadiranRule, // MEDIUM - updated during check-in
  nilaiRule, // MEDIUM - teacher updates
  materiRule, // LOW - rarely updated
  soalRule, // LOW - rarely updated after publish
  kuisRule, // LOW - rarely updated after publish
];

/**
 * Get rule for specific entity
 */
export function getRuleForEntity(entity: string): ConflictRule | undefined {
  return conflictRules.find((rule) => rule.entity === entity);
}

/**
 * Check if entity has conflict rules defined
 */
export function hasConflictRule(entity: string): boolean {
  return conflictRules.some((rule) => rule.entity === entity);
}

/**
 * Export individual rules for selective import
 */
export {
  attemptKuisRule,
  jawabanRule,
  nilaiRule,
  kehadiranRule,
  materiRule,
  soalRule,
  kuisRule,
};
