/**
 * Simplified Kuis Versioned API
 *
 * This is a simplified version that doesn't use RPC functions
 * Uses direct Supabase operations instead
 */

// ✅ FIXED: Use dynamic import to avoid circular dependency
// kuis.api.ts dynamically imports this file, so we can't statically import it back
import { notifyDosenTugasSubmitted } from "./notification.api";
import type {
  AttemptKuis,
  Jawaban,
  SubmitQuizData,
  SubmitAnswerData,
} from "@/types/kuis.types";
import { supabase } from "@/lib/supabase/client";
import { clearAllCacheSync } from "@/lib/offline/api-cache";

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

      // Build insert data with optional file metadata
      const insertData: any = {
        attempt_id: data.attempt_id,
        soal_id: data.soal_id,
        jawaban_mahasiswa: data.jawaban,
        is_auto_saved: true,
      };

      // Add file metadata if provided (for FILE_UPLOAD questions)
      if (data.file_url) {
        insertData.file_url = data.file_url;
      }
      if (data.file_name) {
        insertData.file_name = data.file_name;
      }
      if (data.file_size !== undefined) {
        insertData.file_size = data.file_size;
      }
      if (data.file_type) {
        insertData.file_type = data.file_type;
      }

      const { data: newAnswer, error } = await supabase
        .from("jawaban")
        .insert(insertData)
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

    // Build update data with optional file metadata
    const updateData: any = {
      jawaban_mahasiswa: data.jawaban,
      updated_at: new Date().toISOString(),
      is_auto_saved: true,
    };

    // Add file metadata if provided (for FILE_UPLOAD questions)
    if (data.file_url) {
      updateData.file_url = data.file_url;
    }
    if (data.file_name) {
      updateData.file_name = data.file_name;
    }
    if (data.file_size !== undefined) {
      updateData.file_size = data.file_size;
    }
    if (data.file_type) {
      updateData.file_type = data.file_type;
    }

    const { data: updatedAnswer, error: updateError } = await supabase
      .from("jawaban")
      .update(updateData)
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
 * Submit all answers with optional file metadata
 */
export async function submitAllAnswersWithVersion(
  attemptId: string,
  answers: Record<string, string>,
  fileUploads?: Record<
    string,
    {
      url: string;
      name: string;
      size: number;
      type: string;
    }
  >,
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
      const fileUpload = fileUploads?.[soalId];

      await submitAnswerSafe({
        attempt_id: attemptId,
        soal_id: soalId,
        jawaban: answers[soalId],
        // Include file metadata if available
        file_url: fileUpload?.url,
        file_name: fileUpload?.name,
        file_size: fileUpload?.size,
        file_type: fileUpload?.type,
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
 * ✅ FIX: Also update attempt status to "graded" and total_poin after grading
 */
export async function gradeAnswerWithVersion(
  answerId: string,
  poinDiperoleh: number,
  isCorrect: boolean,
  feedback?: string,
): Promise<Jawaban> {
  try {
    // ✅ FIX: Don't include version field - it doesn't exist in the schema
    // Just update the grading fields directly
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

    console.log("[KuisAPI] Grade success:", gradedAnswer);

    // ✅ FIX: Update attempt status to "graded" and total_poin after grading
    const attemptId = (gradedAnswer as any).attempt_id;
    if (attemptId) {
      console.log(
        "[KuisAPI] Updating attempt:",
        attemptId,
        "with poin:",
        poinDiperoleh,
      );

      // ✅ FIX: Don't use .select() to avoid potential RLS issues
      // Just check if update succeeded by counting affected rows
      const {
        data: attemptData,
        error: attemptError,
        count,
      } = await supabase
        .from("attempt_kuis")
        .update({
          status: "graded",
          total_poin: poinDiperoleh,
        })
        .eq("id", attemptId)
        .select();

      if (attemptError) {
        console.error(
          "[KuisAPI] Failed to update attempt status:",
          attemptError,
        );
        throw new Error(
          `Gagal mengupdate status attempt: ${attemptError.message}`,
        );
      }

      console.log(
        "[KuisAPI] Attempt updated successfully, rows affected:",
        count,
      );
      console.log("[KuisAPI] Updated data:", attemptData);

      // ✅ VERIFICATION: Verify the update actually worked by querying the attempt
      if (count && count > 0) {
        const { data: verifyAttempt, error: verifyError } = await supabase
          .from("attempt_kuis")
          .select("id, status")
          .eq("id", attemptId)
          .single();

        if (!verifyError && verifyAttempt) {
          console.log(
            "[KuisAPI] ✅ VERIFICATION: Attempt status in DB =",
            verifyAttempt.status,
          );
          if (verifyAttempt.status !== "graded") {
            console.error(
              "[KuisAPI] ❌ CRITICAL: Update reported success but status not changed in DB!",
            );
          }
        } else if (verifyError) {
          console.error("[KuisAPI] ❌ VERIFICATION FAILED:", verifyError);
        }
      }

      // ✅ FIX: Clear all cache to ensure UI gets fresh data after grading
      // This prevents the status from showing "Menunggu Penilaian" after grading
      console.log("[KuisAPI] Clearing cache after grading...");
      const deletedCount = await clearAllCacheSync();
      console.log(`[KuisAPI] Cache cleared: ${deletedCount} entries deleted`);

      // ✅ FIX: Also invalidate dosen_grading cache specifically
      // This ensures dashboard "Perlu Dinilai" count is updated
      try {
        const dosenId = await supabase.auth
          .getUser()
          .then((res) => res.data.user?.id);
        if (dosenId) {
          const { invalidateCache } = await import("@/lib/offline/api-cache");
          await invalidateCache(`dosen_grading_${dosenId}`);
          console.log(
            "[KuisAPI] Invalidated dosen_grading cache for:",
            dosenId,
          );
        }
      } catch (err) {
        console.warn(
          "[KuisAPI] Failed to invalidate dosen_grading cache:",
          err,
        );
      }
    } else {
      console.warn("[KuisAPI] No attempt_id found in graded answer");
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
