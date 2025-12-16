/**
 * Kuis API - COMPLETE FIXED VERSION
 * Fixed type mismatches between API and type definitions
 * Added missing functions: getAttemptsByKuis and duplicateKuis
 * Fixed field name mapping for createSoal and updateSoal
 */

import {
  query,
  queryWithFilters,
  getById,
  insert,
  update,
  remove,
  withApiResponse,
} from "./base.api";
import type {
  Kuis,
  Soal,
  AttemptKuis,
  Jawaban,
  CreateKuisData,
  CreateSoalData,
  KuisFilters,
  AttemptFilters,
  StartAttemptData,
  SubmitAnswerData,
  SubmitQuizData,
  UpcomingQuiz,
  QuizStats,
  RecentQuizResult,
} from "@/types/kuis.types";
import { supabase } from "@/lib/supabase/client";
import { handleError, logError } from "@/lib/utils/errors";
import { conflictResolver } from "@/lib/offline/conflict-resolver";
import {
  requirePermission,
  requirePermissionAndOwnership,
  getCurrentDosenId,
  getCurrentMahasiswaId,
} from "@/lib/middleware/permission.middleware";

// ============================================================================
// EXTENDED TYPES
// ============================================================================

export interface AttemptWithStudent extends AttemptKuis {
  mahasiswa: {
    nim: string;
    user: {
      full_name: string;
    };
  };
  total_poin: number;
  started_at: string;
  submitted_at: string | null;
}

// ============================================================================
// KUIS (QUIZ) OPERATIONS
// ============================================================================

export async function getKuis(filters?: KuisFilters): Promise<Kuis[]> {
  try {
    const filterConditions = [];

    if (filters?.kelas_id) {
      filterConditions.push({
        column: "kelas_id",
        operator: "eq" as const,
        value: filters.kelas_id,
      });
    }

    if (filters?.dosen_id) {
      filterConditions.push({
        column: "dosen_id",
        operator: "eq" as const,
        value: filters.dosen_id,
      });
    }

    if (filters?.status) {
      filterConditions.push({
        column: "status",
        operator: "eq" as const,
        value: filters.status,
      });
    }

    const options = {
      select: `
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
          ),
          gelar_depan,
          gelar_belakang
        )
      `,
      order: {
        column: "tanggal_mulai",
        ascending: false,
      },
    };

    const data =
      filterConditions.length > 0
        ? await queryWithFilters<Kuis>("kuis", filterConditions, options)
        : await query<Kuis>("kuis", options);

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      return data.filter(
        (k) =>
          k.judul.toLowerCase().includes(searchLower) ||
          k.deskripsi?.toLowerCase().includes(searchLower),
      );
    }

    return data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getKuis");
    throw apiError;
  }
}

export async function getKuisById(id: string): Promise<Kuis> {
  try {
    return await getById<Kuis>("kuis", id, {
      select: `
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
          ),
          gelar_depan,
          gelar_belakang
        ),
        soal:soal(*)
      `,
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getKuisById:${id}`);
    throw apiError;
  }
}

export async function getKuisByKelas(kelasId: string): Promise<Kuis[]> {
  try {
    return await getKuis({ kelas_id: kelasId });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getKuisByKelas:${kelasId}`);
    throw apiError;
  }
}

// Internal implementation (unwrapped)
async function createKuisImpl(data: CreateKuisData): Promise<Kuis> {
  try {
    console.log("🔵 API createKuis called with data:", data);

    // ✅ AUTO-SET DATES: If not provided, set sensible defaults
    const dataWithDefaults = {
      ...data,
      tanggal_mulai: data.tanggal_mulai || new Date().toISOString(),
      tanggal_selesai:
        data.tanggal_selesai ||
        (() => {
          const oneMonthLater = new Date();
          oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
          return oneMonthLater.toISOString();
        })(),
    };

    const result = await insert<Kuis>("kuis", dataWithDefaults);
    console.log("✅ API createKuis success:", result);

    // ✅ AUTO-NOTIFICATION: Notify all mahasiswa in kelas when dosen creates new tugas
    try {
      // Get all mahasiswa in the kelas
      const { data: enrollment, error: enrollError } = await supabase
        .from("kelas_mahasiswa")
        .select(
          `
          mahasiswa:mahasiswa_id (
            id,
            user_id
          )
        `,
        )
        .eq("kelas_id", data.kelas_id);

      if (!enrollError && enrollment && enrollment.length > 0) {
        // Get dosen info
        const { data: dosen, error: dosenError } = await supabase
          .from("dosen")
          .select(
            `
            id,
            user:user_id (
              full_name
            )
          `,
          )
          .eq("id", data.dosen_id)
          .single();

        if (!dosenError && dosen) {
          const mahasiswaUserIds = enrollment
            .map((e: any) => e.mahasiswa?.user_id)
            .filter(Boolean);
          const dosenNama = (dosen as any).user?.full_name || "Dosen";

          if (mahasiswaUserIds.length > 0) {
            const { notifyMahasiswaTugasBaru } = await import(
              "@/lib/api/notification.api"
            );
            await notifyMahasiswaTugasBaru(
              mahasiswaUserIds,
              dosenNama,
              data.judul,
              result.id,
              data.kelas_id,
            );
            console.log(
              `[NOTIFICATION] ${mahasiswaUserIds.length} mahasiswa notified: New tugas "${data.judul}"`,
            );
          }
        }
      }
    } catch (notifError) {
      // Don't fail the creation if notification fails
      console.error("[NOTIFICATION] Failed to notify mahasiswa:", notifError);
    }

    return result;
  } catch (error) {
    console.error("❌ API createKuis error:", error);
    const apiError = handleError(error);
    logError(apiError, "createKuis");
    throw apiError;
  }
}

// 🔒 PROTECTED: Only dosen can create kuis
export const createKuis = requirePermission("manage:kuis", createKuisImpl);

// Internal implementation (unwrapped)
async function updateKuisImpl(
  id: string,
  data: Partial<CreateKuisData>,
): Promise<Kuis> {
  try {
    return await update<Kuis>("kuis", id, data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `updateKuis:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Only owner dosen can update kuis
export const updateKuis = requirePermissionAndOwnership(
  "manage:kuis",
  { table: "kuis", ownerField: "dosen_id" },
  0, // id is first argument
  updateKuisImpl,
);

// Internal implementation (unwrapped)
async function deleteKuisImpl(id: string): Promise<boolean> {
  try {
    return await remove("kuis", id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `deleteKuis:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Only owner dosen can delete kuis
export const deleteKuis = requirePermissionAndOwnership(
  "manage:kuis",
  { table: "kuis", ownerField: "dosen_id" },
  0, // id is first argument
  deleteKuisImpl,
);

export async function publishKuis(id: string): Promise<Kuis> {
  try {
    return await updateKuis(id, {
      status: "published",
    } as Partial<CreateKuisData>);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `publishKuis:${id}`);
    throw apiError;
  }
}

export async function unpublishKuis(id: string): Promise<Kuis> {
  try {
    return await updateKuis(id, { status: "draft" } as Partial<CreateKuisData>);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `unpublishKuis:${id}`);
    throw apiError;
  }
}

/**
 * Duplicate a quiz with all its questions
 * Internal implementation (unwrapped)
 */
async function duplicateKuisImpl(kuisId: string): Promise<Kuis> {
  try {
    const originalKuis = await getKuisById(kuisId);

    // Create new quiz data with type safety
    const newKuisData: any = {
      kelas_id: originalKuis.kelas_id,
      dosen_id: originalKuis.dosen_id,
      judul: `${originalKuis.judul} (Copy)`,
      deskripsi: originalKuis.deskripsi,
      tanggal_mulai: originalKuis.tanggal_mulai,
      tanggal_selesai: originalKuis.tanggal_selesai,
      max_attempts: originalKuis.max_attempts ?? 1,
      status: "draft",
    };

    // Add optional fields if they exist
    const origAny = originalKuis as any;
    if (origAny.durasi_menit !== undefined)
      newKuisData.durasi_menit = origAny.durasi_menit;
    if (origAny.durasi !== undefined) newKuisData.durasi = origAny.durasi;
    if (origAny.passing_grade !== undefined)
      newKuisData.passing_grade = origAny.passing_grade;
    if (origAny.passing_score !== undefined)
      newKuisData.passing_score = origAny.passing_score;
    if (origAny.show_results !== undefined)
      newKuisData.show_results = origAny.show_results;
    if (origAny.shuffle_questions !== undefined)
      newKuisData.shuffle_questions = origAny.shuffle_questions;
    if (origAny.tipe_kuis !== undefined)
      newKuisData.tipe_kuis = origAny.tipe_kuis;

    const newKuis = await createKuis(newKuisData as CreateKuisData);

    if (originalKuis.soal && originalKuis.soal.length > 0) {
      const questionPromises = originalKuis.soal.map((soal, index) => {
        const newSoalData: any = {
          kuis_id: newKuis.id,
          pertanyaan: soal.pertanyaan,
          tipe_soal: soal.tipe_soal,
          poin: soal.poin,
          urutan: index + 1,
        };

        // Add optional fields if they exist and are not null
        if (soal.opsi_jawaban !== null && soal.opsi_jawaban !== undefined) {
          newSoalData.opsi_jawaban = soal.opsi_jawaban;
        }
        if (soal.jawaban_benar !== null && soal.jawaban_benar !== undefined) {
          newSoalData.jawaban_benar = soal.jawaban_benar;
        }
        if (soal.penjelasan !== null && soal.penjelasan !== undefined) {
          newSoalData.penjelasan = soal.penjelasan;
        }

        return createSoal(newSoalData as CreateSoalData);
      });

      await Promise.all(questionPromises);
    }

    return await getKuisById(newKuis.id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `duplicateKuis:${kuisId}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Only owner dosen can duplicate kuis
export const duplicateKuis = requirePermissionAndOwnership(
  "manage:kuis",
  { table: "kuis", ownerField: "dosen_id" },
  0, // kuisId is first argument
  duplicateKuisImpl,
);

// ============================================================================
// SOAL (QUESTION) OPERATIONS
// ============================================================================

export async function getSoalByKuis(kuisId: string): Promise<Soal[]> {
  try {
    return await queryWithFilters<Soal>(
      "soal",
      [
        {
          column: "kuis_id",
          operator: "eq" as const,
          value: kuisId,
        },
      ],
      {
        order: {
          column: "urutan",
          ascending: true,
        },
      },
    );
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getSoalByKuis:${kuisId}`);
    throw apiError;
  }
}

export async function getSoalById(id: string): Promise<Soal> {
  try {
    return await getById<Soal>("soal", id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getSoalById:${id}`);
    throw apiError;
  }
}

// Internal implementation (unwrapped)
async function createSoalImpl(data: CreateSoalData): Promise<Soal> {
  try {
    const dbData: any = {
      kuis_id: data.kuis_id,
      tipe: data.tipe_soal,
      pertanyaan: data.pertanyaan,
      poin: data.poin,
      urutan: data.urutan,
    };

    if (data.opsi_jawaban !== undefined && data.opsi_jawaban !== null) {
      dbData.pilihan_jawaban = data.opsi_jawaban;
    }
    if (data.jawaban_benar !== undefined && data.jawaban_benar !== null) {
      dbData.jawaban_benar = data.jawaban_benar;
    }
    if (data.penjelasan !== undefined && data.penjelasan !== null) {
      dbData.pembahasan = data.penjelasan;
    }

    return await insert<Soal>("soal", dbData);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "createSoal");
    throw apiError;
  }
}

// 🔒 PROTECTED: Only dosen can create soal
export const createSoal = requirePermission("manage:soal", createSoalImpl);

// Internal implementation (unwrapped)
async function updateSoalImpl(
  id: string,
  data: Partial<CreateSoalData>,
): Promise<Soal> {
  try {
    const dbData: any = {};

    if (data.tipe_soal !== undefined) dbData.tipe = data.tipe_soal;
    if (data.pertanyaan !== undefined) dbData.pertanyaan = data.pertanyaan;
    if (data.poin !== undefined) dbData.poin = data.poin;
    if (data.urutan !== undefined) dbData.urutan = data.urutan;
    if (data.opsi_jawaban !== undefined)
      dbData.pilihan_jawaban = data.opsi_jawaban;
    if (data.jawaban_benar !== undefined)
      dbData.jawaban_benar = data.jawaban_benar;
    if (data.penjelasan !== undefined) dbData.pembahasan = data.penjelasan;

    return await update<Soal>("soal", id, dbData);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `updateSoal:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Only dosen can update soal
export const updateSoal = requirePermission("manage:soal", updateSoalImpl);

// Internal implementation (unwrapped)
async function deleteSoalImpl(id: string): Promise<boolean> {
  try {
    return await remove("soal", id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `deleteSoal:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Only dosen can delete soal
export const deleteSoal = requirePermission("manage:soal", deleteSoalImpl);

// Internal implementation (unwrapped)
async function reorderSoalImpl(
  kuisId: string,
  soalIds: string[],
): Promise<boolean> {
  try {
    const updates = soalIds.map((id, index) =>
      updateSoalImpl(id, { urutan: index + 1 }),
    );
    await Promise.all(updates);
    return true;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `reorderSoal:${kuisId}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Only dosen can reorder soal
export const reorderSoal = requirePermission("manage:soal", reorderSoalImpl);

// ============================================================================
// ATTEMPT OPERATIONS (MAHASISWA)
// ============================================================================

export async function getAttempts(
  filters?: AttemptFilters,
): Promise<AttemptKuis[]> {
  try {
    const filterConditions = [];

    if (filters?.kuis_id) {
      filterConditions.push({
        column: "kuis_id",
        operator: "eq" as const,
        value: filters.kuis_id,
      });
    }

    if (filters?.mahasiswa_id) {
      filterConditions.push({
        column: "mahasiswa_id",
        operator: "eq" as const,
        value: filters.mahasiswa_id,
      });
    }

    if (filters?.status) {
      filterConditions.push({
        column: "status",
        operator: "eq" as const,
        value: filters.status,
      });
    }

    // Note: is_synced filter removed - column doesn't exist in database schema
    // This field is only used for client-side state tracking

    const options = {
      select: `
        *,
        kuis:kuis_id (*),
        mahasiswa:mahasiswa_id (
          nim,
          users:user_id (
            full_name
          )
        ),
        jawaban:jawaban(*)
      `,
      order: {
        column: "started_at",
        ascending: false,
      },
    };

    return filterConditions.length > 0
      ? await queryWithFilters<AttemptKuis>(
          "attempt_kuis",
          filterConditions,
          options,
        )
      : await query<AttemptKuis>("attempt_kuis", options);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getAttempts");
    throw apiError;
  }
}

/**
 * Get all attempts for a specific quiz with student information
 * Used by dosen to view results
 */
export async function getAttemptsByKuis(
  kuisId: string,
): Promise<AttemptWithStudent[]> {
  try {
    const attempts = await queryWithFilters<AttemptWithStudent>(
      "attempt_kuis",
      [
        {
          column: "kuis_id",
          operator: "eq" as const,
          value: kuisId,
        },
      ],
      {
        select: `
        *,
        mahasiswa:mahasiswa_id (
          nim,
          users:user_id (
            full_name
          )
        ),
        jawaban:jawaban(*)
      `,
        order: {
          column: "started_at",
          ascending: false,
        },
      },
    );

    return attempts;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getAttemptsByKuis:${kuisId}`);
    throw apiError;
  }
}

export async function getAttemptById(id: string): Promise<AttemptKuis> {
  try {
    return await getById<AttemptKuis>("attempt_kuis", id, {
      select: `
        *,
        kuis:kuis_id (
          *,
          soal:soal(*)
        ),
        mahasiswa:mahasiswa_id (
          nim,
          users:user_id (
            full_name
          )
        ),
        jawaban:jawaban(*)
      `,
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getAttemptById:${id}`);
    throw apiError;
  }
}

// Internal implementation (unwrapped)
async function startAttemptImpl(data: StartAttemptData): Promise<AttemptKuis> {
  try {
    // Get all existing attempts for this quiz and mahasiswa
    const existingAttempts = await getAttempts({
      kuis_id: data.kuis_id,
      mahasiswa_id: data.mahasiswa_id,
    });

    // ✅ Check if there's an ongoing attempt (in_progress)
    const ongoingAttempt = existingAttempts.find(
      (attempt) => attempt.status === "in_progress"
    );

    if (ongoingAttempt) {
      console.log("✅ Resuming existing attempt:", ongoingAttempt.id);
      return ongoingAttempt; // Resume existing attempt
    }

    // ✅ Check max_attempts (if set)
    const quiz = await getKuisById(data.kuis_id);
    if (quiz.max_attempts && existingAttempts.length >= quiz.max_attempts) {
      throw new Error(
        `Anda sudah mencapai batas maksimal ${quiz.max_attempts} kali percobaan`
      );
    }

    // ✅ Create new attempt
    const attemptNumber = existingAttempts.length + 1;

    const attemptData = {
      kuis_id: data.kuis_id,
      mahasiswa_id: data.mahasiswa_id,
      attempt_number: attemptNumber,
      status: "in_progress" as const,
      started_at: new Date().toISOString(),
    };

    console.log("✅ Creating new attempt #", attemptNumber);

    try {
      return await insert<AttemptKuis>("attempt_kuis", attemptData);
    } catch (insertError: any) {
      // Handle duplicate attempt (race condition)
      if (insertError?.code === "CONFLICT" || insertError?.code === "23505") {
        console.log("⚠️ Attempt already exists, fetching existing attempt...");

        // Retry getting attempts (might be cache issue)
        const retryAttempts = await getAttempts({
          kuis_id: data.kuis_id,
          mahasiswa_id: data.mahasiswa_id,
        });

        const existingAttempt = retryAttempts.find(
          (attempt) => attempt.status === "in_progress"
        );

        if (existingAttempt) {
          console.log("✅ Found existing attempt:", existingAttempt.id);
          return existingAttempt;
        }
      }

      // If not a conflict error or can't find existing attempt, rethrow
      throw insertError;
    }
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "startAttempt");
    throw apiError;
  }
}

// 🔒 PROTECTED: Only mahasiswa can start attempt
export const startAttempt = requirePermission(
  "create:attempt_kuis",
  startAttemptImpl,
);

// Internal implementation (unwrapped)
// ✅ FASE 3 Week 4: Updated to use versioned API with optimistic locking
async function submitQuizImpl(data: SubmitQuizData): Promise<AttemptKuis> {
  try {
    // Import versioned wrapper dynamically to avoid circular dependency
    const { submitQuizSafe } = await import("./kuis-versioned-simple.api");

    // Use versioned wrapper - handles conflict auto-resolve
    return await submitQuizSafe(data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "submitQuiz");
    throw apiError;
  }
}

// 🔒 PROTECTED: Only mahasiswa can submit quiz
export const submitQuiz = requirePermission(
  "update:attempt_kuis",
  submitQuizImpl,
);

// ============================================================================
// JAWABAN (ANSWER) OPERATIONS
// ============================================================================

export async function getJawabanByAttempt(
  attemptId: string,
): Promise<Jawaban[]> {
  try {
    return await queryWithFilters<Jawaban>(
      "jawaban",
      [
        {
          column: "attempt_id",
          operator: "eq" as const,
          value: attemptId,
        },
      ],
      {
        select: `
        *,
        soal:soal_id (*)
      `,
      },
    );
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getJawabanByAttempt:${attemptId}`);
    throw apiError;
  }
}

// Internal implementation (unwrapped)
// ✅ FASE 3 Week 4: Updated to use versioned API with optimistic locking
async function submitAnswerImpl(data: SubmitAnswerData): Promise<Jawaban> {
  try {
    // Import versioned wrapper dynamically to avoid circular dependency
    const { submitAnswerSafe } = await import("./kuis-versioned-simple.api");

    // Use versioned wrapper - handles conflict auto-resolve
    return await submitAnswerSafe(data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "submitAnswer");
    throw apiError;
  }
}

// 🔒 PROTECTED: Only mahasiswa can submit answer
export const submitAnswer = requirePermission(
  "update:jawaban",
  submitAnswerImpl,
);

// Internal implementation (unwrapped)
// ✅ FASE 3 Week 4: Updated to use versioned API with conflict logging (manual resolution)
async function gradeAnswerImpl(
  id: string,
  poinDiperoleh: number,
  isCorrect: boolean,
  feedback?: string,
): Promise<Jawaban> {
  try {
    // Import simplified wrapper dynamically to avoid circular dependency
    const { gradeAnswerWithVersion } = await import("./kuis-versioned-simple.api");

    // Use simplified wrapper - direct database operation
    return await gradeAnswerWithVersion(
      id,
      poinDiperoleh,
      isCorrect,
      feedback,
    );
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `gradeAnswer:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Only dosen can grade answer
export const gradeAnswer = requirePermission(
  "grade:attempt_kuis",
  gradeAnswerImpl,
);

// ============================================================================
// MAHASISWA DASHBOARD OPERATIONS
// ============================================================================

/**
 * Helper: Get list of kelas IDs where mahasiswa is actively enrolled
 * Separate query to avoid PostgREST nested filter issues
 */
async function getEnrolledKelasIds(mahasiswaId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("kelas_mahasiswa")
    .select("kelas_id")
    .eq("mahasiswa_id", mahasiswaId)
    .eq("is_active", true); // ✅ FIX: Use is_active (boolean) instead of status (string)

  if (error) {
    console.error("Error fetching enrolled kelas:", error);
    return [];
  }

  return data?.map((row) => row.kelas_id) || [];
}

export async function getUpcomingQuizzes(
  mahasiswaId: string,
): Promise<UpcomingQuiz[]> {
  try {
    const now = new Date().toISOString();

    // ✅ STEP 1: Get enrolled kelas IDs (client-side filtering approach)
    const enrolledKelasIds = await getEnrolledKelasIds(mahasiswaId);

    if (enrolledKelasIds.length === 0) {
      // No enrolled classes = no quizzes
      return [];
    }

    // ✅ STEP 2: Fetch published quizzes (simplified query - no nested kelas_mahasiswa filter)
    const { data: quizzes, error } = await supabase
      .from("kuis")
      .select(
        `
        *,
        kelas:kelas_id (
          id,
          nama_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          )
        ),
        dosen:dosen_id (
          users:user_id (
            full_name
          ),
          gelar_depan,
          gelar_belakang
        ),
        soal:soal(*)
      `,
      )
      .eq("status", "published") // Only published quizzes
      .gte("tanggal_selesai", now)
      .order("tanggal_mulai", { ascending: true });

    if (error) throw error;
    if (!quizzes) return [];

    // ✅ STEP 3: Filter client-side by enrolled kelas
    const enrolledQuizzes = quizzes.filter((quiz) =>
      enrolledKelasIds.includes(quiz.kelas_id),
    );

    const upcomingQuizzes: UpcomingQuiz[] = await Promise.all(
      enrolledQuizzes.map(async (quiz) => {
        const attempts = await getAttempts({
          kuis_id: quiz.id,
          mahasiswa_id: mahasiswaId,
        });

        const totalSoal = quiz.soal?.length || 0;
        const attemptsUsed = attempts.length;
        const maxAttempts = quiz.max_attempts ?? 1;
        const canAttempt = attemptsUsed < maxAttempts;

        let status: "upcoming" | "ongoing" | "completed" | "missed";
        const startDate = new Date(quiz.tanggal_mulai);
        const endDate = new Date(quiz.tanggal_selesai);
        const nowDate = new Date();

        if (nowDate < startDate) {
          status = "upcoming";
        } else if (nowDate > endDate) {
          status = attemptsUsed > 0 ? "completed" : "missed";
        } else {
          status = "ongoing";
        }

        const bestScore =
          attempts.length > 0
            ? Math.max(...attempts.map((a) => a.total_poin ?? 0))
            : undefined;

        return {
          id: quiz.id,
          kelas_id: quiz.kelas_id,
          judul: quiz.judul,
          nama_mk: quiz.kelas?.mata_kuliah?.nama_mk || "",
          kode_mk: quiz.kelas?.mata_kuliah?.kode_mk || "",
          nama_kelas: quiz.kelas?.nama_kelas || "",
          dosen_name: quiz.dosen?.users?.full_name || "",
          tipe_kuis: (quiz as any).tipe_kuis ?? "campuran",
          durasi_menit: (quiz as any).durasi_menit ?? (quiz as any).durasi ?? 0,
          tanggal_mulai: quiz.tanggal_mulai,
          tanggal_selesai: quiz.tanggal_selesai,
          total_soal: totalSoal,
          attempts_used: attemptsUsed,
          max_attempts: maxAttempts,
          can_attempt: canAttempt,
          status: status,
          best_score: bestScore,
          last_attempt_at: attempts[0]?.started_at ?? null,
          passing_grade:
            (quiz as any).passing_grade ?? (quiz as any).passing_score ?? 70,
        };
      }),
    );

    return upcomingQuizzes;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getUpcomingQuizzes:${mahasiswaId}`);
    throw apiError;
  }
}

export async function getQuizStats(mahasiswaId: string): Promise<QuizStats> {
  try {
    const attempts = await getAttempts({
      mahasiswa_id: mahasiswaId,
      status: "graded",
    });

    const totalQuiz = attempts.length;
    const completedQuiz = attempts.filter((a) => a.status === "graded").length;
    const averageScore =
      totalQuiz > 0
        ? attempts.reduce((sum, a) => sum + (a.total_poin ?? 0), 0) / totalQuiz
        : 0;

    const upcoming = await getUpcomingQuizzes(mahasiswaId);
    const upcomingQuiz = upcoming.filter((q) => q.status === "upcoming").length;

    return {
      total_quiz: totalQuiz,
      completed_quiz: completedQuiz,
      average_score: averageScore,
      upcoming_quiz: upcomingQuiz,
    };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getQuizStats:${mahasiswaId}`);
    throw apiError;
  }
}

export async function getRecentQuizResults(
  mahasiswaId: string,
  limit: number = 5,
): Promise<RecentQuizResult[]> {
  try {
    const attempts = await getAttempts({
      mahasiswa_id: mahasiswaId,
      status: "graded",
    });

    const recentAttempts = attempts
      .filter((a) => a.submitted_at)
      .sort(
        (a, b) =>
          new Date(b.submitted_at!).getTime() -
          new Date(a.submitted_at!).getTime(),
      )
      .slice(0, limit);

    return recentAttempts.map((attempt) => ({
      id: attempt.kuis_id,
      attempt_id: attempt.id,
      judul: attempt.kuis?.judul || "",
      nama_mk: "",
      submitted_at: attempt.submitted_at || "",
      total_poin: attempt.total_poin ?? 0,
      max_poin: 100,
      percentage: ((attempt.total_poin ?? 0) / 100) * 100,
      status: attempt.status as "graded" | "pending",
      passed:
        (attempt.total_poin ?? 0) >=
        ((attempt.kuis as any)?.passing_grade ?? 70),
    }));
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getRecentQuizResults:${mahasiswaId}`);
    throw apiError;
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export async function canAttemptQuiz(
  kuisId: string,
  mahasiswaId: string,
): Promise<{ canAttempt: boolean; reason?: string }> {
  try {
    const quiz = await getKuisById(kuisId);

    const status = (quiz as any).status;
    if (status && status !== "published") {
      return { canAttempt: false, reason: "Kuis tidak aktif" };
    }

    const now = new Date();
    // ✅ If dates not set, allow attempt
    if (quiz.tanggal_mulai && quiz.tanggal_selesai) {
      const startDate = new Date(quiz.tanggal_mulai);
      const endDate = new Date(quiz.tanggal_selesai);

      if (now < startDate) {
        return { canAttempt: false, reason: "Kuis belum dimulai" };
      }

      if (now > endDate) {
        return { canAttempt: false, reason: "Kuis sudah berakhir" };
      }
    }

    const attempts = await getAttempts({
      kuis_id: kuisId,
      mahasiswa_id: mahasiswaId,
    });

    const maxAttempts = quiz.max_attempts ?? 1;
    if (attempts.length >= maxAttempts) {
      return {
        canAttempt: false,
        reason: `Maksimal ${maxAttempts} percobaan telah tercapai`,
      };
    }

    const inProgress = attempts.find((a) => a.status === "in_progress");
    if (inProgress) {
      return {
        canAttempt: false,
        reason: "Masih ada percobaan yang sedang berlangsung",
      };
    }

    return { canAttempt: true };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `canAttemptQuiz:${kuisId}:${mahasiswaId}`);
    return { canAttempt: false, reason: "Error checking attempt eligibility" };
  }
}

// ============================================================================
// OFFLINE SUPPORT
// ============================================================================

import { indexedDBManager } from "@/lib/offline/indexeddb";

/**
 * Store names for offline caching
 */
const OFFLINE_STORES = {
  QUIZ: "offline_quiz",
  QUESTIONS: "offline_questions",
  ANSWERS: "offline_answers",
  ATTEMPTS: "offline_attempts",
} as const;

/**
 * Cache quiz to IndexedDB for offline access
 */
export async function cacheQuizOffline(quiz: Kuis): Promise<void> {
  try {
    // Check if already cached
    const existing = await indexedDBManager.getById(OFFLINE_STORES.QUIZ, quiz.id);

    if (existing) {
      // Update existing cache
      await indexedDBManager.update(OFFLINE_STORES.QUIZ, quiz.id, {
        id: quiz.id,
        data: quiz,
        cachedAt: new Date().toISOString(),
      });
    } else {
      // Create new cache
      await indexedDBManager.create(OFFLINE_STORES.QUIZ, {
        id: quiz.id,
        data: quiz,
        cachedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to cache quiz offline:", error);
    // Don't throw - caching is not critical
  }
}

/**
 * Cache questions to IndexedDB for offline access
 */
export async function cacheQuestionsOffline(
  kuisId: string,
  questions: Soal[],
): Promise<void> {
  try {
    // Check if already cached
    const existing = await indexedDBManager.getById(OFFLINE_STORES.QUESTIONS, kuisId);

    if (existing) {
      // Update existing cache
      await indexedDBManager.update(OFFLINE_STORES.QUESTIONS, kuisId, {
        id: kuisId,
        data: questions,
        cachedAt: new Date().toISOString(),
      });
    } else {
      // Create new cache
      await indexedDBManager.create(OFFLINE_STORES.QUESTIONS, {
        id: kuisId,
        data: questions,
        cachedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to cache questions offline:", error);
    // Don't throw - caching is not critical
  }
}

/**
 * Get cached quiz from IndexedDB
 */
export async function getCachedQuiz(kuisId: string): Promise<Kuis | null> {
  try {
    const cached = await indexedDBManager.getById(OFFLINE_STORES.QUIZ, kuisId);
    return (cached as any)?.data || null;
  } catch (error) {
    console.error("Failed to get cached quiz:", error);
    return null;
  }
}

/**
 * Get cached questions from IndexedDB
 */
export async function getCachedQuestions(
  kuisId: string,
): Promise<Soal[] | null> {
  try {
    const cached = await indexedDBManager.getById(
      OFFLINE_STORES.QUESTIONS,
      kuisId,
    );
    return (cached as any)?.data || null;
  } catch (error) {
    console.error("Failed to get cached questions:", error);
    return null;
  }
}

/**
 * Save answer offline to IndexedDB
 */
export async function saveAnswerOffline(
  attemptId: string,
  soalId: string,
  jawaban: string,
): Promise<void> {
  try {
    const answerId = `${attemptId}_${soalId}`;
    await indexedDBManager.create(OFFLINE_STORES.ANSWERS, {
      id: answerId,
      attempt_id: attemptId,
      soal_id: soalId,
      jawaban,
      savedAt: new Date().toISOString(),
      synced: false,
    });
  } catch (error) {
    console.error("Failed to save answer offline:", error);
    throw error;
  }
}

/**
 * Get offline answers for an attempt
 */
export async function getOfflineAnswers(
  attemptId: string,
): Promise<Record<string, string>> {
  try {
    const allAnswers = await indexedDBManager.getAll(OFFLINE_STORES.ANSWERS);
    const attemptAnswers = allAnswers.filter(
      (answer: any) => answer.attempt_id === attemptId,
    );

    const answersMap: Record<string, string> = {};
    attemptAnswers.forEach((answer: any) => {
      answersMap[answer.soal_id] = answer.jawaban;
    });

    return answersMap;
  } catch (error) {
    console.error("Failed to get offline answers:", error);
    return {};
  }
}

/**
 * Cache attempt to IndexedDB
 */
export async function cacheAttemptOffline(attempt: AttemptKuis): Promise<void> {
  try {
    // Check if already cached
    const existing = await indexedDBManager.getById(OFFLINE_STORES.ATTEMPTS, attempt.id);

    if (existing) {
      // Update existing cache
      await indexedDBManager.update(OFFLINE_STORES.ATTEMPTS, attempt.id, {
        id: attempt.id,
        data: attempt,
        cachedAt: new Date().toISOString(),
      });
    } else {
      // Create new cache
      await indexedDBManager.create(OFFLINE_STORES.ATTEMPTS, {
        id: attempt.id,
        data: attempt,
        cachedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to cache attempt offline:", error);
    // Don't throw - caching is not critical
  }
}

/**
 * Get cached attempt from IndexedDB
 */
export async function getCachedAttempt(
  attemptId: string,
): Promise<AttemptKuis | null> {
  try {
    const cached = await indexedDBManager.getById(
      OFFLINE_STORES.ATTEMPTS,
      attemptId,
    );
    return (cached as any)?.data || null;
  } catch (error) {
    console.error("Failed to get cached attempt:", error);
    return null;
  }
}

/**
 * Offline-first getKuisById - tries cache first, falls back to API
 */
export async function getKuisByIdOffline(id: string): Promise<Kuis> {
  try {
    // Try API first
    const quiz = await getKuisById(id);

    // Cache for offline use
    await cacheQuizOffline(quiz);

    return quiz;
  } catch (error) {
    // If API fails, try cache
    const cachedQuiz = await getCachedQuiz(id);
    if (cachedQuiz) {
      console.log("Using cached quiz (offline)");
      return cachedQuiz;
    }

    // No cache available, rethrow error
    throw error;
  }
}

/**
 * Offline-first getSoalByKuis - tries cache first, falls back to API
 */
export async function getSoalByKuisOffline(kuisId: string): Promise<Soal[]> {
  try {
    // Try API first
    const questions = await getSoalByKuis(kuisId);

    // Cache for offline use
    await cacheQuestionsOffline(kuisId, questions);

    return questions;
  } catch (error) {
    // If API fails, try cache
    const cachedQuestions = await getCachedQuestions(kuisId);
    if (cachedQuestions) {
      console.log("Using cached questions (offline)");
      return cachedQuestions;
    }

    // No cache available, rethrow error
    throw error;
  }
}

/**
 * Offline-first submitAnswer - saves offline if no connection
 * ✅ FASE 3 Week 4: Uses versioned API for online saves
 */
export async function submitAnswerOffline(
  data: SubmitAnswerData,
): Promise<Jawaban | null> {
  try {
    // Try online save first (now with version check)
    return await submitAnswer(data);
  } catch (error) {
    // Save offline instead
    await saveAnswerOffline(data.attempt_id, data.soal_id, data.jawaban);
    console.log(
      "Answer saved offline, will sync when online with version check",
    );

    // Return a mock Jawaban object for offline saves
    return {
      id: `offline_${data.attempt_id}_${data.soal_id}`,
      attempt_id: data.attempt_id,
      soal_id: data.soal_id,
      jawaban: data.jawaban,
      is_synced: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Jawaban;
  }
}

/**
 * Sync offline answers to server
 * ✅ FASE 3 Week 4: Updated to use versioned API with optimistic locking
 */
export async function syncOfflineAnswers(attemptId: string): Promise<void> {
  try {
    const offlineAnswers = await getOfflineAnswers(attemptId);
    const answerIds = Object.keys(offlineAnswers);

    if (answerIds.length === 0) {
      console.log("No offline answers to sync");
      return;
    }

    console.log(
      `Syncing ${answerIds.length} offline answers with optimistic locking...`,
    );

    // Import versioned wrapper
    const { submitAnswerWithVersion } = await import("./kuis-versioned-simple.api");

    // Sync each answer with version check
    for (const soalId of answerIds) {
      try {
        const answerId = `${attemptId}_${soalId}`;
        const localAnswerData = await indexedDBManager.getById(
          OFFLINE_STORES.ANSWERS,
          answerId,
        );

        if (!localAnswerData) {
          console.warn(`Local answer ${answerId} not found`);
          continue;
        }

        // Use simplified wrapper - direct database operation
        const result = await submitAnswerWithVersion({
          attempt_id: attemptId,
          soal_id: soalId,
          jawaban: offlineAnswers[soalId],
        });

        if (result.success) {
          console.log(`[Synced] ${soalId}: Success`);
          // Delete from offline storage after successful sync
          await indexedDBManager.delete(OFFLINE_STORES.ANSWERS, answerId);
        } else {
          console.warn(`[Failed] ${soalId}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Failed to sync answer ${soalId}:`, error);
        // Continue with other answers
      }
    }

    console.log("Offline answers synced successfully");
  } catch (error) {
    console.error("Failed to sync offline answers:", error);
    throw error;
  }
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export const kuisApi = {
  getAll: (filters?: KuisFilters) => withApiResponse(() => getKuis(filters)),
  getById: (id: string) => withApiResponse(() => getKuisById(id)),
  getByKelas: (kelasId: string) =>
    withApiResponse(() => getKuisByKelas(kelasId)),
  create: (data: CreateKuisData) => withApiResponse(() => createKuis(data)),
  update: (id: string, data: Partial<CreateKuisData>) =>
    withApiResponse(() => updateKuis(id, data)),
  delete: (id: string) => withApiResponse(() => deleteKuis(id)),
  publish: (id: string) => withApiResponse(() => publishKuis(id)),
  unpublish: (id: string) => withApiResponse(() => unpublishKuis(id)),
  duplicate: (id: string) => withApiResponse(() => duplicateKuis(id)),
  getSoal: (kuisId: string) => withApiResponse(() => getSoalByKuis(kuisId)),
  getSoalById: (id: string) => withApiResponse(() => getSoalById(id)),
  createSoal: (data: CreateSoalData) => withApiResponse(() => createSoal(data)),
  updateSoal: (id: string, data: Partial<CreateSoalData>) =>
    withApiResponse(() => updateSoal(id, data)),
  deleteSoal: (id: string) => withApiResponse(() => deleteSoal(id)),
  reorderSoal: (kuisId: string, soalIds: string[]) =>
    withApiResponse(() => reorderSoal(kuisId, soalIds)),
  getAttempts: (filters?: AttemptFilters) =>
    withApiResponse(() => getAttempts(filters)),
  getAttemptsByKuis: (kuisId: string) =>
    withApiResponse(() => getAttemptsByKuis(kuisId)),
  getAttemptById: (id: string) => withApiResponse(() => getAttemptById(id)),
  startAttempt: (data: StartAttemptData) =>
    withApiResponse(() => startAttempt(data)),
  submitQuiz: (data: SubmitQuizData) => withApiResponse(() => submitQuiz(data)),
  getJawaban: (attemptId: string) =>
    withApiResponse(() => getJawabanByAttempt(attemptId)),
  submitAnswer: (data: SubmitAnswerData) =>
    withApiResponse(() => submitAnswer(data)),
  gradeAnswer: (
    id: string,
    poinDiperoleh: number,
    isCorrect: boolean,
    feedback?: string,
  ) =>
    withApiResponse(() => gradeAnswer(id, poinDiperoleh, isCorrect, feedback)),
  getUpcomingQuizzes: (mahasiswaId: string) =>
    withApiResponse(() => getUpcomingQuizzes(mahasiswaId)),
  getQuizStats: (mahasiswaId: string) =>
    withApiResponse(() => getQuizStats(mahasiswaId)),
  getRecentResults: (mahasiswaId: string, limit?: number) =>
    withApiResponse(() => getRecentQuizResults(mahasiswaId, limit)),
  canAttemptQuiz: (kuisId: string, mahasiswaId: string) =>
    withApiResponse(() => canAttemptQuiz(kuisId, mahasiswaId)),
};

// Compatibility alias
export const submitKuisAttempt = submitQuiz;
