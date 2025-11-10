/**
 * Kuis API - COMPLETE FIXED VERSION
 * Fixed type mismatches between API and type definitions
 * Added missing functions: getAttemptsByKuis and duplicateKuis
 */

import {
  query,
  queryWithFilters,
  getById,
  insert,
  update,
  remove,
  withApiResponse,
} from './base.api';
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
} from '@/types/kuis.types';
import { handleError, logError } from '@/lib/utils/errors';

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
        column: 'kelas_id',
        operator: 'eq' as const,
        value: filters.kelas_id,
      });
    }

    if (filters?.dosen_id) {
      filterConditions.push({
        column: 'dosen_id',
        operator: 'eq' as const,
        value: filters.dosen_id,
      });
    }

    if (filters?.status) {
      filterConditions.push({
        column: 'status',
        operator: 'eq' as const,
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
          user:user_id (
            full_name
          ),
          gelar_depan,
          gelar_belakang
        )
      `,
      order: {
        column: 'tanggal_mulai',
        ascending: false,
      },
    };

    const data = filterConditions.length > 0
      ? await queryWithFilters<Kuis>('kuis', filterConditions, options)
      : await query<Kuis>('kuis', options);

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      return data.filter((k) =>
        k.judul.toLowerCase().includes(searchLower) ||
        k.deskripsi?.toLowerCase().includes(searchLower)
      );
    }

    return data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, 'getKuis');
    throw apiError;
  }
}

export async function getKuisById(id: string): Promise<Kuis> {
  try {
    return await getById<Kuis>('kuis', id, {
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
          user:user_id (
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

export async function createKuis(data: CreateKuisData): Promise<Kuis> {
  try {
    return await insert<Kuis>('kuis', data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, 'createKuis');
    throw apiError;
  }
}

export async function updateKuis(
  id: string,
  data: Partial<CreateKuisData>
): Promise<Kuis> {
  try {
    return await update<Kuis>('kuis', id, data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `updateKuis:${id}`);
    throw apiError;
  }
}

export async function deleteKuis(id: string): Promise<boolean> {
  try {
    return await remove('kuis', id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `deleteKuis:${id}`);
    throw apiError;
  }
}

export async function publishKuis(id: string): Promise<Kuis> {
  try {
    return await updateKuis(id, { status: 'published' } as Partial<CreateKuisData>);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `publishKuis:${id}`);
    throw apiError;
  }
}

export async function unpublishKuis(id: string): Promise<Kuis> {
  try {
    return await updateKuis(id, { status: 'draft' } as Partial<CreateKuisData>);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `unpublishKuis:${id}`);
    throw apiError;
  }
}

/**
 * Duplicate a quiz with all its questions
 */
export async function duplicateKuis(kuisId: string): Promise<Kuis> {
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
      status: 'draft',
    };

    // Add optional fields if they exist
    const origAny = originalKuis as any;
    if (origAny.durasi_menit !== undefined) newKuisData.durasi_menit = origAny.durasi_menit;
    if (origAny.durasi !== undefined) newKuisData.durasi = origAny.durasi;
    if (origAny.passing_grade !== undefined) newKuisData.passing_grade = origAny.passing_grade;
    if (origAny.passing_score !== undefined) newKuisData.passing_score = origAny.passing_score;
    if (origAny.show_results !== undefined) newKuisData.show_results = origAny.show_results;
    if (origAny.shuffle_questions !== undefined) newKuisData.shuffle_questions = origAny.shuffle_questions;
    if (origAny.tipe_kuis !== undefined) newKuisData.tipe_kuis = origAny.tipe_kuis;

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

// ============================================================================
// SOAL (QUESTION) OPERATIONS
// ============================================================================

export async function getSoalByKuis(kuisId: string): Promise<Soal[]> {
  try {
    return await queryWithFilters<Soal>('soal', [
      {
        column: 'kuis_id',
        operator: 'eq' as const,
        value: kuisId,
      },
    ], {
      order: {
        column: 'urutan',
        ascending: true,
      },
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getSoalByKuis:${kuisId}`);
    throw apiError;
  }
}

export async function getSoalById(id: string): Promise<Soal> {
  try {
    return await getById<Soal>('soal', id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getSoalById:${id}`);
    throw apiError;
  }
}

export async function createSoal(data: CreateSoalData): Promise<Soal> {
  try {
    return await insert<Soal>('soal', data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, 'createSoal');
    throw apiError;
  }
}

export async function updateSoal(
  id: string,
  data: Partial<CreateSoalData>
): Promise<Soal> {
  try {
    return await update<Soal>('soal', id, data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `updateSoal:${id}`);
    throw apiError;
  }
}

export async function deleteSoal(id: string): Promise<boolean> {
  try {
    return await remove('soal', id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `deleteSoal:${id}`);
    throw apiError;
  }
}

export async function reorderSoal(
  kuisId: string,
  soalIds: string[]
): Promise<boolean> {
  try {
    const updates = soalIds.map((id, index) =>
      updateSoal(id, { urutan: index + 1 })
    );
    await Promise.all(updates);
    return true;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `reorderSoal:${kuisId}`);
    throw apiError;
  }
}

// ============================================================================
// ATTEMPT OPERATIONS (MAHASISWA)
// ============================================================================

export async function getAttempts(filters?: AttemptFilters): Promise<AttemptKuis[]> {
  try {
    const filterConditions = [];

    if (filters?.kuis_id) {
      filterConditions.push({
        column: 'kuis_id',
        operator: 'eq' as const,
        value: filters.kuis_id,
      });
    }

    if (filters?.mahasiswa_id) {
      filterConditions.push({
        column: 'mahasiswa_id',
        operator: 'eq' as const,
        value: filters.mahasiswa_id,
      });
    }

    if (filters?.status) {
      filterConditions.push({
        column: 'status',
        operator: 'eq' as const,
        value: filters.status,
      });
    }

    if (filters?.is_synced !== undefined) {
      filterConditions.push({
        column: 'is_synced',
        operator: 'eq' as const,
        value: filters.is_synced,
      });
    }

    const options = {
      select: `
        *,
        kuis:kuis_id (*),
        mahasiswa:mahasiswa_id (
          nim,
          user:user_id (
            full_name
          )
        ),
        jawaban:jawaban(*)
      `,
      order: {
        column: 'started_at',
        ascending: false,
      },
    };

    return filterConditions.length > 0
      ? await queryWithFilters<AttemptKuis>('attempt_kuis', filterConditions, options)
      : await query<AttemptKuis>('attempt_kuis', options);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, 'getAttempts');
    throw apiError;
  }
}

/**
 * Get all attempts for a specific quiz with student information
 * Used by dosen to view results
 */
export async function getAttemptsByKuis(kuisId: string): Promise<AttemptWithStudent[]> {
  try {
    const attempts = await queryWithFilters<AttemptWithStudent>('attempt_kuis', [
      {
        column: 'kuis_id',
        operator: 'eq' as const,
        value: kuisId,
      },
    ], {
      select: `
        *,
        mahasiswa:mahasiswa_id (
          nim,
          user:user_id (
            full_name
          )
        ),
        jawaban:jawaban(*)
      `,
      order: {
        column: 'started_at',
        ascending: false,
      },
    });

    return attempts;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getAttemptsByKuis:${kuisId}`);
    throw apiError;
  }
}

export async function getAttemptById(id: string): Promise<AttemptKuis> {
  try {
    return await getById<AttemptKuis>('attempt_kuis', id, {
      select: `
        *,
        kuis:kuis_id (
          *,
          soal:soal(*)
        ),
        mahasiswa:mahasiswa_id (
          nim,
          user:user_id (
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

export async function startAttempt(data: StartAttemptData): Promise<AttemptKuis> {
  try {
    const existingAttempts = await getAttempts({
      kuis_id: data.kuis_id,
      mahasiswa_id: data.mahasiswa_id,
    });

    const attemptNumber = existingAttempts.length + 1;

    const attemptData = {
      kuis_id: data.kuis_id,
      mahasiswa_id: data.mahasiswa_id,
      attempt_number: attemptNumber,
      status: 'in_progress' as const,
      started_at: new Date().toISOString(),
    };

    return await insert<AttemptKuis>('attempt_kuis', attemptData);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, 'startAttempt');
    throw apiError;
  }
}

export async function submitQuiz(data: SubmitQuizData): Promise<AttemptKuis> {
  try {
    const updateData = {
      status: 'submitted' as const,
      submitted_at: new Date().toISOString(),
      sisa_waktu: data.sisa_waktu,
    };

    return await update<AttemptKuis>('attempt_kuis', data.attempt_id, updateData);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, 'submitQuiz');
    throw apiError;
  }
}

// ============================================================================
// JAWABAN (ANSWER) OPERATIONS
// ============================================================================

export async function getJawabanByAttempt(attemptId: string): Promise<Jawaban[]> {
  try {
    return await queryWithFilters<Jawaban>('jawaban', [
      {
        column: 'attempt_id',
        operator: 'eq' as const,
        value: attemptId,
      },
    ], {
      select: `
        *,
        soal:soal_id (*)
      `,
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getJawabanByAttempt:${attemptId}`);
    throw apiError;
  }
}

export async function submitAnswer(data: SubmitAnswerData): Promise<Jawaban> {
  try {
    const existing = await queryWithFilters<Jawaban>('jawaban', [
      {
        column: 'attempt_id',
        operator: 'eq' as const,
        value: data.attempt_id,
      },
      {
        column: 'soal_id',
        operator: 'eq' as const,
        value: data.soal_id,
      },
    ]);

    const jawabanData = {
      attempt_id: data.attempt_id,
      soal_id: data.soal_id,
      jawaban: data.jawaban,
      is_synced: true,
    };

    if (existing.length > 0) {
      return await update<Jawaban>('jawaban', existing[0].id, jawabanData);
    } else {
      return await insert<Jawaban>('jawaban', jawabanData);
    }
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, 'submitAnswer');
    throw apiError;
  }
}

export async function gradeAnswer(
  id: string,
  poinDiperoleh: number,
  isCorrect: boolean,
  feedback?: string
): Promise<Jawaban> {
  try {
    const updateData = {
      poin_diperoleh: poinDiperoleh,
      is_correct: isCorrect,
      feedback: feedback,
    };

    return await update<Jawaban>('jawaban', id, updateData);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `gradeAnswer:${id}`);
    throw apiError;
  }
}

// ============================================================================
// MAHASISWA DASHBOARD OPERATIONS
// ============================================================================

export async function getUpcomingQuizzes(mahasiswaId: string): Promise<UpcomingQuiz[]> {
  try {
    const now = new Date().toISOString();
    
    const quizzes = await queryWithFilters<Kuis>('kuis', [
      {
        column: 'tanggal_selesai',
        operator: 'gte' as const,
        value: now,
      },
    ], {
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
          user:user_id (
            full_name
          ),
          gelar_depan,
          gelar_belakang
        ),
        soal:soal(*)
      `,
      order: {
        column: 'tanggal_mulai',
        ascending: true,
      },
    });

    const upcomingQuizzes: UpcomingQuiz[] = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = await getAttempts({
          kuis_id: quiz.id,
          mahasiswa_id: mahasiswaId,
        });

        const totalSoal = quiz.soal?.length || 0;
        const attemptsUsed = attempts.length;
        const maxAttempts = quiz.max_attempts ?? 1;
        const canAttempt = attemptsUsed < maxAttempts;

        let status: 'upcoming' | 'ongoing' | 'completed' | 'missed';
        const startDate = new Date(quiz.tanggal_mulai);
        const endDate = new Date(quiz.tanggal_selesai);
        const nowDate = new Date();

        if (nowDate < startDate) {
          status = 'upcoming';
        } else if (nowDate > endDate) {
          status = attemptsUsed > 0 ? 'completed' : 'missed';
        } else {
          status = 'ongoing';
        }

        const bestScore = attempts.length > 0
          ? Math.max(...attempts.map((a) => a.total_poin ?? 0))
          : undefined;

        return {
          id: quiz.id,
          kelas_id: quiz.kelas_id,
          judul: quiz.judul,
          nama_mk: quiz.kelas?.mata_kuliah?.nama_mk || '',
          kode_mk: quiz.kelas?.mata_kuliah?.kode_mk || '',
          nama_kelas: quiz.kelas?.nama_kelas || '',
          dosen_name: quiz.dosen?.user?.full_name || quiz.dosen?.full_name || '',
          tipe_kuis: (quiz as any).tipe_kuis ?? 'campuran',
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
          passing_grade: (quiz as any).passing_grade ?? (quiz as any).passing_score ?? 70,
        };
      })
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
      status: 'graded',
    });

    const totalQuiz = attempts.length;
    const completedQuiz = attempts.filter((a) => a.status === 'graded').length;
    const averageScore = totalQuiz > 0
      ? attempts.reduce((sum, a) => sum + (a.total_poin ?? 0), 0) / totalQuiz
      : 0;

    const upcoming = await getUpcomingQuizzes(mahasiswaId);
    const upcomingQuiz = upcoming.filter((q) => q.status === 'upcoming').length;

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
  limit: number = 5
): Promise<RecentQuizResult[]> {
  try {
    const attempts = await getAttempts({
      mahasiswa_id: mahasiswaId,
      status: 'graded',
    });

    const recentAttempts = attempts
      .filter((a) => a.submitted_at)
      .sort((a, b) => 
        new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime()
      )
      .slice(0, limit);

    return recentAttempts.map((attempt) => ({
      id: attempt.kuis_id,
      attempt_id: attempt.id,
      judul: attempt.kuis?.judul || '',
      nama_mk: '',
      submitted_at: attempt.submitted_at || '',
      total_poin: attempt.total_poin ?? 0,
      max_poin: 100,
      percentage: ((attempt.total_poin ?? 0) / 100) * 100,
      status: attempt.status as 'graded' | 'pending',
      passed: (attempt.total_poin ?? 0) >= ((attempt.kuis as any)?.passing_grade ?? 70),
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
  mahasiswaId: string
): Promise<{ canAttempt: boolean; reason?: string }> {
  try {
    const quiz = await getKuisById(kuisId);

    const status = (quiz as any).status;
    if (status && status !== 'published') {
      return { canAttempt: false, reason: 'Kuis tidak aktif' };
    }

    const now = new Date();
    const startDate = new Date(quiz.tanggal_mulai);
    const endDate = new Date(quiz.tanggal_selesai);

    if (now < startDate) {
      return { canAttempt: false, reason: 'Kuis belum dimulai' };
    }

    if (now > endDate) {
      return { canAttempt: false, reason: 'Kuis sudah berakhir' };
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

    const inProgress = attempts.find((a) => a.status === 'in_progress');
    if (inProgress) {
      return {
        canAttempt: false,
        reason: 'Masih ada percobaan yang sedang berlangsung',
      };
    }

    return { canAttempt: true };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `canAttemptQuiz:${kuisId}:${mahasiswaId}`);
    return { canAttempt: false, reason: 'Error checking attempt eligibility' };
  }
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export const kuisApi = {
  getAll: (filters?: KuisFilters) =>
    withApiResponse(() => getKuis(filters)),
  getById: (id: string) =>
    withApiResponse(() => getKuisById(id)),
  getByKelas: (kelasId: string) =>
    withApiResponse(() => getKuisByKelas(kelasId)),
  create: (data: CreateKuisData) =>
    withApiResponse(() => createKuis(data)),
  update: (id: string, data: Partial<CreateKuisData>) =>
    withApiResponse(() => updateKuis(id, data)),
  delete: (id: string) =>
    withApiResponse(() => deleteKuis(id)),
  publish: (id: string) =>
    withApiResponse(() => publishKuis(id)),
  unpublish: (id: string) =>
    withApiResponse(() => unpublishKuis(id)),
  duplicate: (id: string) =>
    withApiResponse(() => duplicateKuis(id)),
  getSoal: (kuisId: string) =>
    withApiResponse(() => getSoalByKuis(kuisId)),
  getSoalById: (id: string) =>
    withApiResponse(() => getSoalById(id)),
  createSoal: (data: CreateSoalData) =>
    withApiResponse(() => createSoal(data)),
  updateSoal: (id: string, data: Partial<CreateSoalData>) =>
    withApiResponse(() => updateSoal(id, data)),
  deleteSoal: (id: string) =>
    withApiResponse(() => deleteSoal(id)),
  reorderSoal: (kuisId: string, soalIds: string[]) =>
    withApiResponse(() => reorderSoal(kuisId, soalIds)),
  getAttempts: (filters?: AttemptFilters) =>
    withApiResponse(() => getAttempts(filters)),
  getAttemptsByKuis: (kuisId: string) =>
    withApiResponse(() => getAttemptsByKuis(kuisId)),
  getAttemptById: (id: string) =>
    withApiResponse(() => getAttemptById(id)),
  startAttempt: (data: StartAttemptData) =>
    withApiResponse(() => startAttempt(data)),
  submitQuiz: (data: SubmitQuizData) =>
    withApiResponse(() => submitQuiz(data)),
  getJawaban: (attemptId: string) =>
    withApiResponse(() => getJawabanByAttempt(attemptId)),
  submitAnswer: (data: SubmitAnswerData) =>
    withApiResponse(() => submitAnswer(data)),
  gradeAnswer: (id: string, poinDiperoleh: number, isCorrect: boolean, feedback?: string) =>
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