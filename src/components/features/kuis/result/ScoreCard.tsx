/**
 * ScoreCard Component
 *
 * Purpose: Display quiz score summary
 * Features:
 * - Score display with percentage
 * - Grade letter (A, B, C, D, E)
 * - Pass/Fail status
 * - Statistics (correct, incorrect, unanswered)
 * - Visual feedback (colors, icons)
 */

import {
  CheckCircle2,
  XCircle,
  Circle,
  Clock,
  FileCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { QuizScore } from "@/lib/utils/quiz-scoring";

// ============================================================================
// TYPES
// ============================================================================

interface ScoreCardProps {
  /**
   * Quiz score data
   */
  score: QuizScore;

  /**
   * Quiz title
   */
  quizTitle?: string;

  /**
   * Show detailed statistics
   */
  showDetails?: boolean;

  /**
   * Is this a laporan mode quiz? (FILE_UPLOAD questions)
   */
  isLaporanMode?: boolean;

  /**
   * Feedback dari dosen (laporan mode only)
   */
  dosenFeedback?: string;

  /**
   * Apakah laporan sudah dinilai dosen? (attempt.status === 'graded')
   * Digunakan untuk membedakan laporan dinilai 0 vs belum dinilai
   */
  isGraded?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ScoreCard({
  score,
  quizTitle,
  showDetails = true,
  isLaporanMode = false,
  dosenFeedback,
  isGraded = false,
  className,
}: ScoreCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <CardHeader
        className={cn(
          "pb-4",
          isLaporanMode
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
            : score.passed
              ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
              : "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">
              {isLaporanMode
                ? "Hasil Laporan Praktikum"
                : "Hasil CBT Praktikum"}
            </CardTitle>
            {quizTitle && (
              <p className="text-sm text-muted-foreground">{quizTitle}</p>
            )}
          </div>

          {/* Status Badge */}
          {isLaporanMode ? (
            isGraded ? (
              <Badge
                className={cn(
                  "text-sm px-3 py-1",
                  score.passed ? "bg-green-600" : "bg-red-600",
                )}
              >
                {score.passed ? "✓ Lulus" : "✗ Perlu Ditingkatkan"}
              </Badge>
            ) : (
              <Badge className="text-sm px-3 py-1 bg-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Menunggu Penilaian
              </Badge>
            )
          ) : (
            <Badge
              variant={score.passed ? "default" : "destructive"}
              className="text-sm px-3 py-1"
            >
              {score.passed ? "✓ Lulus" : "✗ Tidak Lulus"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Score Display */}
        <div className="text-center space-y-2">
          {isLaporanMode ? (
            // LAPORAN MODE: Show "Menunggu Penilaian" or graded score
            <>
              {isGraded ? (
                // Graded: Show poin, persentase, dan lulus/tidak lulus
                <>
                  <div className="flex justify-center">
                    <div
                      className={cn(
                        "inline-flex items-center justify-center w-20 h-20 rounded-full border-4",
                        score.passed
                          ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950"
                          : "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950",
                      )}
                    >
                      {score.passed ? (
                        <FileCheck
                          className={cn(
                            "h-8 w-8",
                            score.passed ? "text-green-600" : "text-red-500",
                          )}
                        />
                      ) : (
                        <FileCheck className="h-8 w-8 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="text-5xl font-bold"
                      style={{
                        color: score.passed
                          ? "var(--color-success, #16a34a)"
                          : "var(--color-destructive, #dc2626)",
                      }}
                    >
                      {score.percentage.toFixed(0)}
                      <span className="text-2xl text-muted-foreground">%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {score.total_poin} dari {score.max_poin} poin
                    </p>
                    <div className="max-w-xs mx-auto">
                      <Progress value={score.percentage} className="h-2 mt-2" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Badge
                      className={cn(
                        "text-sm px-4 py-1",
                        score.passed
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700",
                      )}
                    >
                      {score.passed ? "✓ Lulus" : "✗ Perlu Ditingkatkan"}
                    </Badge>
                  </div>
                  {/* Feedback dosen */}
                  {dosenFeedback && (
                    <div className="mt-3 mx-auto max-w-md rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 px-4 py-3 text-left">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                        💬 Feedback Dosen
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {dosenFeedback}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                // Not graded yet
                <>
                  <div className="flex justify-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950">
                      <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      Menunggu Penilaian
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Laporan Anda telah dikirim dan akan dinilai oleh dosen
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            // NORMAL MODE: Show points and percentage only
            <>
              <div className="flex justify-center">
                <div
                  className={cn(
                    "inline-flex min-w-[150px] items-center justify-center rounded-3xl border px-6 py-4 text-center",
                    score.passed
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
                  )}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                      Poin Diperoleh
                    </p>
                    <p className="mt-1 text-3xl font-bold leading-none">
                      {score.total_poin}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-5xl font-bold">
                    {score.percentage.toFixed(0)}
                    <span className="text-2xl text-muted-foreground">%</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {score.total_poin} dari {score.max_poin} poin
                  </p>
                </div>

                <div className="mx-auto max-w-md">
                  <Progress value={score.percentage} className="h-3" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Statistics - Hide for laporan mode */}
        {showDetails && !isLaporanMode && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Statistik Jawaban
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Correct */}
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {score.correct_count}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Benar</p>
              </div>

              {/* Incorrect */}
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {score.incorrect_count}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Salah</p>
              </div>

              {/* Unanswered */}
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <Circle className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-600">
                  {score.unanswered_count}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tidak Dijawab
                </p>
              </div>
            </div>

            {/* Accuracy */}
            {score.correct_count + score.incorrect_count > 0 && (
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Akurasi</span>
                  <span className="font-semibold">
                    {(
                      (score.correct_count /
                        (score.correct_count + score.incorrect_count)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
