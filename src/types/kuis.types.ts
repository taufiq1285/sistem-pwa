/**
 * Kuis (Quiz) Types
 * 
 * Purpose: Define types for quiz system with offline-first capability
 * Used by: Mahasiswa Quiz, Dosen Quiz Builder, Dashboard
 * CRITICAL: This is offline-capable module
 */

import type { Database } from './database.types';

// ========================================
// BASE TYPES FROM DATABASE
// ========================================

type KuisTable = Database['public']['Tables'] extends { kuis: { Row: infer R } }
  ? R
  : {
      id: string;
      kelas_id: string;
      dosen_id: string;
      judul: string;
      deskripsi?: string | null;
      tipe_kuis: 'pilihan_ganda' | 'essay' | 'campuran';
      durasi: number; // minutes
      tanggal_mulai: string;
      tanggal_selesai: string;
      passing_grade: number;
      max_attempts: number;
      shuffle_soal?: boolean;
      shuffle_jawaban?: boolean;
      show_hasil?: boolean;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };

type SoalTable = Database['public']['Tables'] extends { soal: { Row: infer R } }
  ? R
  : {
      id: string;
      kuis_id: string;
      pertanyaan: string;
      tipe_soal: 'pilihan_ganda' | 'benar_salah' | 'essay' | 'jawaban_singkat';
      poin: number;
      urutan: number;
      opsi_jawaban?: any; // JSON
      jawaban_benar?: string | null;
      penjelasan?: string | null;
      created_at?: string;
    };

type AttemptKuisTable = Database['public']['Tables'] extends { attempt_kuis: { Row: infer R } }
  ? R
  : {
      id: string;
      kuis_id: string;
      mahasiswa_id: string;
      attempt_number: number;
      started_at: string;
      submitted_at?: string | null;
      sisa_waktu?: number | null;
      total_poin: number;
      status: 'in_progress' | 'submitted' | 'graded';
      is_synced?: boolean;
      created_at?: string;
      updated_at?: string;
    };

type JawabanTable = Database['public']['Tables'] extends { jawaban: { Row: infer R } }
  ? R
  : {
      id: string;
      attempt_id: string;
      soal_id: string;
      jawaban: string;
      poin_diperoleh?: number | null;
      is_correct?: boolean | null;
      feedback?: string | null;
      is_synced?: boolean;
      created_at?: string;
      updated_at?: string;
    };

// ========================================
// EXTENDED TYPES WITH RELATIONS
// ========================================

export interface Kuis extends KuisTable {
  kelas?: {
    nama_kelas: string;
    mata_kuliah?: {
      nama_mk: string;
      kode_mk: string;
    };
  };
  dosen?: {
    full_name: string;
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

export interface Soal extends SoalTable {
  kuis?: {
    judul: string;
  };
}

export interface AttemptKuis extends AttemptKuisTable {
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

export interface Jawaban extends JawabanTable {
  soal?: Soal;
  attempt?: {
    mahasiswa_id: string;
  };
}

// ========================================
// DASHBOARD SPECIFIC TYPES
// ========================================

/**
 * Upcoming Quiz for Mahasiswa Dashboard
 */
export interface UpcomingQuiz {
  id: string;
  kelas_id: string;
  judul: string;
  nama_mk: string;
  kode_mk: string;
  nama_kelas: string;
  dosen_name: string;
  
  // Quiz details
  tipe_kuis: 'pilihan_ganda' | 'essay' | 'campuran';
  durasi: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  passing_grade: number;
  total_soal: number;
  
  // Student progress
  attempts_used: number;
  max_attempts: number;
  can_attempt: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'missed';
  best_score?: number;
  last_attempt_at?: string;
}

/**
 * Quiz Statistics for Dashboard
 */
export interface QuizStats {
  total_quiz: number;
  completed_quiz: number;
  average_score: number;
  upcoming_quiz: number;
}

/**
 * Recent Quiz Result for Dashboard
 */
export interface RecentQuizResult {
  id: string;
  attempt_id: string;
  judul: string;
  nama_mk: string;
  submitted_at: string;
  total_poin: number;
  max_poin: number;
  percentage: number;
  status: 'graded' | 'pending';
  passed: boolean;
}

// ========================================
// QUIZ ATTEMPT TYPES (OFFLINE-CAPABLE)
// ========================================

/**
 * Quiz Attempt Session (Stored in IndexedDB)
 * CRITICAL: This is stored locally for offline capability
 */
export interface QuizAttemptSession {
  attempt_id: string;
  kuis_id: string;
  mahasiswa_id: string;
  attempt_number: number;
  started_at: string;
  durasi: number;
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

/**
 * Soal with student's answer
 */
export interface SoalWithAnswer extends Soal {
  student_answer?: string;
  is_answered: boolean;
  is_flagged?: boolean;
  answered_at?: string;
}

/**
 * Auto-save data structure
 */
export interface QuizAutoSaveData {
  attempt_id: string;
  soal_id: string;
  jawaban: string;
  saved_at: string;
  is_synced: boolean;
}

// ========================================
// FORM DATA TYPES
// ========================================

export interface CreateKuisData {
  kelas_id: string;
  dosen_id: string;
  judul: string;
  deskripsi?: string;
  tipe_kuis: 'pilihan_ganda' | 'essay' | 'campuran';
  durasi: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  passing_grade: number;
  max_attempts: number;
  shuffle_soal?: boolean;
  shuffle_jawaban?: boolean;
  show_hasil?: boolean;
  is_active?: boolean;
}

export interface UpdateKuisData extends Partial<CreateKuisData> {
  id: string;
}

export interface CreateSoalData {
  kuis_id: string;
  pertanyaan: string;
  tipe_soal: 'pilihan_ganda' | 'benar_salah' | 'essay' | 'jawaban_singkat';
  poin: number;
  urutan: number;
  opsi_jawaban?: OpsiJawaban[];
  jawaban_benar?: string;
  penjelasan?: string;
}

export interface UpdateSoalData extends Partial<CreateSoalData> {
  id: string;
}

/**
 * Opsi Jawaban for Multiple Choice
 */
export interface OpsiJawaban {
  id: string;
  label: string; // A, B, C, D
  text: string;
  is_correct?: boolean; // Only for teacher view
}

/**
 * Start Quiz Attempt
 */
export interface StartAttemptData {
  kuis_id: string;
  mahasiswa_id: string;
}

/**
 * Submit Answer (can be queued offline)
 */
export interface SubmitAnswerData {
  attempt_id: string;
  soal_id: string;
  jawaban: string;
}

/**
 * Submit Quiz
 */
export interface SubmitQuizData {
  attempt_id: string;
  sisa_waktu: number;
}

// ========================================
// FILTER & QUERY TYPES
// ========================================

export interface KuisFilters {
  kelas_id?: string;
  dosen_id?: string;
  tipe_kuis?: 'pilihan_ganda' | 'essay' | 'campuran';
  is_active?: boolean;
  status?: 'upcoming' | 'ongoing' | 'past';
  search?: string;
}

export interface AttemptFilters {
  kuis_id?: string;
  mahasiswa_id?: string;
  status?: 'in_progress' | 'submitted' | 'graded';
  is_synced?: boolean;
}

// ========================================
// CONSTANTS
// ========================================

export const TIPE_KUIS = {
  PILIHAN_GANDA: 'pilihan_ganda',
  ESSAY: 'essay',
  CAMPURAN: 'campuran',
} as const;

export const TIPE_KUIS_LABELS = {
  pilihan_ganda: 'Pilihan Ganda',
  essay: 'Essay',
  campuran: 'Campuran',
} as const;

export const TIPE_SOAL = {
  PILIHAN_GANDA: 'pilihan_ganda',
  BENAR_SALAH: 'benar_salah',
  ESSAY: 'essay',
  JAWABAN_SINGKAT: 'jawaban_singkat',
} as const;

export const TIPE_SOAL_LABELS = {
  pilihan_ganda: 'Pilihan Ganda',
  benar_salah: 'Benar/Salah',
  essay: 'Essay',
  jawaban_singkat: 'Jawaban Singkat',
} as const;

export const ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
} as const;

export const ATTEMPT_STATUS_LABELS = {
  in_progress: 'Sedang Dikerjakan',
  submitted: 'Sudah Dikumpulkan',
  graded: 'Sudah Dinilai',
} as const;

export const QUIZ_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  MISSED: 'missed',
} as const;

export const QUIZ_STATUS_LABELS = {
  upcoming: 'Akan Datang',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  missed: 'Terlewat',
} as const;

// Auto-save interval (ms)
export const QUIZ_AUTOSAVE_INTERVAL = 30000; // 30 seconds

// Warning time before quiz ends (seconds)
export const QUIZ_WARNING_TIME = 300; // 5 minutes