/**
 * KuisResultPage (Tugas Praktikum) - Task Result Page for Mahasiswa
 *
 * Purpose: Display task results after submission
 * Features:
 * - Load task attempt with answers
 * - Auto-grade MC/TF questions
 * - Display score and detailed review
 * - Handle navigation (back, retake)
 * - Show manual grading pending state
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
 *
 * Route: /mahasiswa/kuis/:kuisId/result/:attemptId
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2, WifiOff } from "lucide-react";
import { QuizResult } from "@/components/features/kuis/result/QuizResult";
import { CardListSkeleton } from "@/components/common";
import {
  getAttemptByIdForMahasiswa,
  canAttemptQuiz,
  cacheAttemptOffline,
  getCachedAttempt,
  getCachedQuiz,
  getCachedQuestions,
  getOfflineAnswers,
  syncPendingOfflineQuizSubmission,
} from "@/lib/api/kuis.api";
import logger from "@/lib/utils/logger";
// ✅ SECURITY FIX: Import secure API to show jawaban_benar in results
import { getSoalForResult } from "@/lib/api/kuis-secure.api";
import { useAuth } from "@/lib/hooks/useAuth";
import type { AttemptKuis, Soal, Jawaban, Kuis } from "@/types/kuis.types";

// ============================================================================
// COMPONENT
// ============================================================================

export default function KuisResultPage() {
  const { kuisId, attemptId } = useParams<{
    kuisId: string;
    attemptId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Kuis | null>(null);
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [answers, setAnswers] = useState<Jawaban[]>([]);
  const [attempt, setAttempt] = useState<AttemptKuis | null>(null);
  const [canRetake, setCanRetake] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load attempt data and auto-grade if needed
   */
  useEffect(() => {
    if (!attemptId || !kuisId || !user) return;

    loadAttemptData();
  }, [attemptId, kuisId, user]);

  /**
   * Check if can retake quiz
   */
  useEffect(() => {
    if (!kuisId || !user?.mahasiswa?.id) return;

    checkCanRetake();
  }, [kuisId, user?.mahasiswa?.id]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Load attempt data from API
   */
  async function loadAttemptData() {
    if (!attemptId) return;

    try {
      setLoading(true);
      setError(null);

      const cachedAttempt = await getCachedAttempt(attemptId);

      if (!navigator.onLine) {
        if (!cachedAttempt) {
          throw new Error(
            "Perangkat sedang offline dan hasil tugas praktikum ini belum pernah disimpan di perangkat.",
          );
        }

        const cachedQuiz =
          ((cachedAttempt.kuis as Kuis | undefined) ?? null) ||
          (kuisId ? await getCachedQuiz(kuisId) : null);

        if (!cachedQuiz) {
          throw new Error(
            "Perangkat sedang offline dan detail tugas praktikum belum tersedia di penyimpanan lokal.",
          );
        }

        const cachedQuestions =
          (await getCachedQuestions(cachedQuiz.id)) ||
          ((cachedQuiz.soal as Soal[]) ?? []);

        const cachedAnswers =
          ((cachedAttempt.jawaban as Jawaban[] | undefined) ?? []).length > 0
            ? ((cachedAttempt.jawaban as Jawaban[]) ?? [])
            : await Promise.all(
                Object.entries(await getOfflineAnswers(attemptId)).map(
                  async ([soalId, jawaban]) =>
                    ({
                      id: `${attemptId}-${soalId}`,
                      attempt_id: attemptId,
                      soal_id: soalId,
                      jawaban_mahasiswa: jawaban,
                      jawaban,
                      poin_diperoleh: null,
                      is_correct: null,
                      feedback: null,
                      is_synced: false,
                    }) as Jawaban,
                ),
              );

        setAttempt(cachedAttempt);
        setQuiz(cachedQuiz);
        setQuestions(cachedQuestions);
        setAnswers(cachedAnswers);
        setIsOfflineData(true);
        return;
      }

      if (cachedAttempt?.offline_submit_pending) {
        try {
          await syncPendingOfflineQuizSubmission(attemptId);
        } catch (syncError) {
          logger.debug(
            "Pending offline submission belum berhasil disinkronkan, menampilkan cache lokal:",
            syncError,
          );

          const cachedQuiz =
            ((cachedAttempt.kuis as Kuis | undefined) ?? null) ||
            (kuisId ? await getCachedQuiz(kuisId) : null);
          const cachedQuestions =
            (await getCachedQuestions(kuisId || "")) ||
            ((cachedQuiz?.soal as Soal[]) ?? []);
          const cachedAnswers =
            ((cachedAttempt.jawaban as Jawaban[] | undefined) ?? []).length > 0
              ? ((cachedAttempt.jawaban as Jawaban[]) ?? [])
              : await Promise.all(
                  Object.entries(await getOfflineAnswers(attemptId)).map(
                    async ([soalId, jawaban]) =>
                      ({
                        id: `${attemptId}-${soalId}`,
                        attempt_id: attemptId,
                        soal_id: soalId,
                        jawaban_mahasiswa: jawaban,
                        jawaban,
                        poin_diperoleh: null,
                        is_correct: null,
                        feedback: null,
                        is_synced: false,
                      }) as Jawaban,
                  ),
                );

          if (cachedQuiz) {
            setAttempt(cachedAttempt);
            setQuiz(cachedQuiz);
            setQuestions(cachedQuestions);
            setAnswers(cachedAnswers);
            setIsOfflineData(true);
            return;
          }
        }
      }

      // Load attempt with all related data
      const attemptData = await getAttemptByIdForMahasiswa(attemptId);

      // Source of truth: laporan/CBT follows quiz.tipe_kuis.
      // Fallback to question structure only for legacy data.
      const quizMeta = attemptData.kuis as Kuis;
      const isLaporanMode =
        quizMeta?.tipe_kuis === "essay" ||
        (!quizMeta?.tipe_kuis &&
          (quizMeta?.soal?.every(
            (s: any) =>
              s.tipe_soal === "file_upload" || s.tipe_soal === "essay",
          ) ??
            false));

      // Block results access before submission (unless it's laporan mode)
      if ((attemptData as any).status === "in_progress" && !isLaporanMode) {
        setError(
          "Tugas praktikum belum disubmit. Silakan kembali dan submit dulu.",
        );
        return;
      }

      // Extract data
      const quizData = attemptData.kuis as Kuis;
      const answersData = (attemptData.jawaban as Jawaban[]) || [];

      // ✅ SECURITY FIX: Load questions WITH jawaban_benar for showing correct answers
      let questionsData: Soal[];
      try {
        // Use secure API to get questions WITH jawaban_benar
        questionsData = await getSoalForResult(quizData.id);
        logger.debug("✅ Loaded soal with jawaban_benar for results");
      } catch (err) {
        // Fallback to data from attempt if API fails
        logger.debug(
          "⚠️ Failed to load soal for result, using attempt data:",
          err,
        );
        questionsData = (quizData.soal as Soal[]) || [];
      }

      await cacheAttemptOffline(attemptData);
      setAttempt(attemptData);
      setQuiz(quizData);
      setQuestions(questionsData);
      setAnswers(answersData);
      setIsOfflineData(false);
    } catch (err) {
      console.error("Error loading attempt:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat hasil tugas praktikum",
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * Check if student can retake the quiz
   */
  async function checkCanRetake() {
    if (!kuisId || !user?.mahasiswa?.id) return;

    if (!navigator.onLine) {
      setCanRetake(false);
      return;
    }

    try {
      const result = await canAttemptQuiz(kuisId, user.mahasiswa.id);
      setCanRetake(result.canAttempt);
    } catch (err) {
      console.error("Error checking retake eligibility:", err);
      setCanRetake(false);
    }
  }

  /**
   * Navigate back to quiz list
   */
  function handleBack() {
    navigate("/mahasiswa/kuis");
  }

  /**
   * Navigate to retake quiz
   */
  function handleRetake() {
    if (!kuisId) return;
    navigate(`/mahasiswa/kuis/${kuisId}/attempt`);
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state
  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell rounded-2xl p-5">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-[120px] animate-pulse rounded-xl bg-muted" />
          <div className="h-[120px] animate-pulse rounded-xl bg-muted" />
          <div className="h-[120px] animate-pulse rounded-xl bg-muted" />
        </div>
        <CardListSkeleton count={3} />
      </div>
    );
  }

  // Error state
  if (error || !quiz || !attempt) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Hasil tugas praktikum tidak ditemukan"}
          </AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Tugas
          </Button>
        </div>
      </div>
    );
  }

  // Success state - show results
  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {isOfflineData && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Hasil tugas praktikum ini sedang ditampilkan dari snapshot lokal
            perangkat karena koneksi offline.
          </AlertDescription>
        </Alert>
      )}
      <QuizResult
        quiz={quiz}
        questions={questions}
        answers={answers}
        attempt={attempt}
        onBack={handleBack}
        onRetake={!isOfflineData && canRetake ? handleRetake : undefined}
        canRetake={!isOfflineData && canRetake}
      />
    </div>
  );
}
