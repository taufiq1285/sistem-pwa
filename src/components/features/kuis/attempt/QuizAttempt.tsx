/**
 * QuizAttempt Component
 *
 * Purpose: Main orchestrator for quiz attempt (Mahasiswa)
 * Used by: KuisAttemptPage
 * Features: Load quiz, answer questions, auto-save, timer, navigation, submit
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import logger from "@/lib/utils/logger";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Custom Components
import { QuizTimer } from "./QuizTimer";
import { clearTimerData, getStoredTimeRemaining } from "./quiz-timer.utils";
import { QuizNavigation, type QuestionStatus } from "./QuizNavigation";
import {
  createQuestionStatusList,
  areAllQuestionsAnswered,
  getUnansweredQuestions,
} from "./quiz-navigation.utils";
import { ConnectionLostAlert } from "./ConnectionLostAlert";
import { OfflineAutoSave } from "./OfflineAutoSave";
import { FileUpload, type UploadedFile } from "../FileUpload";

// API & Types
import {
  getKuisByIdOffline,
  getSoalByKuisOffline,
  startAttempt,
  getAttemptByIdForMahasiswa,
  submitAnswerOffline,
  submitQuiz,
  getOfflineAnswers,
  syncOfflineAnswers,
  cacheAttemptOffline,
  cacheQuizOffline,
  cacheQuestionsOffline,
  markAttemptSubmittedOffline,
  getLatestCachedAttemptForQuiz,
  syncPendingOfflineQuizSubmission,
} from "@/lib/api/kuis.api";
// ✅ SECURITY FIX: Import secure API untuk hide jawaban_benar
import {
  getKuisForAttempt,
  getSoalForAttempt,
} from "@/lib/api/kuis-secure.api";
import { submitAllAnswersWithVersion } from "@/lib/api/kuis-versioned-simple.api";
// ✅ FIX: Dynamic import untuk menghindari circular dependency warning
import { createLaporanUploader } from "@/lib/api/laporan-storage.api";
import type {
  Kuis,
  Soal,
  AttemptKuis,
  SubmitAnswerData,
} from "@/types/kuis.types";
import { TIPE_SOAL } from "@/types/kuis.types";

// Toast
import { toast } from "sonner";

// Utils
import { cn } from "@/lib/utils";

// Hooks
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

// Supabase
import { supabase } from "@/lib/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

interface QuizAttemptProps {
  /**
   * Quiz ID
   */
  kuisId: string;

  /**
   * Mahasiswa ID
   */
  mahasiswaId: string;

  /**
   * Optional existing attempt ID (for resuming)
   */
  attemptId?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuizAttempt({
  kuisId,
  mahasiswaId,
  attemptId: existingAttemptId,
}: QuizAttemptProps) {
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();

  // ✅ Prevent duplicate calls in React StrictMode
  const isInitializingRef = useRef(false);

  // ============================================================================
  // STATE
  // ============================================================================

  // Quiz data
  const [quiz, setQuiz] = useState<Kuis | null>(null);
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [attempt, setAttempt] = useState<AttemptKuis | null>(null);

  // Current state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fileUploads, setFileUploads] = useState<
    Record<string, UploadedFile | null>
  >({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(
    new Set(),
  );
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref for remaining time
  const remainingTimeRef = useRef<number>(0);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const currentQuestion = questions[currentQuestionIndex];

  // 🔍 DEBUG: Log current question state
  logger.debug("🐛 [QuizAttempt] currentQuestionIndex:", currentQuestionIndex);
  logger.debug("🐛 [QuizAttempt] questions.length:", questions.length);
  logger.debug("🐛 [QuizAttempt] currentQuestion:", currentQuestion);
  logger.debug(
    "🐛 [QuizAttempt] currentQuestion?.pertanyaan:",
    currentQuestion?.pertanyaan,
  );
  logger.debug(
    "🐛 [QuizAttempt] currentQuestion?.tipe_soal:",
    currentQuestion?.tipe_soal,
  );

  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id] || ""
    : "";
  const currentFileUpload = currentQuestion
    ? fileUploads[currentQuestion.id] || null
    : null;
  const totalQuestions = questions.length;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const totalPoints = questions.reduce((sum, q) => sum + (q.poin || 0), 0);

  // Source of truth: laporan/CBT follows quiz.tipe_kuis.
  // Fallback to question structure only for legacy data that has no tipe_kuis.
  const isLaporanMode =
    quiz?.tipe_kuis === "essay" ||
    (!quiz?.tipe_kuis &&
      questions.length > 0 &&
      questions.every(
        (q) =>
          q.tipe_soal === TIPE_SOAL.FILE_UPLOAD ||
          q.tipe_soal === TIPE_SOAL.ESSAY,
      ));

  // Question status for navigation
  const questionStatus: QuestionStatus[] = createQuestionStatusList(
    questions,
    answers,
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load quiz and start/resume attempt
   */
  useEffect(() => {
    // ✅ Prevent duplicate calls (React StrictMode protection)
    if (isInitializingRef.current) {
      logger.debug("⚠️ Already initializing, skipping duplicate call");
      return;
    }

    isInitializingRef.current = true;
    loadQuizAndStartAttempt().finally(() => {
      isInitializingRef.current = false;
    });
  }, [kuisId, mahasiswaId]);

  /**
   * Sync offline answers when coming back online
   */
  useEffect(() => {
    if (isOnline && attempt) {
      const syncAttempt = async () => {
        if (attempt.offline_submit_pending) {
          const syncedAttempt = await syncPendingOfflineQuizSubmission(
            attempt.id,
          );

          if (syncedAttempt) {
            setAttempt(syncedAttempt);
            toast.success(
              "Sinyal kembali! Tugas yang tadi dikumpulkan offline sudah berhasil disinkronkan.",
            );
          }
          return;
        }

        const count = await syncOfflineAnswers(attempt.id);
        if (count > 0) {
          toast.success(
            `Sinyal kembali! ${count} jawaban offline berhasil disinkronkan ke server.`,
          );
        }
      };

      syncAttempt().catch((err) => {
        console.error("Failed to sync offline quiz state:", err);
      });
    }
  }, [isOnline, attempt]);

  // ============================================================================
  // HANDLERS - DATA LOADING
  // ============================================================================

  /**
   * Load quiz data and start/resume attempt
   */
  const loadQuizAndStartAttempt = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load quiz (offline-first)
      const quizData = isOnline
        ? await getKuisForAttempt(kuisId)
        : await getKuisByIdOffline(kuisId);
      setQuiz(quizData);

      // ✅ SECURITY FIX: Load questions WITHOUT jawaban_benar
      // Use secure API to prevent cheating
      let questionsData: Soal[];
      const hasFreshSecureQuizPayload =
        isOnline && Array.isArray(quizData.soal) && quizData.soal.length > 0;
      try {
        // Try secure API first (online)
        if (hasFreshSecureQuizPayload) {
          questionsData = quizData.soal as Soal[];
          await cacheQuizOffline(quizData);
          await cacheQuestionsOffline(kuisId, questionsData);
        } else if (isOnline) {
          questionsData = await getSoalForAttempt(kuisId);
          await cacheQuestionsOffline(kuisId, questionsData);
        } else {
          questionsData = await getSoalByKuisOffline(kuisId);
        }
        logger.debug("✅ Loaded soal securely (jawaban_benar hidden)");
      } catch (err) {
        // Fallback: Load from soal table directly and hide jawaban_benar on client
        logger.debug("⚠️ Secure API failed, using soal table directly:", err);
        try {
          const { data: soalData, error: soalError } = await supabase
            .from("soal")
            .select("*, kuis_id")
            .eq("kuis_id", kuisId)
            .order("urutan", { ascending: true });

          if (soalError) throw soalError;

          // Remove jawaban_benar for security (don't send to client)
          questionsData = (soalData || []).map((soal: any) => {
            const { jawaban_benar, ...rest } = soal;

            // ✅ FIX: Map DB field names to TypeScript type field names
            // pilihan_jawaban → opsi_jawaban, tipe → tipe_soal, pembahasan → penjelasan
            const mapped: any = {
              ...rest,
            };

            // Map field names
            if (mapped.pilihan_jawaban) {
              mapped.opsi_jawaban = mapped.pilihan_jawaban;
              delete mapped.pilihan_jawaban;
            }

            if (mapped.tipe) {
              mapped.tipe_soal = mapped.tipe;
              delete mapped.tipe;
            }

            if (mapped.pembahasan) {
              mapped.penjelasan = mapped.pembahasan;
              delete mapped.pembahasan;
            }

            // Keep jawaban_benar for FILE_UPLOAD type (it's settings, not answers)
            mapped.jawaban_benar =
              mapped.tipe_soal === "file_upload" ? jawaban_benar : undefined;

            return mapped as Soal;
          });
          if (isOnline) {
            await cacheQuestionsOffline(kuisId, questionsData);
          }

          logger.debug(
            `✅ Loaded ${questionsData.length} soal from soal table (jawaban_benar removed)`,
          );
        } catch (err2) {
          // Last resort: try offline cache
          logger.debug(
            "⚠️ Direct soal query failed, trying offline cache:",
            err2,
          );
          questionsData = await getSoalByKuisOffline(kuisId);
        }
      }

      // Shuffle if needed (check for shuffle_soal or randomize_questions)
      const shouldShuffle =
        (quizData as any).shuffle_soal ||
        (quizData as any).randomize_questions ||
        false;
      const orderedQuestions = shouldShuffle
        ? shuffleArray([...questionsData])
        : questionsData.sort((a: Soal, b: Soal) => a.urutan - b.urutan);

      setQuestions(orderedQuestions);

      // Start or resume attempt
      let attemptData: AttemptKuis;

      if (existingAttemptId) {
        // Resume existing attempt (fetch real data for accurate status/timer)
        logger.debug("🔵 Resuming attempt:", existingAttemptId);
        if (isOnline) {
          attemptData = await getAttemptByIdForMahasiswa(existingAttemptId);

          // If attempt already finished, redirect to result
          if (
            (attemptData as any).status &&
            (attemptData as any).status !== "in_progress"
          ) {
            toast.info("Tugas sudah disubmit, membuka hasil...");
            navigate(`/mahasiswa/kuis/${kuisId}/result/${existingAttemptId}`);
            return;
          }
        } else {
          // Offline: minimal attempt object; answers restored from offline storage below
          attemptData = {
            id: existingAttemptId,
            kuis_id: kuisId,
            mahasiswa_id: mahasiswaId,
            attempt_number: 1,
            status: "in_progress",
            started_at: new Date().toISOString(),
          } as AttemptKuis;
        }
      } else {
        // Start new attempt
        logger.debug("🔵 Starting new attempt for kuis:", kuisId);

        const cachedAttempt = await getLatestCachedAttemptForQuiz(
          kuisId,
          mahasiswaId,
        );

        if (cachedAttempt) {
          if (cachedAttempt.status !== "in_progress") {
            toast.info("Tugas sudah pernah dikumpulkan di perangkat ini.");
            navigate(`/mahasiswa/kuis/${kuisId}/result/${cachedAttempt.id}`);
            return;
          }

          attemptData = cachedAttempt;
          await cacheAttemptOffline(cachedAttempt);
        } else if (!isOnline) {
          throw new Error(
            "Perangkat sedang offline dan attempt tugas ini belum pernah dimulai di perangkat ini.",
          );
        } else {
          // ✅ LAPORAN MODE: Check if already submitted, prevent retake
          // Source of truth stays on quiz.tipe_kuis, with a safe fallback for legacy data.
          const isThisLaporanMode =
            quizData?.tipe_kuis === "essay" ||
            (!quizData?.tipe_kuis &&
              orderedQuestions.length > 0 &&
              orderedQuestions.every(
                (q: Soal) =>
                  q.tipe_soal === TIPE_SOAL.FILE_UPLOAD ||
                  q.tipe_soal === TIPE_SOAL.ESSAY,
              ));

          if (isThisLaporanMode) {
            logger.debug("🔵 LAPORAN MODE: Checking for existing attempts...");

            // Check for any existing attempt (submitted or in_progress)
            const { data: existingAttempts } = await supabase
              .from("attempt_kuis")
              .select("*")
              .eq("kuis_id", kuisId)
              .eq("mahasiswa_id", mahasiswaId)
              .in("status", ["in_progress", "submitted", "graded"])
              .order("submitted_at", { ascending: false })
              .limit(1);

            if (existingAttempts && existingAttempts.length > 0) {
              const existingAttempt = existingAttempts[0];
              logger.debug(
                "✅ LAPORAN MODE: Found existing attempt:",
                existingAttempt.id,
                "status:",
                existingAttempt.status,
              );

              // Redirect to result page
              toast.info(
                "Anda sudah mengirim laporan ini. Mengarahkan ke hasil...",
              );
              navigate(
                `/mahasiswa/kuis/${kuisId}/result/${existingAttempt.id}`,
              );
              setIsLoading(false);
              return; // Stop here, already redirected
            }
          }

          try {
            attemptData = await startAttempt({
              kuis_id: kuisId,
              mahasiswa_id: mahasiswaId,
            });

            // Cache attempt for offline use
            await cacheAttemptOffline(attemptData);
            toast.success(
              isThisLaporanMode
                ? "Tugas laporan praktikum dibuka!"
                : "Tugas CBT praktikum dimulai!",
            );
          } catch (startError: any) {
            // ✅ FIX: Handle max attempts reached error
            const errorMessage = startError?.message || "";

            if (
              errorMessage.includes("mencapai batas maksimal") ||
              errorMessage.includes("max attempts") ||
              errorMessage.includes("percobaan")
            ) {
              // Max attempts reached - try to find existing submitted attempt
              logger.debug(
                "⚠️ Max attempts reached, checking for existing attempts...",
              );

              try {
                // Fetch attempts for this quiz and mahasiswa
                const { data: attempts } = await supabase
                  .from("attempt_kuis")
                  .select("*")
                  .eq("kuis_id", kuisId)
                  .eq("mahasiswa_id", mahasiswaId)
                  .in("status", ["submitted", "graded"])
                  .order("submitted_at", { ascending: false })
                  .limit(1);

                if (attempts && attempts.length > 0) {
                  const existingAttempt = attempts[0];
                  logger.debug(
                    "✅ Found existing attempt, redirecting to results:",
                    existingAttempt.id,
                  );
                  toast.info(
                    "Anda sudah menyelesaikan tugas ini. Mengarahkan ke hasil...",
                  );
                  navigate(
                    `/mahasiswa/kuis/${kuisId}/result/${existingAttempt.id}`,
                  );
                  return;
                }

                // No submitted attempt found but can't start new one
                setError(
                  "Anda sudah mencapai batas maksimal percobaan, namun tidak ada hasil yang ditemukan.",
                );
                setIsLoading(false);
                return;
              } catch (fetchError) {
                console.error("Error fetching existing attempts:", fetchError);
                setError(
                  "Gagal memeriksa status percobaan. Silakan kembali ke daftar tugas.",
                );
                setIsLoading(false);
                return;
              }
            }

            // Other errors - rethrow
            throw startError;
          }
        }
      }

      // ✅ Restore offline answers for THIS attempt (covers refresh/resume)
      const offlineAnswers = await getOfflineAnswers(attemptData.id);
      setAnswers(offlineAnswers);

      // Best-effort restore file uploads UI from stored answers (URL strings)
      setFileUploads(() => {
        const restored: Record<string, UploadedFile | null> = {};
        for (const soal of orderedQuestions) {
          if (soal.tipe_soal !== TIPE_SOAL.FILE_UPLOAD) continue;
          const url = offlineAnswers[soal.id];
          if (!url) continue;
          const name =
            typeof url === "string"
              ? url.split("/").pop() || "laporan"
              : "laporan";
          restored[soal.id] = {
            url: String(url),
            name,
            size: 0,
            type: "",
          };
        }
        return restored;
      });

      // ✅ Set attempt state (important!)
      setAttempt(attemptData);
      logger.debug("✅ Attempt loaded:", attemptData.id);

      if (existingAttemptId) {
        toast.info("Melanjutkan tugas sebelumnya");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Gagal memuat tugas praktikum";
      setError(errorMessage);
      toast.error("Gagal memuat tugas praktikum", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS - NAVIGATION
  // ============================================================================

  /**
   * Navigate to specific question
   * FIXED: Only auto-save if answer exists
   */
  const handleGoToQuestion = (questionNumber: number) => {
    // Save current answer first (only if not empty)
    if (currentAnswer && currentAnswer.trim() !== "" && !isSaving) {
      handleAutoSave();
    }

    setCurrentQuestionIndex(questionNumber - 1);
  };

  /**
   * Go to previous question
   */
  const handlePrevious = () => {
    if (!isFirstQuestion) {
      handleGoToQuestion(currentQuestionIndex);
    }
  };

  /**
   * Go to next question
   */
  const handleNext = () => {
    if (!isLastQuestion) {
      handleGoToQuestion(currentQuestionIndex + 2);
    }
  };

  /**
   * Toggle flag on current question
   */
  const handleToggleFlag = () => {
    if (!currentQuestion) return;

    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  // ============================================================================
  // HANDLERS - ANSWERS
  // ============================================================================

  /**
   * Handle answer change
   */
  const handleAnswerChange = (value: string) => {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  /**
   * Handle file upload for file_upload type questions
   */
  const handleFileUpload = (file: UploadedFile) => {
    if (!currentQuestion) return;

    setFileUploads((prev) => ({
      ...prev,
      [currentQuestion.id]: file,
    }));

    // Also store file URL as answer for consistency
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: file.url,
    }));

    toast.success("File berhasil diupload", {
      description: file.name,
    });
  };

  /**
   * Handle file removal
   */
  const handleFileRemove = () => {
    if (!currentQuestion) return;

    setFileUploads((prev) => ({
      ...prev,
      [currentQuestion.id]: null,
    }));

    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestion.id];
      return newAnswers;
    });
  };

  /**
   * Manual save answers (used before navigation/submit)
   * FIXED: Only save if answer is not empty
   */
  const handleAutoSave = async () => {
    // Don't save if no answer
    if (
      !attempt ||
      !currentQuestion ||
      !currentAnswer ||
      currentAnswer.trim() === ""
    ) {
      logger.debug("⚠️ Skipping auto-save: No answer to save");
      return;
    }

    setIsSaving(true);

    try {
      // Check if this is a file upload and get file metadata
      const fileUpload = fileUploads[currentQuestion.id];
      const submitData: SubmitAnswerData = {
        attempt_id: attempt.id,
        soal_id: currentQuestion.id,
        jawaban: currentAnswer,
      };

      // Add file metadata if available
      if (fileUpload) {
        submitData.file_url = fileUpload.url;
        submitData.file_name = fileUpload.name;
        submitData.file_size = fileUpload.size;
        submitData.file_type = fileUpload.type;
      }

      await submitAnswerOffline(submitData);
      logger.debug("✅ Answer auto-saved:", currentQuestion.id);
    } catch (err: any) {
      console.error("Manual save failed:", err);
      // Don't show error to user, will retry
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // HANDLERS - SUBMISSION
  // ============================================================================

  /**
   * Open submit confirmation dialog
   */
  const handleOpenSubmitDialog = () => {
    // Check if all questions are answered
    const unanswered = getUnansweredQuestions(questionStatus);

    if (unanswered.length > 0) {
      toast.warning("Ada soal yang belum dijawab", {
        description: `Soal nomor: ${unanswered.join(", ")}`,
      });
    }

    setShowSubmitDialog(true);
  };

  /**
   * Get remaining time from localStorage or ref
   */
  const getRemainingTime = (): number => {
    if (!attempt) return 0;

    const stored = getStoredTimeRemaining(attempt.id);
    if (typeof stored === "number" && Number.isFinite(stored)) return stored;

    // Fallback to ref
    return remainingTimeRef.current || 0;
  };

  /**
   * Submit quiz
   * ✅ FIX: Save ALL answers before submitting (not just current question)
   */
  const handleSubmitQuiz = async () => {
    if (!attempt) {
      console.error("❌ [QuizAttempt] No attempt found, cannot submit!");
      toast.error("Gagal submit: Tidak ada attempt yang aktif");
      return;
    }

    logger.debug("🐛 [QuizAttempt] Submitting quiz...");
    logger.debug("🐛 [QuizAttempt] Attempt ID:", attempt.id);
    logger.debug("🐛 [QuizAttempt] Kuis ID:", kuisId);
    logger.debug("🐛 [QuizAttempt] Mahasiswa ID:", mahasiswaId);

    setIsSubmitting(true);

    try {
      if (!navigator.onLine) {
        const answerEntries = Object.entries(answers);

        for (const [soalId, jawaban] of answerEntries) {
          const fileUpload = fileUploads[soalId];
          await submitAnswerOffline({
            attempt_id: attempt.id,
            soal_id: soalId,
            jawaban,
            file_url: fileUpload?.url,
            file_name: fileUpload?.name,
            file_size: fileUpload?.size,
            file_type: fileUpload?.type,
          });
        }

        const offlineSubmittedAttempt = await markAttemptSubmittedOffline(
          {
            ...attempt,
            kuis: attempt.kuis || quiz || undefined,
          },
          getRemainingTime(),
        );

        setAttempt(offlineSubmittedAttempt);
        clearTimerData(attempt.id);

        toast.success("Tugas berhasil dikumpulkan secara offline", {
          description:
            "Jawaban disimpan di perangkat dan akan dikirim ke server saat koneksi kembali.",
        });

        navigate(`/mahasiswa/kuis/${kuisId}/result/${attempt.id}`);
        return;
      }

      // ✅ FIX: Save ALL answers from state before submitting
      // Previously only saved current answer, causing answered questions to be lost
      logger.debug("🐛 [QuizAttempt] Saving all answers before submit...");
      logger.debug("🐛 [QuizAttempt] Answers to save:", answers);
      logger.debug("🐛 [QuizAttempt] File uploads:", fileUploads);

      // ✅ Offline-critical: gunakan static import agar submit kuis tidak bergantung
      // pada lazy chunk tambahan saat perangkat sudah offline.
      // ✅ FIX: Pass fileUploads to store file metadata (file_url, file_name, etc.)
      const saveResult = await submitAllAnswersWithVersion(
        attempt.id,
        answers,
        fileUploads,
      );

      logger.debug("🐛 [QuizAttempt] Save result:", {
        success: saveResult.success,
        failed: saveResult.failed,
        total: Object.keys(answers).length,
      });

      if (saveResult.failed > 0) {
        logger.debug(
          "⚠️ [QuizAttempt] Some answers failed to save:",
          saveResult.results,
        );
      }

      // Get remaining time
      const sisaWaktu = getRemainingTime();

      logger.debug("🐛 [QuizAttempt] Calling submitQuiz API...");

      // ✅ FIX: Capture returned attempt (contains the id)
      const submittedAttempt = await submitQuiz({
        attempt_id: attempt.id,
        sisa_waktu: sisaWaktu,
      });

      // Debug log
      logger.debug("✅ [QuizAttempt] Submit successful!");
      logger.debug(
        "🐛 [QuizAttempt] Submitted attempt ID:",
        submittedAttempt?.id,
      );
      logger.debug(
        "🐛 [QuizAttempt] Submitted attempt status:",
        (submittedAttempt as any)?.status,
      );

      // Clear timer data
      clearTimerData(attempt.id);

      toast.success(
        isLaporanMode
          ? "Laporan praktikum berhasil dikirim"
          : "Tugas CBT praktikum berhasil disubmit",
      );

      // Redirect to results - use returned attempt id
      const resultAttemptId = submittedAttempt?.id || attempt.id;
      logger.debug(
        "🐛 [QuizAttempt] Navigating to:",
        `/mahasiswa/kuis/${kuisId}/result/${resultAttemptId}`,
      );
      navigate(`/mahasiswa/kuis/${kuisId}/result/${resultAttemptId}`);
    } catch (err: any) {
      console.error("❌ [QuizAttempt] Submit error:", err);
      console.error("❌ [QuizAttempt] Error details:", {
        message: err?.message,
        code: err?.code,
        status: err?.status,
        hint: err?.hint,
      });
      const errorMessage = err?.message || "Terjadi kesalahan";
      toast.error("Gagal submit tugas praktikum", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  /**
   * Handle time up (auto-submit)
   */
  const handleTimeUp = () => {
    toast.warning("Waktu habis! Tugas praktikum akan otomatis disubmit");
    setTimeout(() => {
      handleSubmitQuiz();
    }, 2000);
  };

  // ============================================================================
  // RENDER - LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Memuat tugas praktikum...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - ERROR
  // ============================================================================

  if (error || !quiz || !attempt) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || "Gagal memuat tugas praktikum"}
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER - MAIN
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={cn(
          "flex items-start justify-between gap-4",
          isLaporanMode && "flex-col gap-5",
        )}
      >
        <div className="flex-1">
          <h1
            className={cn(
              "mb-2 font-bold tracking-tight text-foreground",
              isLaporanMode ? "text-3xl sm:text-4xl" : "text-2xl",
            )}
          >
            {quiz.judul}
          </h1>
          {quiz.deskripsi && (
            <div
              className={cn(
                "prose prose-slate max-w-none text-body text-muted-foreground dark:prose-invert",
                isLaporanMode && "text-base leading-relaxed text-slate-600",
              )}
            >
              {quiz.deskripsi}
            </div>
          )}
          {!isLaporanMode && (
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Durasi awal CBT:{" "}
              <span className="text-foreground">
                {(quiz as any).durasi || (quiz as any).durasi_menit || 60} menit
              </span>
            </p>
          )}
        </div>

        {/* Timer (Compact) - Hide for LAPORAN */}
        {!isLaporanMode && (
          <QuizTimer
            durationMinutes={
              (quiz as any).durasi || (quiz as any).durasi_menit || 60
            }
            attemptId={attempt.id}
            onTimeUp={handleTimeUp}
            startTime={
              attempt.started_at ? new Date(attempt.started_at) : undefined
            }
            compact
          />
        )}
      </div>

      {/* Connection Status Alert */}
      <ConnectionLostAlert />

      {/* Offline Auto-Save - FIXED: Only enabled if answer is not empty */}
      <OfflineAutoSave
        saveKey={`quiz_${attempt.id}_${currentQuestion?.id}`}
        data={{
          attempt_id: attempt.id,
          soal_id: currentQuestion?.id,
          jawaban: currentAnswer,
        }}
        onSave={async (data) => {
          // Only save if jawaban is not empty
          if (data.jawaban && data.jawaban.trim() !== "") {
            await submitAnswerOffline(data);
            logger.debug("✅ Auto-saved (offline):", data.soal_id);
          }
        }}
        delay={3000}
        enabled={!!currentAnswer && currentAnswer.trim() !== ""}
      />

      {/* Main Content */}
      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          isLaporanMode ? "lg:grid-cols-1" : "lg:grid-cols-3",
        )}
      >
        {/* Question Area */}
        <div
          className={cn(
            "space-y-6",
            !isLaporanMode && "lg:col-span-2",
            isLaporanMode && "mx-auto w-full max-w-[980px]",
          )}
        >
          {/* Question Card */}
          <Card
            className={cn(
              isLaporanMode &&
                "overflow-hidden rounded-[28px] border-slate-200/80 bg-white/95 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.25)] backdrop-blur",
            )}
          >
            <CardHeader
              className={cn(isLaporanMode && "px-6 pb-0 pt-6 sm:px-7 sm:pt-7")}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div
                    className={cn(
                      "mb-2 flex items-center gap-2",
                      isLaporanMode && "mb-3 flex-wrap gap-2.5",
                    )}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        isLaporanMode &&
                          "rounded-full border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm",
                      )}
                    >
                      Soal {currentQuestionIndex + 1}/{totalQuestions}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn(
                        isLaporanMode &&
                          "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 shadow-sm",
                      )}
                    >
                      {currentQuestion?.poin || 0} poin
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn(
                        isLaporanMode &&
                          "rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-800 shadow-sm",
                      )}
                    >
                      {currentQuestion?.tipe_soal === "file_upload"
                        ? "Upload File"
                        : currentQuestion?.tipe_soal === "pilihan_ganda"
                          ? "Pilihan Ganda"
                          : currentQuestion?.tipe_soal === "essay"
                            ? "Essay"
                            : currentQuestion?.tipe_soal || ""}
                    </Badge>
                  </div>
                  <CardTitle
                    className={cn(
                      "text-lg",
                      isLaporanMode &&
                        "text-[1.7rem] font-semibold leading-tight text-slate-950",
                    )}
                  >
                    {currentQuestion?.pertanyaan}
                  </CardTitle>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFlag}
                  className={cn(
                    isLaporanMode &&
                      "rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                    flaggedQuestions.has(currentQuestion?.id || "") &&
                      "text-yellow-600",
                  )}
                >
                  <Flag className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent
              className={cn(
                "space-y-4",
                isLaporanMode && "space-y-5 px-6 pb-8 pt-5 sm:px-7 sm:pb-9",
              )}
            >
              {/* Answer Input based on question type */}
              {currentQuestion?.tipe_soal === TIPE_SOAL.PILIHAN_GANDA && (
                <RadioGroup
                  value={currentAnswer}
                  onValueChange={handleAnswerChange}
                >
                  {currentQuestion.opsi_jawaban?.map(
                    (option: any, index: number) => (
                      <div
                        key={option.id || index}
                        className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer"
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={`option-${option.id}`}
                        />
                        <Label
                          htmlFor={`option-${option.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-semibold mr-2">
                            {option.label}.
                          </span>
                          {option.text}
                        </Label>
                      </div>
                    ),
                  )}
                </RadioGroup>
              )}

              {currentQuestion?.tipe_soal === TIPE_SOAL.ESSAY && (
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Tulis jawaban Anda di sini..."
                  rows={8}
                  className="resize-none"
                />
              )}

              {currentQuestion?.tipe_soal === TIPE_SOAL.FILE_UPLOAD && (
                <div className="space-y-4">
                  {/* Instructions */}
                  {currentQuestion.jawaban_benar && (
                    <Alert
                      className={cn(
                        "bg-blue-50 border-blue-200",
                        isLaporanMode &&
                          "rounded-2xl border-blue-200 bg-[#eaf3ff] px-4 py-4 text-blue-900 shadow-sm",
                      )}
                    >
                      <FileText className="h-4 w-4 text-blue-600" />
                      <AlertDescription
                        className={cn(
                          "prose prose-blue max-w-none text-body text-blue-800 dark:prose-invert",
                          isLaporanMode && "leading-relaxed text-blue-900",
                        )}
                      >
                        <strong className="mr-1">Instruksi:</strong>
                        {(() => {
                          try {
                            const settings = JSON.parse(
                              currentQuestion.jawaban_benar as string,
                            );
                            return (
                              settings.instructions ||
                              "Upload file laporan praktikum Anda dalam format yang diminta."
                            );
                          } catch {
                            return "Upload file laporan praktikum Anda dalam format yang diminta.";
                          }
                        })()}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div
                    className={cn(
                      "rounded-lg border border-dashed border-border bg-muted/20 p-3",
                      isLaporanMode &&
                        "rounded-[26px] border-slate-200 bg-[#fcfaf6] p-4 sm:p-5",
                    )}
                  >
                    <FileUpload
                      value={currentFileUpload}
                      onUpload={handleFileUpload}
                      onRemove={handleFileRemove}
                      uploadFn={
                        quiz && attempt
                          ? createLaporanUploader(
                              quiz.kelas_id,
                              mahasiswaId,
                              attempt.id,
                              currentQuestion.id,
                            )
                          : async () => {
                              throw new Error("Attempt belum dimulai");
                            }
                      }
                      accept={(() => {
                        try {
                          const settings = JSON.parse(
                            currentQuestion.jawaban_benar as string,
                          );
                          const accepts: string[] = [];
                          if (settings.acceptedTypes?.pdf) accepts.push(".pdf");
                          if (settings.acceptedTypes?.word)
                            accepts.push(".doc,.docx");
                          if (settings.acceptedTypes?.image)
                            accepts.push(".jpg,.jpeg,.png");
                          if (settings.acceptedTypes?.zip) accepts.push(".zip");
                          return accepts.join(",") || ".pdf,.doc,.docx";
                        } catch {
                          return ".pdf,.doc,.docx";
                        }
                      })()}
                      maxSize={(() => {
                        try {
                          const settings = JSON.parse(
                            currentQuestion.jawaban_benar as string,
                          );
                          return (settings.maxSizeMB || 10) * 1024 * 1024;
                        } catch {
                          return 10 * 1024 * 1024;
                        }
                      })()}
                      placeholder="Seret file laporan ke sini atau klik untuk memilih"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons - Hide for LAPORAN mode */}
          {!isLaporanMode && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Sebelumnya
              </Button>

              {isLastQuestion ? (
                <Button onClick={handleOpenSubmitDialog} className="gap-2">
                  <Send className="h-4 w-4" />
                  Submit Tugas
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {/* Submit Button - Only show for LAPORAN mode (immediate submit) */}
          {isLaporanMode && (
            <div className="flex items-center justify-end">
              <Button
                onClick={handleOpenSubmitDialog}
                className="h-12 rounded-full bg-blue-700 px-6 text-sm font-semibold text-white shadow-[0_18px_32px_-18px_rgba(29,78,216,0.75)] transition hover:bg-blue-800"
                size="lg"
              >
                <Send className="h-4 w-4" />
                Kirim Laporan
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={cn("space-y-6", isLaporanMode && "hidden")}>
          {/* Timer (Full) - Hide for LAPORAN */}
          {!isLaporanMode && (
            <QuizTimer
              durationMinutes={
                (quiz as any).durasi || (quiz as any).durasi_menit || 60
              }
              attemptId={attempt.id}
              onTimeUp={handleTimeUp}
            />
          )}

          {/* Navigation - Hide for LAPORAN mode */}
          {!isLaporanMode && (
            <QuizNavigation
              questions={questionStatus}
              currentQuestion={currentQuestionIndex + 1}
              onQuestionClick={handleGoToQuestion}
              totalPoints={totalPoints}
            />
          )}

          {/* Submit Button (Sidebar) - Hide for LAPORAN mode */}
          {!isLaporanMode && (
            <Button
              onClick={handleOpenSubmitDialog}
              className="w-full gap-2"
              size="lg"
            >
              <Send className="h-4 w-4" />
              Submit Tugas
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLaporanMode ? "Kirim Laporan?" : "Submit Tugas?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {!navigator.onLine ? (
                <>
                  Perangkat sedang offline.
                  <br />
                  <br />
                  Jika Anda lanjutkan, {isLaporanMode
                    ? "laporan"
                    : "tugas"}{" "}
                  akan disimpan sebagai sudah dikumpulkan di perangkat ini dan
                  otomatis disinkronkan saat koneksi kembali.
                </>
              ) : isLaporanMode ? (
                <>
                  Pastikan file laporan yang Anda unggah sudah benar.
                  <br />
                  <br />
                  Setelah dikirim, Anda tidak dapat mengubah laporan ini.
                </>
              ) : areAllQuestionsAnswered(questionStatus) ? (
                <>
                  Anda telah menjawab semua soal. Yakin ingin submit tugas
                  sekarang?
                  <br />
                  <br />
                  Setelah submit, Anda tidak dapat mengubah jawaban.
                </>
              ) : (
                <>
                  <strong>Perhatian!</strong> Anda belum menjawab semua soal.
                  <br />
                  <br />
                  Soal yang belum dijawab:{" "}
                  {getUnansweredQuestions(questionStatus).join(", ")}
                  <br />
                  <br />
                  Yakin ingin submit sekarang?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isLaporanMode ? "Mengirim..." : "Submitting..."}
                </>
              ) : navigator.onLine ? (
                isLaporanMode ? (
                  "Ya, Kirim"
                ) : (
                  "Ya, Submit"
                )
              ) : (
                "Ya, Simpan Offline"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
