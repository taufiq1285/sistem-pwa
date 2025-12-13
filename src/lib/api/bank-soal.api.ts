/**
 * Bank Soal API
 *
 * Purpose: API functions for question bank management
 * Features:
 * - CRUD operations for bank_soal
 * - Search and filter questions
 * - Add questions from bank to quiz
 * - Track usage statistics
 */

import { supabase } from "@/lib/supabase/client";
import type {
  BankSoal,
  CreateBankSoalData,
  UpdateBankSoalData,
  BankSoalFilters,
  BankSoalStats,
} from "@/types/bank-soal.types";
import type { Soal, CreateSoalData } from "@/types/kuis.types";

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all questions from bank with optional filters
 */
export async function getBankSoal(
  filters?: BankSoalFilters,
): Promise<BankSoal[]> {
  let query = supabase
    .from("bank_soal")
    .select(
      `
      *,
      mata_kuliah:mata_kuliah_id (
        nama_mk,
        kode_mk
      )
    `,
    )
    .order(filters?.sortBy || "created_at", {
      ascending: filters?.sortOrder === "asc",
    });

  // Apply filters
  if (filters?.dosen_id) {
    query = query.eq("dosen_id", filters.dosen_id);
  }

  if (filters?.mata_kuliah_id) {
    query = query.eq("mata_kuliah_id", filters.mata_kuliah_id);
  }

  if (filters?.tipe_soal) {
    query = query.eq("tipe_soal", filters.tipe_soal);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }

  if (filters?.search) {
    query = query.ilike("pertanyaan", `%${filters.search}%`);
  }

  if (filters?.is_public !== undefined) {
    query = query.eq("is_public", filters.is_public);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get single question from bank by ID
 */
export async function getBankSoalById(id: string): Promise<BankSoal> {
  const { data, error } = await supabase
    .from("bank_soal")
    .select(
      `
      *,
      mata_kuliah:mata_kuliah_id (
        nama_mk,
        kode_mk
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Question not found");

  return data;
}

/**
 * Get bank soal statistics for a dosen
 */
export async function getBankSoalStats(
  dosenId: string,
): Promise<BankSoalStats> {
  const { data, error } = await supabase
    .from("bank_soal")
    .select("tipe_soal, usage_count, tags")
    .eq("dosen_id", dosenId);

  if (error) throw error;

  const questions = data || [];
  const total_questions = questions.length;
  const pilihan_ganda_count = questions.filter(
    (q) => q.tipe_soal === "pilihan_ganda",
  ).length;
  const essay_count = questions.filter((q) => q.tipe_soal === "essay").length;
  const total_usage = questions.reduce(
    (sum, q) => sum + (q.usage_count || 0),
    0,
  );
  const avg_usage_per_question =
    total_questions > 0 ? total_usage / total_questions : 0;

  // Count tags
  const tagCounts: Record<string, number> = {};
  questions.forEach((q) => {
    q.tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const most_used_tags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total_questions,
    pilihan_ganda_count,
    essay_count,
    total_usage,
    avg_usage_per_question: Math.round(avg_usage_per_question * 100) / 100,
    most_used_tags,
  };
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create new question in bank
 */
export async function createBankSoal(
  data: CreateBankSoalData,
): Promise<BankSoal> {
  const { data: newQuestion, error } = await supabase
    .from("bank_soal")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  if (!newQuestion) throw new Error("Failed to create question");

  return newQuestion;
}

/**
 * Save existing quiz question to bank
 */
export async function saveSoalToBank(
  soal: Soal,
  dosenId: string,
  tags?: string[],
): Promise<BankSoal> {
  const bankData: CreateBankSoalData = {
    dosen_id: dosenId,
    pertanyaan: soal.pertanyaan,
    tipe_soal: soal.tipe_soal,
    poin: soal.poin,
    opsi_jawaban: soal.opsi_jawaban || undefined,
    jawaban_benar: soal.jawaban_benar || undefined,
    penjelasan: soal.penjelasan || undefined,
    tags: tags || [],
  };

  return createBankSoal(bankData);
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update question in bank
 */
export async function updateBankSoal(
  id: string,
  data: Partial<UpdateBankSoalData>,
): Promise<BankSoal> {
  const { data: updated, error } = await supabase
    .from("bank_soal")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!updated) throw new Error("Failed to update question");

  return updated;
}

/**
 * Increment usage count for a question
 */
export async function incrementBankSoalUsage(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_bank_soal_usage", {
    question_id: id,
  });

  if (error) throw error;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete question from bank
 */
export async function deleteBankSoal(id: string): Promise<void> {
  const { error } = await supabase.from("bank_soal").delete().eq("id", id);

  if (error) throw error;
}

/**
 * Bulk delete questions from bank
 */
export async function bulkDeleteBankSoal(ids: string[]): Promise<void> {
  const { error } = await supabase.from("bank_soal").delete().in("id", ids);

  if (error) throw error;
}

// ============================================================================
// QUIZ INTEGRATION
// ============================================================================

/**
 * Add questions from bank to a quiz
 */
export async function addQuestionsFromBank(
  kuisId: string,
  bankSoalIds: string[],
  startUrutan: number = 1,
): Promise<Soal[]> {
  // Get questions from bank
  const { data: bankQuestions, error: fetchError } = await supabase
    .from("bank_soal")
    .select("*")
    .in("id", bankSoalIds);

  if (fetchError) throw fetchError;
  if (!bankQuestions || bankQuestions.length === 0) {
    throw new Error("No questions found in bank");
  }

  // Convert bank questions to quiz questions
  // NOTE: column names differ between bank_soal and soal tables!
  const soalData = bankQuestions.map((bq, index) => ({
    kuis_id: kuisId,
    pertanyaan: bq.pertanyaan,
    tipe: bq.tipe_soal as any, // bank_soal.tipe_soal → soal.tipe
    poin: bq.poin,
    urutan: startUrutan + index,
    pilihan_jawaban: bq.opsi_jawaban || undefined, // bank_soal.opsi_jawaban → soal.pilihan_jawaban
    jawaban_benar: bq.jawaban_benar || undefined,
    pembahasan: bq.penjelasan || undefined, // bank_soal.penjelasan → soal.pembahasan
  }));

  // Insert into soal table
  const { data: newSoal, error: insertError } = await supabase
    .from("soal")
    .insert(soalData)
    .select();

  if (insertError) throw insertError;
  if (!newSoal) throw new Error("Failed to add questions to quiz");

  // Increment usage count for each question
  await Promise.all(
    bankSoalIds.map((id) => incrementBankSoalUsage(id).catch(() => {})),
  );

  return newSoal;
}

/**
 * Copy all questions from another quiz to bank
 */
export async function copyQuizQuestionsToBank(
  kuisId: string,
  dosenId: string,
  tags?: string[],
): Promise<BankSoal[]> {
  // Get all questions from the quiz
  const { data: soalList, error: fetchError } = await supabase
    .from("soal")
    .select("*")
    .eq("kuis_id", kuisId)
    .order("urutan");

  if (fetchError) throw fetchError;
  if (!soalList || soalList.length === 0) {
    throw new Error("No questions found in quiz");
  }

  // Convert to bank questions
  // NOTE: column names differ between soal and bank_soal tables!
  const bankData = soalList.map((s) => ({
    dosen_id: dosenId,
    pertanyaan: s.pertanyaan,
    tipe_soal: s.tipe as string, // soal.tipe → bank_soal.tipe_soal
    poin: s.poin,
    opsi_jawaban: (s.pilihan_jawaban as any) || undefined, // soal.pilihan_jawaban → bank_soal.opsi_jawaban
    jawaban_benar: s.jawaban_benar || undefined,
    penjelasan: s.pembahasan || undefined, // soal.pembahasan → bank_soal.penjelasan
    tags: tags || [],
  }));

  // Insert into bank
  const { data: newBankQuestions, error: insertError } = await supabase
    .from("bank_soal")
    .insert(bankData)
    .select();

  if (insertError) throw insertError;
  if (!newBankQuestions) throw new Error("Failed to copy questions to bank");

  return newBankQuestions;
}
