/**
 * Bank Soal Type Definitions
 *
 * Purpose: Types for reusable question bank
 * Features:
 * - Store questions for reuse
 * - Categorize with tags
 * - Track usage statistics
 */

import type { TipeSoal, OpsiJawaban } from "./kuis.types";

// ============================================================================
// MAIN INTERFACE
// ============================================================================

export interface BankSoal {
  // Primary fields
  id: string;
  dosen_id: string;

  // Question content
  pertanyaan: string;
  tipe_soal: TipeSoal;
  poin: number;

  // Question data
  opsi_jawaban?: OpsiJawaban[] | null;
  jawaban_benar?: string | null;
  penjelasan?: string | null;

  // Categorization
  mata_kuliah_id?: string | null;
  tags?: string[] | null;

  // Metadata
  is_public?: boolean;
  usage_count?: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Relations (populated when using joins)
  mata_kuliah?: {
    nama_mk: string;
    kode_mk: string;
  };
  dosen?: {
    user?: {
      full_name: string;
    };
  };
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface CreateBankSoalData {
  dosen_id: string;
  pertanyaan: string;
  tipe_soal: TipeSoal;
  poin: number;
  opsi_jawaban?: OpsiJawaban[];
  jawaban_benar?: string;
  penjelasan?: string;
  mata_kuliah_id?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface UpdateBankSoalData extends Partial<CreateBankSoalData> {
  id: string;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface BankSoalFilters {
  dosen_id?: string;
  mata_kuliah_id?: string;
  tipe_soal?: TipeSoal;
  tags?: string[];
  search?: string; // Search in pertanyaan
  is_public?: boolean;
  sortBy?: "created_at" | "usage_count" | "pertanyaan";
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface BankSoalStats {
  total_questions: number;
  pilihan_ganda_count: number;
  essay_count: number;
  total_usage: number;
  avg_usage_per_question: number;
  most_used_tags: { tag: string; count: number }[];
}

// ============================================================================
// UI DISPLAY TYPES
// ============================================================================

export interface BankSoalWithSelection extends BankSoal {
  isSelected?: boolean;
}

export interface AddFromBankResult {
  added_count: number;
  soal_ids: string[];
}
