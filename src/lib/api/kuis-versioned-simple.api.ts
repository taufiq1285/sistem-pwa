/**
 * Simplified Kuis Versioned API
 *
 * This is a simplified version that doesn't use RPC functions
 * Uses direct Supabase operations instead
 */

import { getAttemptById, getJawabanByAttempt } from "./kuis.api";
import { notifyDosenTugasSubmitted } from "./notification.api";
import type {
  AttemptKuis,
  Jawaban,
  SubmitQuizData,
  SubmitAnswerData,
} from "@/types/kuis.types";
import { supabase } from "@/lib/supabase/client";

/**
 * Submit answer - simplified without version checking
 *
 * Directly inserts or updates in database
 */
export async function submitAnswerSafe(
  data: SubmitAnswerData,
): Promise<Jawaban> {
  try {
    // Check if answer already exists
    const { data: existingAnswers } = await supabase
      .from("jawaban")
      .select("*")
      .eq("attempt_id", data.attempt_id)
      .eq("soal_id", data.soal_id);

    const existing = existingAnswers?.[0] as Jawaban | undefined;

    // If no existing answer, create new
    if (!existing) {
      console.log("[KuisAPI] Creating new answer");

      const { data: newAnswer, error } = await supabase
        .from("jawaban")
        .insert({
          attempt_id: data.attempt_id,
          soal_id: data.soal_id,
          jawaban_mahasiswa: data.jawaban,
          is_auto_saved: true,
        })
        .select()
        .single();

      if (error) {
        console.error("[KuisAPI] Insert error:", error);
        throw new Error(error.message);
      }

      return newAnswer as Jawaban;
    }

    // Answer exists - update it
    console.log("[KuisAPI] Updating existing answer:", existing.id);

    const { data: updatedAnswer, error: updateError } = await supabase
      .from("jawaban")
      .update({
        jawaban_mahasiswa: data.jawaban,
        updated_at: new Date().toISOString(),
        is_auto_saved: true,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      console.error("[KuisAPI] Update error:", updateError);
      throw new Error(updateError.message);
    }

    return updatedAnswer as Jawaban;
  } catch (error) {
    console.error("[KuisAPI] submitAnswerSafe error:", error);
    throw error;
  }
}

/**
 * Submit quiz - simplified without version checking
 * AUTO-NOTIFICATION: Notifies dosen when mahasiswa submits tugas
 */
export async function submitQuizSafe(
  data: SubmitQuizData,
): Promise<AttemptKuis> {
  try {
    const { data: updatedAttempt, error } = await supabase
      .from("attempt_kuis")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        sisa_waktu: data.sisa_waktu,
      })
      .eq("id", data.attempt_id)
      .select(
        `
        *,
        kuis:kuis_id (
          id,
          judul,
          kelas_id,
          kelas:kelas_id (
            id,
            dosen_id,
            dosen:dosen_id (
              id,
              user_id
            )
          )
        ),
        mahasiswa:mahasiswa_id (
          id,
          user:user_id (
            full_name
          )
        )
      `,
      )
      .single();

    if (error) {
      console.error("[KuisAPI] Submit quiz error:", error);
      throw new Error(error.message);
    }

    // ✅ AUTO-NOTIFICATION: Notify dosen when mahasiswa submits tugas
    try {
      const attempt = updatedAttempt as any;
      const dosenUserId = attempt?.kuis?.kelas?.dosen?.user_id;
      const mahasiswaNama = attempt?.mahasiswa?.user?.full_name || "Mahasiswa";
      const tugasNama = attempt?.kuis?.judul || "Tugas Praktikum";

      if (dosenUserId) {
        await notifyDosenTugasSubmitted(
          dosenUserId,
          mahasiswaNama,
          tugasNama,
          data.attempt_id,
          attempt.kuis_id,
        );
        console.log(
          `[NOTIFICATION] Dosen notified: ${mahasiswaNama} submitted ${tugasNama}`,
        );
      }
    } catch (notifError) {
      // Don't fail the submission if notification fails
      console.error("[NOTIFICATION] Failed to notify dosen:", notifError);
    }

    return updatedAttempt as unknown as AttemptKuis;
  } catch (error) {
    console.error("[KuisAPI] submitQuizSafe error:", error);
    throw error;
  }
}

/**
 * Submit all answers
 */
export async function submitAllAnswersWithVersion(
  attemptId: string,
  answers: Record<string, string>,
): Promise<{
  success: number;
  failed: number;
  conflicts: number;
  results: Array<{
    soalId: string;
    success: boolean;
    error?: string;
    conflict?: boolean;
  }>;
}> {
  const soalIds = Object.keys(answers);
  const results: Array<{
    soalId: string;
    success: boolean;
    error?: string;
    conflict?: boolean;
  }> = [];

  let success = 0;
  let failed = 0;
  const conflicts = 0;

  // Process all answers in parallel
  const promises = soalIds.map(async (soalId) => {
    try {
      await submitAnswerSafe({
        attempt_id: attemptId,
        soal_id: soalId,
        jawaban: answers[soalId],
      });

      success++;
      results.push({ soalId, success: true });
    } catch (error) {
      failed++;
      results.push({
        soalId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  await Promise.all(promises);

  console.log("[KuisAPI] Batch submit complete", {
    total: soalIds.length,
    success,
    failed,
  });

  return { success, failed, conflicts, results };
}

/**
 * Grade answer with simple update
 */
export async function gradeAnswerWithVersion(
  answerId: string,
  poinDiperoleh: number,
  isCorrect: boolean,
  feedback?: string,
): Promise<Jawaban> {
  try {
    const { data: gradedAnswer, error } = await supabase
      .from("jawaban")
      .update({
        poin_diperoleh: poinDiperoleh,
        is_correct: isCorrect,
        feedback: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", answerId)
      .select()
      .single();

    if (error) {
      console.error("[KuisAPI] Grade error:", error);
      throw new Error(error.message);
    }

    return gradedAnswer as Jawaban;
  } catch (error) {
    console.error("[KuisAPI] gradeAnswerWithVersion error:", error);
    throw error;
  }
}

/**
 * Submit answer with version (alias for backward compatibility)
 */
export async function submitAnswerWithVersion(
  data: SubmitAnswerData,
  _currentAnswer?: Jawaban,
): Promise<{ success: boolean; data?: Jawaban; error?: string }> {
  try {
    const result = await submitAnswerSafe(data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
