/**
 * Kuis API - Secure Version
 *
 * Purpose: Prevent cheating by hiding jawaban_benar during quiz attempt
 * Strategy:
 * - When ATTEMPTING: Use soal_mahasiswa view (jawaban_benar = NULL)
 * - When VIEWING RESULT: Use soal table (jawaban_benar visible)
 */

import { supabase } from "@/lib/supabase/client";
import type { Soal, Kuis, TipeSoal } from "@/types/kuis.types";
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
      .from("soal_mahasiswa" as any) // ✅ Use secure view
      .select("*")
      .eq("kuis_id", kuisId)
      .order("urutan", { ascending: true });

    if (error) throw error;

    console.log(`✅ [Secure API] Fetched ${data.length} soal (answers hidden)`);

    // Map tipe to tipe_soal for compatibility
    const mapped = (data || []).map((soal: any) => ({
      ...soal,
      tipe_soal: soal.tipe || soal.tipe_soal,
    }));

    // ✅ LAPORAN SUPPORT:
    // For FILE_UPLOAD questions, `jawaban_benar` is used as JSON settings (instructions/acceptedTypes/maxSize),
    // not as a "correct answer". It's safe and needed to show to mahasiswa during attempt.
    const fileUploadIds = mapped
      .filter((soal: any) => (soal.tipe || soal.tipe_soal) === "file_upload")
      .map((soal: any) => soal.id)
      .filter(Boolean);

    if (fileUploadIds.length > 0) {
      try {
        const { data: configRows, error: configError } = await supabase
          .from("soal")
          .select("id,jawaban_benar")
          .in("id", fileUploadIds);

        if (!configError && configRows) {
          const configById = new Map(
            (configRows as any[]).map((row) => [row.id, row]),
          );

          return mapped.map((soal: any) => {
            const tipe = soal.tipe || soal.tipe_soal;
            if (tipe !== "file_upload") {
              // Return properly typed object
              return {
                id: soal.id,
                kuis_id: soal.kuis_id,
                pertanyaan: soal.pertanyaan,
                tipe_soal: tipe as TipeSoal,
                poin: soal.poin,
                urutan: soal.urutan,
                opsi_jawaban: soal.pilihan_jawaban || soal.opsi_jawaban,
                jawaban_benar: soal.jawaban_benar,
                pembahasan: soal.pembahasan,
                media_url: soal.media_url,
                rubrik_penilaian: soal.rubrik_penilaian,
                created_at: soal.created_at,
                updated_at: soal.updated_at,
              };
            }

            const cfg = configById.get(soal.id);
            if (!cfg) {
              return {
                id: soal.id,
                kuis_id: soal.kuis_id,
                pertanyaan: soal.pertanyaan,
                tipe_soal: tipe as TipeSoal,
                poin: soal.poin,
                urutan: soal.urutan,
                opsi_jawaban: soal.pilihan_jawaban || soal.opsi_jawaban,
                jawaban_benar: soal.jawaban_benar,
                pembahasan: soal.pembahasan,
                media_url: soal.media_url,
                rubrik_penilaian: soal.rubrik_penilaian,
                created_at: soal.created_at,
                updated_at: soal.updated_at,
              };
            }

            return {
              id: soal.id,
              kuis_id: soal.kuis_id,
              pertanyaan: soal.pertanyaan,
              tipe_soal: tipe as TipeSoal,
              poin: soal.poin,
              urutan: soal.urutan,
              opsi_jawaban: soal.pilihan_jawaban || soal.opsi_jawaban,
              jawaban_benar:
                cfg.jawaban_benar !== undefined
                  ? cfg.jawaban_benar
                  : soal.jawaban_benar,
              pembahasan: soal.pembahasan,
              media_url: soal.media_url,
              rubrik_penilaian: soal.rubrik_penilaian,
              created_at: soal.created_at,
              updated_at: soal.updated_at,
            };
          });
        }
      } catch (err) {
        console.warn(
          "⚠️ [Secure API] Failed to load FILE_UPLOAD settings from soal table:",
          err,
        );
      }
    }

    // Properly type the mapped data
    return mapped.map((soal: any) => ({
      id: soal.id,
      kuis_id: soal.kuis_id,
      pertanyaan: soal.pertanyaan,
      tipe_soal: (soal.tipe || soal.tipe_soal) as TipeSoal,
      poin: soal.poin,
      urutan: soal.urutan,
      // ✅ FIX: Map pilihan_jawaban (DB) → opsi_jawaban (TypeScript)
      opsi_jawaban: soal.pilihan_jawaban || soal.opsi_jawaban,
      jawaban_benar: soal.jawaban_benar,
      pembahasan: soal.pembahasan,
      media_url: soal.media_url,
      rubrik_penilaian: soal.rubrik_penilaian,
      created_at: soal.created_at,
      updated_at: soal.updated_at,
    }));
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
    console.log(
      "📊 [Secure API] Fetching soal WITH jawaban_benar (for results)",
    );

    const { data, error } = await supabase
      .from("soal") // ✅ Use original table
      .select("*")
      .eq("kuis_id", kuisId)
      .order("urutan", { ascending: true });

    if (error) throw error;

    console.log(
      `✅ [Secure API] Fetched ${data.length} soal (with answers for results)`,
    );

    // Map tipe to tipe_soal for compatibility
    return (data || []).map((soal: any) => ({
      id: soal.id,
      kuis_id: soal.kuis_id,
      pertanyaan: soal.pertanyaan,
      tipe_soal: (soal.tipe || soal.tipe_soal) as TipeSoal,
      poin: soal.poin,
      urutan: soal.urutan,
      opsi_jawaban: soal.pilihan_jawaban || soal.opsi_jawaban,
      jawaban_benar: soal.jawaban_benar,
      pembahasan: soal.pembahasan,
      media_url: soal.media_url,
      rubrik_penilaian: soal.rubrik_penilaian,
      created_at: soal.created_at,
      updated_at: soal.updated_at,
    }));
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
      .select(
        `
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
      `,
      )
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
      .select(
        `
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
      `,
      )
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
  attemptStatus?: "in_progress" | "submitted" | "graded",
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
