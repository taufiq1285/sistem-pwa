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
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { QuizResult } from "@/components/features/kuis/result/QuizResult";
import {
  getAttemptByIdForMahasiswa,
  canAttemptQuiz,
  gradeAnswer as gradeAnswerApi,
} from "@/lib/api/kuis.api";
// ✅ SECURITY FIX: Import secure API to show jawaban_benar in results
import { getSoalForResult } from "@/lib/api/kuis-secure.api";
import { gradeAnswer, canAutoGrade } from "@/lib/utils/quiz-scoring";
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
  const [grading, setGrading] = useState(false);

  const [quiz, setQuiz] = useState<Kuis | null>(null);
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [answers, setAnswers] = useState<Jawaban[]>([]);
  const [attempt, setAttempt] = useState<AttemptKuis | null>(null);
  const [canRetake, setCanRetake] = useState(false);

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

      // Load attempt with all related data
      const attemptData = await getAttemptByIdForMahasiswa(attemptId);

      // Block results access before submission
      if ((attemptData as any).status === "in_progress") {
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
        console.log("✅ Loaded soal with jawaban_benar for results");
      } catch (err) {
        // Fallback to data from attempt if API fails
        console.warn(
          "⚠️ Failed to load soal for result, using attempt data:",
          err,
        );
        questionsData = (quizData.soal as Soal[]) || [];
      }

      setAttempt(attemptData);
      setQuiz(quizData);
      setQuestions(questionsData);
      setAnswers(answersData);

      // Auto-grade if needed
      await autoGradeAnswers(questionsData, answersData);
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
   * Auto-grade MC/TF questions that haven't been graded yet
   */
  async function autoGradeAnswers(
    questionsData: Soal[],
    answersData: Jawaban[],
  ) {
    try {
      setGrading(true);

      const gradingPromises: Promise<Jawaban>[] = [];

      answersData.forEach((jawaban) => {
        // Skip if already graded
        if (
          jawaban.poin_diperoleh !== null &&
          jawaban.poin_diperoleh !== undefined
        ) {
          return;
        }

        // Find question
        const soal = questionsData.find((q) => q.id === jawaban.soal_id);
        if (!soal) return;

        // Skip if can't auto-grade (Essay/Short Answer)
        if (!canAutoGrade([soal])) {
          return;
        }

        // Grade the answer
        const result = gradeAnswer(soal, jawaban.jawaban || "");

        // Save to database
        const promise = gradeAnswerApi(
          jawaban.id,
          result.poin_diperoleh,
          result.is_correct,
          result.feedback,
        );

        gradingPromises.push(promise);
      });

      // Wait for all grading to complete
      if (gradingPromises.length > 0) {
        const gradedAnswers = await Promise.all(gradingPromises);

        // Update local state with graded answers
        setAnswers((prev) =>
          prev.map((jawaban) => {
            const graded = gradedAnswers.find((g) => g.id === jawaban.id);
            return graded || jawaban;
          }),
        );
      }
    } catch (err) {
      console.error("Error auto-grading answers:", err);
      // Don't block the UI if auto-grading fails
    } finally {
      setGrading(false);
    }
  }

  /**
   * Check if student can retake the quiz
   */
  async function checkCanRetake() {
    if (!kuisId || !user?.mahasiswa?.id) return;

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            Memuat hasil tugas praktikum...
          </p>
          {grading && (
            <p className="text-sm text-muted-foreground">Menilai jawaban...</p>
          )}
        </div>
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
    <div className="container mx-auto py-6 max-w-6xl">
      <QuizResult
        quiz={quiz}
        questions={questions}
        answers={answers}
        attempt={attempt}
        onBack={handleBack}
        onRetake={canRetake ? handleRetake : undefined}
        canRetake={canRetake}
      />
    </div>
  );
}
