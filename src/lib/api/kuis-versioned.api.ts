/**
 * Kuis API with Optimistic Locking
 *
 * FASE 3 - Week 4 Day 2: Enhanced quiz operations with version checking
 * Wraps existing kuis.api.ts functions with optimistic locking support
 */

import {
  updateWithAutoResolve,
  updateWithConflictLog,
  getVersion,
  type VersionedUpdateResult,
} from "./versioned-update.api";
import {
  getAttemptById,
  getJawabanByAttempt,
  submitQuiz as originalSubmitQuiz,
  submitAnswer as originalSubmitAnswer,
} from "./kuis.api";
import type {
  AttemptKuis,
  Jawaban,
  SubmitQuizData,
  SubmitAnswerData,
} from "@/types/kuis.types";
import { supabase } from "@/lib/supabase/client";

// ============================================================================
// VERSIONED QUIZ ATTEMPT OPERATIONS
// ============================================================================

/**
 * Submit quiz with optimistic locking
 *
 * Uses auto-resolve strategy with smart conflict resolver
 * Business rules will protect student's answers
 */
export async function submitQuizWithVersion(
  data: SubmitQuizData,
  currentAttempt?: AttemptKuis,
): Promise<VersionedUpdateResult<AttemptKuis>> {
  // Fetch current attempt if not provided
  const attempt = currentAttempt || (await getAttemptById(data.attempt_id));
  const currentVersion = getVersion(attempt);

  console.log("[VersionedKuis] Submitting quiz with version check", {
    attemptId: data.attempt_id,
    currentVersion,
    status: attempt.status,
  });

  const result = await updateWithAutoResolve<AttemptKuis>(
    "attempt_kuis",
    data.attempt_id,
    currentVersion,
    {
      status: "submitted",
      submitted_at: new Date().toISOString(),
      sisa_waktu: data.sisa_waktu,
    },
    Date.now(),
  );

  if (!result.success) {
    console.warn("[VersionedKuis] Quiz submission conflict", {
      error: result.error,
      hasConflict: !!result.conflict,
    });
  }

  return result;
}

/**
 * Submit quiz - backward compatible wrapper
 *
 * Falls back to original implementation if version not available
 */
export async function submitQuizSafe(
  data: SubmitQuizData,
): Promise<AttemptKuis> {
  try {
    // Try versioned update first
    const attempt = await getAttemptById(data.attempt_id);

    // Check if table has _version column
    if ((attempt as any)._version !== undefined) {
      const result = await submitQuizWithVersion(data, attempt);

      if (result.success && result.data) {
        // Update successful with version check
        return {
          ...attempt,
          ...result.data,
          _version: result.newVersion,
        } as AttemptKuis;
      }

      // If conflict but auto-resolved
      if (result.data) {
        return result.data as AttemptKuis;
      }

      // Failed - throw error
      throw new Error(result.error || "Failed to submit quiz");
    }

    // No _version column - use original implementation
    console.warn("[VersionedKuis] No _version column, using original submit");
    return await originalSubmitQuiz(data);
  } catch (error) {
    // Fallback to original
    console.error(
      "[VersionedKuis] Versioned submit failed, falling back to original",
      error,
    );
    return await originalSubmitQuiz(data);
  }
}

// ============================================================================
// VERSIONED ANSWER OPERATIONS
// ============================================================================

/**
 * Submit answer with optimistic locking
 *
 * Protected fields: jawaban (student's answer)
 * Server authoritative: poin_diperoleh, is_correct (grading)
 */
export async function submitAnswerWithVersion(
  data: SubmitAnswerData,
  currentAnswer?: Jawaban,
): Promise<VersionedUpdateResult<Jawaban>> {
  // Check if answer already exists
  const { data: existingAnswers } = await supabase
    .from("jawaban")
    .select("*")
    .eq("attempt_id", data.attempt_id)
    .eq("soal_id", data.soal_id);

  const existing = existingAnswers?.[0] as Jawaban | undefined;

  // If no existing answer, create new (no version check needed)
  if (!existing) {
    console.log("[VersionedKuis] Creating new answer (no version check)");

    const { data: newAnswer, error } = await supabase
      .from("jawaban")
      .insert({
        attempt_id: data.attempt_id,
        soal_id: data.soal_id,
        jawaban_mahasiswa: data.jawaban, // Column name is jawaban_mahasiswa, not jawaban
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: newAnswer,
      newVersion: (newAnswer as any)._version || 1,
    };
  }

  // Answer exists - use version check
  const currentVersion = getVersion(currentAnswer || existing);

  console.log("[VersionedKuis] Updating answer with version check", {
    answerId: existing.id,
    currentVersion,
    isGraded: !!(existing as any).poin_diperoleh,
  });

  const result = await updateWithAutoResolve<Jawaban>(
    "jawaban",
    existing.id,
    currentVersion,
    {
      jawaban_mahasiswa: data.jawaban, // Column name is jawaban_mahasiswa, not jawaban
      updated_at: new Date().toISOString(),
    },
    Date.now(),
  );

  if (!result.success) {
    console.warn("[VersionedKuis] Answer update conflict", {
      error: result.error,
      hasConflict: !!result.conflict,
    });
  }

  return result;
}

/**
 * Submit answer - backward compatible wrapper
 *
 * IMPORTANT: This does NOT fall back to originalSubmitAnswer to avoid circular dependency
 * If versioned update fails, we throw the error for the caller to handle
 */
export async function submitAnswerSafe(
  data: SubmitAnswerData,
): Promise<Jawaban> {
  // Try versioned update
  const result = await submitAnswerWithVersion(data);

  if (result.success && result.data) {
    return result.data as Jawaban;
  }

  // Failed but might have data (conflict resolved)
  if (result.data) {
    return result.data as Jawaban;
  }

  // Failed - throw error (no fallback to avoid circular dependency)
  console.error("[VersionedKuis] Submit answer failed:", result.error);
  throw new Error(result.error || "Failed to submit answer");
}

// ============================================================================
// BATCH OPERATIONS WITH VERSION CHECK
// ============================================================================

/**
 * Submit all answers with version checking
 *
 * Processes answers in parallel, handles conflicts individually
 */
export async function submitAllAnswersWithVersion(
  attemptId: string,
  answers: Record<string, string>, // soalId -> jawaban
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
  let conflicts = 0;

  // Fetch all existing answers for this attempt
  const existingAnswers = await getJawabanByAttempt(attemptId);
  const existingMap = new Map(existingAnswers.map((a) => [a.soal_id, a]));

  // Process all answers in parallel
  const promises = soalIds.map(async (soalId) => {
    try {
      const existing = existingMap.get(soalId);

      const result = await submitAnswerWithVersion(
        {
          attempt_id: attemptId,
          soal_id: soalId,
          jawaban: answers[soalId],
        },
        existing,
      );

      if (result.success) {
        success++;
        results.push({ soalId, success: true });
      } else if (result.conflict) {
        conflicts++;
        results.push({
          soalId,
          success: !!result.data, // Auto-resolved
          conflict: true,
          error: result.error,
        });
      } else {
        failed++;
        results.push({
          soalId,
          success: false,
          error: result.error,
        });
      }
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

  console.log("[VersionedKuis] Batch submit complete", {
    total: soalIds.length,
    success,
    failed,
    conflicts,
  });

  return { success, failed, conflicts, results };
}

// ============================================================================
// GRADE OPERATIONS WITH VERSION CHECK
// ============================================================================

/**
 * Grade answer with conflict logging
 *
 * Teacher grades are critical data - conflicts require manual resolution
 */
export async function gradeAnswerWithVersion(
  answerId: string,
  poinDiperoleh: number,
  isCorrect: boolean,
  feedback?: string,
  currentAnswer?: Jawaban,
): Promise<VersionedUpdateResult<Jawaban>> {
  // Fetch current answer if not provided
  const answer =
    currentAnswer ||
    (await supabase
      .from("jawaban")
      .select("*")
      .eq("id", answerId)
      .single()
      .then(({ data }) => data as Jawaban));

  if (!answer) {
    return {
      success: false,
      error: "Answer not found",
    };
  }

  const currentVersion = getVersion(answer);

  console.log("[VersionedKuis] Grading answer with version check", {
    answerId,
    currentVersion,
    poinDiperoleh,
  });

  // Use conflict logging for grades (manual resolution)
  const result = await updateWithConflictLog<Jawaban>(
    "jawaban",
    answerId,
    currentVersion,
    {
      poin_diperoleh: poinDiperoleh,
      is_correct: isCorrect,
      feedback: feedback || null,
    } as any,
  );

  if (!result.success && result.conflict) {
    console.warn(
      "[VersionedKuis] Grade conflict - logged for manual resolution",
      {
        answerId,
        localVersion: result.conflict.localVersion,
        remoteVersion: result.conflict.remoteVersion,
      },
    );
  }

  return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if quiz attempt has unsaved conflicts
 */
export async function hasAttemptConflicts(attemptId: string): Promise<boolean> {
  const result: any = await (supabase as any)
    .from("conflict_log")
    .select("*")
    .eq("table_name", "attempt_kuis")
    .eq("record_id", attemptId)
    .eq("status", "pending")
    .limit(1);

  const { data, error } = result;

  if (error) {
    console.error("[VersionedKuis] Error checking conflicts:", error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Check if any answers have conflicts
 */
export async function hasAnswerConflicts(attemptId: string): Promise<boolean> {
  // Get all answer IDs for this attempt
  const answers = await getJawabanByAttempt(attemptId);
  const answerIds = answers.map((a) => a.id);

  if (answerIds.length === 0) return false;

  const { data, error } = await (supabase as any)
    .from("conflict_log")
    .select("id")
    .eq("table_name", "jawaban")
    .in("record_id", answerIds)
    .eq("status", "pending")
    .limit(1);

  if (error) {
    console.error("[VersionedKuis] Error checking answer conflicts:", error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Get pending conflicts count for attempt
 */
export async function getAttemptConflictsCount(
  attemptId: string,
): Promise<number> {
  const answers = await getJawabanByAttempt(attemptId);
  const answerIds = answers.map((a) => a.id);

  const { data, error } = await (supabase as any)
    .from("conflict_log")
    .select("id")
    .or(
      `and(table_name.eq.attempt_kuis,record_id.eq.${attemptId}),and(table_name.eq.jawaban,record_id.in.(${answerIds.join(",")}))`,
    )
    .eq("status", "pending");

  if (error) {
    console.error("[VersionedKuis] Error getting conflicts count:", error);
    return 0;
  }

  return data?.length || 0;
}
