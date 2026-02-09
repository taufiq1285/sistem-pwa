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
  Upload,
  FileText,
} from "lucide-react";

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
import { QuizTimer, clearTimerData, getStoredTimeRemaining } from "./QuizTimer";
import {
  QuizNavigation,
  createQuestionStatusList,
  areAllQuestionsAnswered,
  getUnansweredQuestions,
  type QuestionStatus,
} from "./QuizNavigation";
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
} from "@/lib/api/kuis.api";
// ✅ SECURITY FIX: Import secure API untuk hide jawaban_benar
import { getSoalForAttempt } from "@/lib/api/kuis-secure.api";
// ✅ FIX: Import submitAllAnswersWithVersion to save all answers on submit
import { submitAllAnswersWithVersion } from "@/lib/api/kuis-versioned-simple.api";
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
  // Track answer mode for FILE_UPLOAD: "upload" | "type"
  const [fileUploadAnswerMode, setFileUploadAnswerMode] = useState<
    Record<string, "upload" | "type">
  >({});

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
  console.log("🐛 [QuizAttempt] currentQuestionIndex:", currentQuestionIndex);
  console.log("🐛 [QuizAttempt] questions.length:", questions.length);
  console.log("🐛 [QuizAttempt] currentQuestion:", currentQuestion);
  console.log(
    "🐛 [QuizAttempt] currentQuestion?.pertanyaan:",
    currentQuestion?.pertanyaan,
  );
  console.log(
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

  // Check if this is a LAPORAN mode (all questions are file uploads)
  const isLaporanMode =
    questions.length > 0 &&
    questions.every((q) => q.tipe_soal === TIPE_SOAL.FILE_UPLOAD);

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
      console.log("⚠️ Already initializing, skipping duplicate call");
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
      syncOfflineAnswers(attempt.id).catch((err) => {
        console.error("Failed to sync offline answers:", err);
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
      const quizData = await getKuisByIdOffline(kuisId);
      setQuiz(quizData);

      // ✅ SECURITY FIX: Load questions WITHOUT jawaban_benar
      // Use secure API to prevent cheating
      let questionsData: Soal[];
      try {
        // Try secure API first (online)
        questionsData = await getSoalForAttempt(kuisId);
        console.log("✅ Loaded soal securely (jawaban_benar hidden)");
      } catch (err) {
        // Fallback: Load from soal table directly and hide jawaban_benar on client
        console.warn("⚠️ Secure API failed, using soal table directly:", err);
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

          console.log(
            `✅ Loaded ${questionsData.length} soal from soal table (jawaban_benar removed)`,
          );
        } catch (err2) {
          // Last resort: try offline cache
          console.warn(
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
        console.log("🔵 Resuming attempt:", existingAttemptId);
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
        console.log("🔵 Starting new attempt for kuis:", kuisId);

        // ✅ LAPORAN MODE: Check if already submitted, prevent retake
        // Check if this is laporan mode (all questions are FILE_UPLOAD)
        const isThisLaporanMode =
          orderedQuestions.length > 0 &&
          orderedQuestions.every(
            (q: Soal) => q.tipe_soal === TIPE_SOAL.FILE_UPLOAD,
          );

        if (isThisLaporanMode) {
          console.log("🔵 LAPORAN MODE: Checking for existing attempts...");

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
            console.log(
              "✅ LAPORAN MODE: Found existing attempt:",
              existingAttempt.id,
              "status:",
              existingAttempt.status,
            );

            // Redirect to result page
            toast.info(
              "Anda sudah mengirim laporan ini. Mengarahkan ke hasil...",
            );
            navigate(`/mahasiswa/kuis/${kuisId}/result/${existingAttempt.id}`);
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
          toast.success("Tugas praktikum dimulai!");
        } catch (startError: any) {
          // ✅ FIX: Handle max attempts reached error
          const errorMessage = startError?.message || "";

          if (
            errorMessage.includes("mencapai batas maksimal") ||
            errorMessage.includes("max attempts") ||
            errorMessage.includes("percobaan")
          ) {
            // Max attempts reached - try to find existing submitted attempt
            console.log(
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
                console.log(
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
      console.log("✅ Attempt loaded:", attemptData.id);

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
      console.log("⚠️ Skipping auto-save: No answer to save");
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
      console.log("✅ Answer auto-saved:", currentQuestion.id);
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

    console.log("🐛 [QuizAttempt] Submitting quiz...");
    console.log("🐛 [QuizAttempt] Attempt ID:", attempt.id);
    console.log("🐛 [QuizAttempt] Kuis ID:", kuisId);
    console.log("🐛 [QuizAttempt] Mahasiswa ID:", mahasiswaId);

    setIsSubmitting(true);

    try {
      // ✅ FIX: Save ALL answers from state before submitting
      // Previously only saved current answer, causing answered questions to be lost
      console.log("🐛 [QuizAttempt] Saving all answers before submit...");
      console.log("🐛 [QuizAttempt] Answers to save:", answers);
      console.log("🐛 [QuizAttempt] File uploads:", fileUploads);

      // ✅ FIX: Pass fileUploads to store file metadata (file_url, file_name, etc.)
      const saveResult = await submitAllAnswersWithVersion(
        attempt.id,
        answers,
        fileUploads,
      );

      console.log("🐛 [QuizAttempt] Save result:", {
        success: saveResult.success,
        failed: saveResult.failed,
        total: Object.keys(answers).length,
      });

      if (saveResult.failed > 0) {
        console.warn(
          "⚠️ [QuizAttempt] Some answers failed to save:",
          saveResult.results,
        );
      }

      // Get remaining time
      const sisaWaktu = getRemainingTime();

      console.log("🐛 [QuizAttempt] Calling submitQuiz API...");

      // ✅ FIX: Capture returned attempt (contains the id)
      const submittedAttempt = await submitQuiz({
        attempt_id: attempt.id,
        sisa_waktu: sisaWaktu,
      });

      // Debug log
      console.log("✅ [QuizAttempt] Submit successful!");
      console.log(
        "🐛 [QuizAttempt] Submitted attempt ID:",
        submittedAttempt?.id,
      );
      console.log(
        "🐛 [QuizAttempt] Submitted attempt status:",
        (submittedAttempt as any)?.status,
      );

      // Clear timer data
      clearTimerData(attempt.id);

      toast.success("Tugas praktikum berhasil disubmit");

      // Redirect to results - use returned attempt id
      const resultAttemptId = submittedAttempt?.id || attempt.id;
      console.log(
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">{quiz.judul}</h1>
          {quiz.deskripsi && (
            <p className="text-muted-foreground">{quiz.deskripsi}</p>
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
            console.log("✅ Auto-saved (offline):", data.soal_id);
          }
        }}
        delay={3000}
        enabled={!!currentAnswer && currentAnswer.trim() !== ""}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      Soal {currentQuestionIndex + 1}/{totalQuestions}
                    </Badge>
                    <Badge variant="secondary">
                      {currentQuestion?.poin || 0} poin
                    </Badge>
                    <Badge variant="secondary">
                      {currentQuestion?.tipe_soal}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {currentQuestion?.pertanyaan}
                  </CardTitle>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFlag}
                  className={cn(
                    flaggedQuestions.has(currentQuestion?.id || "") &&
                      "text-yellow-600",
                  )}
                >
                  <Flag className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
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
                    <Alert className="bg-blue-50 border-blue-200">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Instruksi:</strong>{" "}
                        {(() => {
                          try {
                            const settings = JSON.parse(
                              currentQuestion.jawaban_benar as string,
                            );
                            return (
                              settings.instructions ||
                              "Upload file laporan praktikum Anda atau ketik hasil laporan langsung."
                            );
                          } catch {
                            return "Upload file laporan praktikum Anda atau ketik hasil laporan langsung.";
                          }
                        })()}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Mode Toggle: Upload File or Type Answer */}
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <Button
                      type="button"
                      variant={
                        fileUploadAnswerMode[currentQuestion.id] !== "type"
                          ? "default"
                          : "ghost"
                      }
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setFileUploadAnswerMode((prev) => ({
                          ...prev,
                          [currentQuestion.id]: "upload",
                        }));
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      type="button"
                      variant={
                        fileUploadAnswerMode[currentQuestion.id] === "type"
                          ? "default"
                          : "ghost"
                      }
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setFileUploadAnswerMode((prev) => ({
                          ...prev,
                          [currentQuestion.id]: "type",
                        }));
                        // Clear file upload when switching to type mode
                        if (currentFileUpload) {
                          handleFileRemove();
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ketik Jawaban
                    </Button>
                  </div>

                  {/* File Upload Component - Only show in upload mode */}
                  {fileUploadAnswerMode[currentQuestion.id] !== "type" && (
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
                  )}

                  {/* Textarea for typing answer - Only show in type mode */}
                  {fileUploadAnswerMode[currentQuestion.id] === "type" && (
                    <div className="space-y-2">
                      <Label htmlFor="typed-answer">
                        Ketik hasil laporan praktikum Anda di sini:
                      </Label>
                      <Textarea
                        id="typed-answer"
                        value={currentAnswer}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Tulis hasil laporan praktikum Anda di sini...
Contoh:
- Tujuan Praktikum
- Teori Dasar
- Metode/Alat
- Hasil dan Pembahasan
- Kesimpulan"
                        rows={12}
                        className="resize-none"
                      />
                      <p className="text-sm text-muted-foreground">
                        💡 Tip: Anda bisa mengetik laporan lengkap dengan format
                        yang terstruktur. Gunakan bullet points atau paragraf
                        sesuai kebutuhan.
                      </p>
                    </div>
                  )}
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
            <div className="flex items-center justify-between">
              <div></div>
              <Button
                onClick={handleOpenSubmitDialog}
                className="gap-2"
                size="lg"
              >
                <Send className="h-4 w-4" />
                Submit Laporan
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
            <AlertDialogTitle>Submit Tugas?</AlertDialogTitle>
            <AlertDialogDescription>
              {areAllQuestionsAnswered(questionStatus) ? (
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
                  Submitting...
                </>
              ) : (
                "Ya, Submit"
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
