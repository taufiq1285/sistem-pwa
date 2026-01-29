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
import { cacheAPI } from "@/lib/offline/api-cache";
import type {
  BankSoal,
  CreateBankSoalData,
  UpdateBankSoalData,
  BankSoalFilters,
  BankSoalStats,
} from "@/types/bank-soal.types";
import type {
  TipeSoal,
  Soal,
  CreateSoalData,
  OpsiJawaban,
} from "@/types/kuis.types";

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all questions from bank with optional filters
 */
export async function getBankSoal(
  filters?: BankSoalFilters,
): Promise<BankSoal[]> {
  // Create cache key from filters
  const cacheKey = `bank_soal_${JSON.stringify(filters)}`;

  return cacheAPI(
    cacheKey,
    async () => {
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
      return (data || []).map((item) => ({
        ...item,
        tipe_soal: item.tipe_soal as TipeSoal,
        opsi_jawaban: item.opsi_jawaban as unknown as OpsiJawaban[] | null,
        is_public: item.is_public || false,
        usage_count: item.usage_count || 0,
      }));
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutes cache
      staleWhileRevalidate: true,
    },
  );
}

/**
 * Get single question from bank by ID
 */
export async function getBankSoalById(id: string): Promise<BankSoal> {
  return cacheAPI(
    `bank_soal_${id}`,
    async () => {
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

      return {
        ...data,
        tipe_soal: data.tipe_soal as TipeSoal,
        opsi_jawaban: data.opsi_jawaban as unknown as OpsiJawaban[] | null,
        is_public: data.is_public || false,
        usage_count: data.usage_count || 0,
      };
    },
    {
      ttl: 10 * 60 * 1000, // 10 minutes
      staleWhileRevalidate: true,
    },
  );
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
    .insert([data as any])
    .select()
    .single();

  if (error) throw error;
  if (!newQuestion) throw new Error("Failed to create question");

  return {
    ...newQuestion,
    tipe_soal: newQuestion.tipe_soal as TipeSoal,
    opsi_jawaban: newQuestion.opsi_jawaban as unknown as OpsiJawaban[] | null,
    is_public: newQuestion.is_public || false,
    usage_count: newQuestion.usage_count || 0,
  };
}

/**
 * Check for duplicate questions in bank
 * Returns similar questions based on pertanyaan similarity
 */
export async function checkDuplicateBankSoal(
  pertanyaan: string,
  dosenId: string,
  tipe_soal?: TipeSoal,
): Promise<BankSoal[]> {
  // Normalize text for comparison (lowercase, trim)
  const normalizedPertanyaan = pertanyaan.toLowerCase().trim();

  let query = supabase.from("bank_soal").select("*").eq("dosen_id", dosenId);

  if (tipe_soal) {
    query = query.eq("tipe_soal", tipe_soal);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Filter for similar questions (case-insensitive exact match or 90% similarity)
  const similarQuestions = (data || []).filter((item) => {
    const itemPertanyaan = item.pertanyaan.toLowerCase().trim();

    // Exact match
    if (itemPertanyaan === normalizedPertanyaan) {
      return true;
    }

    // Calculate similarity (Levenshtein distance for similar matches)
    const similarity = calculateSimilarity(
      itemPertanyaan,
      normalizedPertanyaan,
    );
    return similarity >= 0.9; // 90% similar
  });

  return similarQuestions.map((item) => ({
    ...item,
    tipe_soal: item.tipe_soal as TipeSoal,
    opsi_jawaban: item.opsi_jawaban as unknown as OpsiJawaban[] | null,
    is_public: item.is_public || false,
    usage_count: item.usage_count || 0,
  }));
}

/**
 * Calculate text similarity (simple word-based approach)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Save existing quiz question to bank (with duplicate check)
 */
export async function saveSoalToBank(
  soal: Soal,
  dosenId: string,
  tags?: string[],
): Promise<{ bankSoal: BankSoal; duplicates: BankSoal[] }> {
  // Check for duplicates first
  const duplicates = await checkDuplicateBankSoal(
    soal.pertanyaan,
    dosenId,
    soal.tipe_soal,
  );

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

  const bankSoal = await createBankSoal(bankData);

  return { bankSoal, duplicates };
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
    .update(data as any)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!updated) throw new Error("Failed to update question");

  return {
    ...updated,
    tipe_soal: updated.tipe_soal as TipeSoal,
    opsi_jawaban: updated.opsi_jawaban as unknown as OpsiJawaban[] | null,
    is_public: updated.is_public || false,
    usage_count: updated.usage_count || 0,
  };
}

/**
 * Increment usage count for a question
 */
export async function incrementBankSoalUsage(id: string): Promise<void> {
  // RPC function not available in database schema
  // const { error } = await supabase.rpc("increment_bank_soal_usage", {
  //   question_id: id,
  // });
  // if (error) throw error;
  console.log(
    `Usage increment for bank soal ${id} skipped - RPC not available`,
  );
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

  return (newSoal || []).map((soal: any) => ({
    id: soal.id,
    kuis_id: soal.kuis_id,
    pertanyaan: soal.pertanyaan,
    tipe_soal: soal.tipe as TipeSoal, // Map database 'tipe' to expected 'tipe_soal'
    poin: soal.poin,
    urutan: soal.urutan,
    pilihan_jawaban: soal.pilihan_jawaban,
    jawaban_benar: soal.jawaban_benar,
    pembahasan: soal.pembahasan,
    media_url: soal.media_url,
    rubrik_penilaian: soal.rubrik_penilaian,
    created_at: soal.created_at,
    updated_at: soal.updated_at,
  }));
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

  // Cast tipe_soal from string to TipeSoal type
  return newBankQuestions.map((item: any) => ({
    ...item,
    tipe_soal: item.tipe_soal as TipeSoal,
    opsi_jawaban: item.opsi_jawaban as unknown as OpsiJawaban[] | null,
    is_public: item.is_public || false,
    usage_count: item.usage_count || 0,
  }));
}
