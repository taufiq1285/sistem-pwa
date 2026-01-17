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
import { createLaporanUploader } from "@/lib/api/laporan-storage.api";
import type { Kuis, Soal, AttemptKuis } from "@/types/kuis.types";
import { TIPE_SOAL } from "@/types/kuis.types";

// Toast
import { toast } from "sonner";

// Utils
import { cn } from "@/lib/utils";

// Hooks
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

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
        // Fallback to offline cache if online fetch fails
        console.warn("⚠️ Secure API failed, using offline cache:", err);
        questionsData = await getSoalByKuisOffline(kuisId);
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
        attemptData = await startAttempt({
          kuis_id: kuisId,
          mahasiswa_id: mahasiswaId,
        });

        // Cache attempt for offline use
        await cacheAttemptOffline(attemptData);
        toast.success("Tugas praktikum dimulai!");
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
      await submitAnswerOffline({
        attempt_id: attempt.id,
        soal_id: currentQuestion.id,
        jawaban: currentAnswer,
      });
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
   */
  const handleSubmitQuiz = async () => {
    if (!attempt) return;

    setIsSubmitting(true);

    try {
      // Save current answer first
      if (currentAnswer && !isSaving) {
        await handleAutoSave();
      }

      // Get remaining time
      const sisaWaktu = getRemainingTime();

      // Submit attempt
      await submitQuiz({
        attempt_id: attempt.id,
        sisa_waktu: sisaWaktu,
      });

      // Clear timer data
      clearTimerData(attempt.id);

      toast.success("Tugas praktikum berhasil disubmit");

      // Redirect to results
      navigate(`/mahasiswa/kuis/${kuisId}/result/${attempt.id}`);
    } catch (err: any) {
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
      <div className="flex items-center justify-center min-h-[400px]">
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
                              "Upload file laporan praktikum Anda."
                            );
                          } catch {
                            return "Upload file laporan praktikum Anda.";
                          }
                        })()}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* File Upload Component */}
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
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
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

          {/* Navigation */}
          <QuizNavigation
            questions={questionStatus}
            currentQuestion={currentQuestionIndex + 1}
            onQuestionClick={handleGoToQuestion}
            totalPoints={totalPoints}
          />

          {/* Submit Button (Sidebar) */}
          <Button
            onClick={handleOpenSubmitDialog}
            className="w-full gap-2"
            size="lg"
          >
            <Send className="h-4 w-4" />
            Submit Tugas
          </Button>
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
