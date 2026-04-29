/**
 * QuizResult Component
 *
 * Purpose: Main result display combining score and answer review
 * Features:
 * - Score card with grade
 * - Quiz info (time, attempts)
 * - Answer review list
 * - Actions (back to list, retake)
 */

import { useState } from "react";
import {
  ArrowLeft,
  RotateCcw,
  Eye,
  EyeOff,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreCard } from "./ScoreCard";
import { AnswerReviewList } from "./AnswerReview";
import type { Kuis, Soal, Jawaban, AttemptKuis } from "@/types/kuis.types";
import {
  calculateQuizScore,
  isLaporanMode,
  gradeAnswer,
} from "@/lib/utils/quiz-scoring";
import { TIPE_SOAL } from "@/types/kuis.types";
import { resolveLaporanAccessUrl } from "@/lib/api/laporan-storage.api";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface QuizResultProps {
  /**
   * Quiz data
   */
  quiz: Kuis;

  /**
   * Questions
   */
  questions: Soal[];

  /**
   * Answers
   */
  answers: Jawaban[];

  /**
   * Attempt data
   */
  attempt: AttemptKuis;

  /**
   * Callback when back button clicked
   */
  onBack?: () => void;

  /**
   * Callback when retake button clicked
   */
  onRetake?: () => void;

  /**
   * Can retake quiz?
   */
  canRetake?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuizResult({
  quiz,
  questions,
  answers,
  attempt,
  onBack,
  onRetake,
  canRetake = false,
}: QuizResultProps) {
  const [showAnswers, setShowAnswers] = useState(true);
  const [expandAllAnswers, setExpandAllAnswers] = useState(false);

  // Source of truth: laporan/CBT follows quiz.tipe_kuis.
  // Fallback to question structure only for legacy data.
  const laporanMode =
    quiz.tipe_kuis === "essay" || (!quiz.tipe_kuis && isLaporanMode(questions));

  const normalizedAnswers = answers.map((answer) => {
    const question = questions.find((item) => item.id === answer.soal_id);
    if (!question) return answer;

    const autoGradableTypes: Array<
      | typeof TIPE_SOAL.PILIHAN_GANDA
      | typeof TIPE_SOAL.BENAR_SALAH
      | typeof TIPE_SOAL.JAWABAN_SINGKAT
    > = [
      TIPE_SOAL.PILIHAN_GANDA,
      TIPE_SOAL.BENAR_SALAH,
      TIPE_SOAL.JAWABAN_SINGKAT,
    ];

    if (
      !autoGradableTypes.includes(
        question.tipe_soal as (typeof autoGradableTypes)[number],
      )
    ) {
      return answer;
    }

    const studentAnswer = answer.jawaban ?? answer.jawaban_mahasiswa ?? "";

    if (!studentAnswer.trim()) {
      return answer;
    }

    const grading = gradeAnswer(question, studentAnswer);

    return {
      ...answer,
      poin_diperoleh: grading.poin_diperoleh,
      is_correct: grading.is_correct,
      feedback: answer.feedback ?? null,
    };
  });

  // Calculate score
  const score = calculateQuizScore(
    questions,
    normalizedAnswers,
    quiz.passing_score ?? 70,
  );

  // Extract feedback dosen dari answers (laporan mode)
  const dosenFeedback = laporanMode
    ? normalizedAnswers
        .map((a) => a.feedback)
        .filter(Boolean)
        .join(" | ") || undefined
    : undefined;

  const laporanHasManualScore = laporanMode
    ? normalizedAnswers.some(
        (answer) =>
          answer.poin_diperoleh !== null && answer.poin_diperoleh !== undefined,
      )
    : false;

  const laporanIsGraded =
    laporanMode &&
    (attempt.status === "graded" ||
      attempt.total_poin !== null ||
      laporanHasManualScore ||
      Boolean(dosenFeedback));

  // Extract file submission info dari answers (laporan mode)
  // B1 FIX: Hanya ambil jawaban yang BENAR-BENAR berisi URL file
  // (bukan teks jawaban CBT/essay yang juga punya jawaban_mahasiswa)
  const fileSubmissions = laporanMode
    ? normalizedAnswers
        .filter((a) => {
          // Prioritas: field file_url khusus upload
          if ((a as any).file_url) return true;
          // Fallback: jawaban_mahasiswa hanya jika dimulai http (URL)
          const jm = (a as any).jawaban_mahasiswa;
          return typeof jm === "string" && jm.trim().startsWith("http");
        })
        .map((a) => ({
          file_url: (a as any).file_url || (a as any).jawaban_mahasiswa,
          file_name: (a as any).file_name
            ? (a as any).file_name
            : decodeURIComponent(
                ((a as any).file_url || (a as any).jawaban_mahasiswa || "")
                  .split("/")
                  .pop()
                  ?.split("?")[0]
                  ?.replace(/^\d+_/, "") || "Laporan",
              ),
        }))
    : [];

  // Format dates
  const startedAt = attempt.started_at
    ? format(new Date(attempt.started_at), "dd MMM yyyy, HH:mm", {
        locale: localeId,
      })
    : "-";
  const submittedAt = attempt.submitted_at
    ? format(new Date(attempt.submitted_at), "dd MMM yyyy, HH:mm", {
        locale: localeId,
      })
    : "-";

  // Calculate duration
  const duration =
    attempt.started_at && attempt.submitted_at
      ? Math.floor(
          (new Date(attempt.submitted_at).getTime() -
            new Date(attempt.started_at).getTime()) /
            1000 /
            60,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{quiz.judul}</h1>
          {quiz.deskripsi && (
            <p className="text-muted-foreground">{quiz.deskripsi}</p>
          )}
        </div>

        <div className="flex gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          )}
          {/* Hide retake button for laporan mode */}
          {!laporanMode && canRetake && onRetake && (
            <Button onClick={onRetake}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Ulangi Tugas
            </Button>
          )}
        </div>
      </div>

      {/* Score Card */}
      <ScoreCard
        score={score}
        quizTitle={quiz.judul}
        isLaporanMode={laporanMode}
        dosenFeedback={dosenFeedback}
        isGraded={laporanMode ? laporanIsGraded : attempt.status === "graded"}
      />

      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Pengerjaan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Durasi Pengerjaan
            </p>
            <p className="font-semibold">{duration} menit</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Dimulai</p>
            <p className="font-semibold text-sm">{startedAt}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Diselesaikan</p>
            <p className="font-semibold text-sm">{submittedAt}</p>
          </div>
        </CardContent>
      </Card>

      {/* Laporan submission info */}
      {laporanMode && fileSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">File Laporan Dikirim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fileSubmissions.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/30"
              >
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900 shrink-0">
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    File laporan yang sudah dikirim
                  </p>
                </div>
                {f.file_url && <OpenFileButton fileUrl={f.file_url} />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Answer Review - Hide for laporan mode */}
      {!laporanMode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Review Jawaban</CardTitle>
              <div className="flex items-center gap-2">
                {showAnswers && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandAllAnswers((value) => !value)}
                  >
                    {expandAllAnswers ? "Ringkas Semua" : "Buka Semua"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswers(!showAnswers)}
                >
                  {showAnswers ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Sembunyikan
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Tampilkan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          {showAnswers && (
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">
                    Semua ({questions.length})
                  </TabsTrigger>
                  <TabsTrigger value="correct">
                    Benar ({score.correct_count})
                  </TabsTrigger>
                  <TabsTrigger value="incorrect">
                    Salah ({score.incorrect_count + score.unanswered_count})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <AnswerReviewList
                    questions={questions}
                    answers={normalizedAnswers}
                    showCorrectAnswers={true}
                    expandAll={expandAllAnswers}
                  />
                </TabsContent>

                <TabsContent value="correct" className="mt-6">
                  <AnswerReviewList
                    questions={questions.filter((q) => {
                      const ans = normalizedAnswers.find(
                        (a) => a.soal_id === q.id,
                      );
                      return ans?.is_correct === true;
                    })}
                    answers={normalizedAnswers}
                    showCorrectAnswers={true}
                    expandAll={expandAllAnswers}
                  />
                </TabsContent>

                <TabsContent value="incorrect" className="mt-6">
                  <AnswerReviewList
                    questions={questions.filter((q) => {
                      const ans = normalizedAnswers.find(
                        (a) => a.soal_id === q.id,
                      );
                      return !ans || ans.is_correct !== true;
                    })}
                    answers={normalizedAnswers}
                    showCorrectAnswers={true}
                    expandAll={expandAllAnswers}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// HELPER: Open File Button (re-generates signed URL before opening)
// ============================================================================

function OpenFileButton({ fileUrl }: { fileUrl: string }) {
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setLoading(true);
    try {
      const accessUrl = await resolveLaporanAccessUrl(fileUrl);
      if (!accessUrl) {
        toast.error("File tidak bisa dibuka. URL tidak valid.");
        return;
      }
      window.open(accessUrl, "_blank", "noopener,noreferrer");
    } catch {
      // Fallback: buka URL asli
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      toast.warning(
        "Membuka file dengan link asli. Jika gagal, mungkin sudah kadaluarsa.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpen}
      disabled={loading}
      className="shrink-0 gap-1.5 text-xs"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Eye className="h-3 w-3" />
      )}
      {loading ? "Membuka..." : "Buka"}
    </Button>
  );
}
