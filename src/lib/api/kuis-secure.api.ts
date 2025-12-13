/**
 * Kuis API - Secure Version
 *
 * Purpose: Prevent cheating by hiding jawaban_benar during quiz attempt
 * Strategy:
 * - When ATTEMPTING: Use soal_mahasiswa view (jawaban_benar = NULL)
 * - When VIEWING RESULT: Use soal table (jawaban_benar visible)
 */

import { supabase } from "@/lib/supabase/client";
import type { Soal, Kuis } from "@/types/kuis.types";
import { handleError, logError } from "@/lib/utils/errors";

// ============================================================================
// SECURE SOAL FETCHING
// ============================================================================

/**
 * Get soal for mahasiswa during quiz attempt
 * ✅ SECURE: jawaban_benar is hidden
 * Use this when mahasiswa is ATTEMPTING quiz
 */
export async function getSoalForAttempt(kuisId: string): Promise<Soal[]> {
  try {
    console.log("🔒 [Secure API] Fetching soal WITHOUT jawaban_benar");

    const { data, error } = await supabase
      .from("soal_mahasiswa") // ✅ Use secure view
      .select("*")
      .eq("kuis_id", kuisId)
      .order("urutan", { ascending: true });

    if (error) throw error;

    console.log(`✅ [Secure API] Fetched ${data.length} soal (answers hidden)`);

    return data as Soal[];
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getSoalForAttempt:${kuisId}`);
    throw apiError;
  }
}

/**
 * Get soal for viewing quiz results
 * ✅ INCLUDES: jawaban_benar (for showing correct answers)
 * Use this when mahasiswa is VIEWING RESULTS after submit
 */
export async function getSoalForResult(kuisId: string): Promise<Soal[]> {
  try {
    console.log("📊 [Secure API] Fetching soal WITH jawaban_benar (for results)");

    const { data, error } = await supabase
      .from("soal") // ✅ Use original table
      .select("*")
      .eq("kuis_id", kuisId)
      .order("urutan", { ascending: true });

    if (error) throw error;

    console.log(`✅ [Secure API] Fetched ${data.length} soal (with answers for results)`);

    return data as Soal[];
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getSoalForResult:${kuisId}`);
    throw apiError;
  }
}

/**
 * Get kuis with soal for quiz attempt
 * ✅ SECURE: Uses soal_mahasiswa view
 */
export async function getKuisForAttempt(kuisId: string): Promise<Kuis> {
  try {
    console.log("🔒 [Secure API] Fetching kuis for attempt");

    // Get kuis data
    const { data: kuisData, error: kuisError } = await supabase
      .from("kuis")
      .select(`
        *,
        kelas:kelas_id (
          nama_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          )
        ),
        dosen:dosen_id (
          users:user_id (
            full_name
          )
        )
      `)
      .eq("id", kuisId)
      .single();

    if (kuisError) throw kuisError;

    // Get soal WITHOUT jawaban_benar
    const soal = await getSoalForAttempt(kuisId);

    const result = {
      ...kuisData,
      soal,
    } as Kuis;

    console.log("✅ [Secure API] Kuis loaded securely for attempt");

    return result;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getKuisForAttempt:${kuisId}`);
    throw apiError;
  }
}

/**
 * Get kuis with soal for viewing results
 * ✅ INCLUDES: jawaban_benar
 */
export async function getKuisForResult(kuisId: string): Promise<Kuis> {
  try {
    console.log("📊 [Secure API] Fetching kuis for results");

    // Get kuis data
    const { data: kuisData, error: kuisError } = await supabase
      .from("kuis")
      .select(`
        *,
        kelas:kelas_id (
          nama_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          )
        ),
        dosen:dosen_id (
          users:user_id (
            full_name
          )
        )
      `)
      .eq("id", kuisId)
      .single();

    if (kuisError) throw kuisError;

    // Get soal WITH jawaban_benar
    const soal = await getSoalForResult(kuisId);

    const result = {
      ...kuisData,
      soal,
    } as Kuis;

    console.log("✅ [Secure API] Kuis loaded with answers for results");

    return result;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getKuisForResult:${kuisId}`);
    throw apiError;
  }
}

// ============================================================================
// HELPER: Check if user can see answers
// ============================================================================

/**
 * Check if user should see jawaban_benar
 * - DOSEN: Always can see
 * - ADMIN: Always can see
 * - MAHASISWA: Only AFTER submitting quiz
 */
export function canSeeAnswers(
  userRole: string,
  attemptStatus?: "in_progress" | "submitted" | "graded"
): boolean {
  // Dosen and Admin can always see answers
  if (userRole === "dosen" || userRole === "admin") {
    return true;
  }

  // Mahasiswa can only see answers after submitting
  if (userRole === "mahasiswa") {
    return attemptStatus === "submitted" || attemptStatus === "graded";
  }

  // Default: cannot see answers
  return false;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const secureKuisApi = {
  // For mahasiswa attempting quiz (answers hidden)
  getKuisForAttempt,
  getSoalForAttempt,

  // For viewing results (answers visible)
  getKuisForResult,
  getSoalForResult,

  // Helper
  canSeeAnswers,
};

export default secureKuisApi;
