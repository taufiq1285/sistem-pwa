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
  Trophy,
  TrendingUp,
  Clock,
  FileCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { QuizScore } from "@/lib/utils/quiz-scoring";
import { getGradeColor } from "@/lib/utils/quiz-scoring";

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
  className,
}: ScoreCardProps) {
  const isExcellent = score.percentage >= 90;
  const isGood = score.percentage >= 70 && score.percentage < 90;
  const isPoor = score.percentage < 60;

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
              Hasil Tugas Praktikum
            </CardTitle>
            {quizTitle && (
              <p className="text-sm text-muted-foreground">{quizTitle}</p>
            )}
          </div>

          {/* Status Badge */}
          {isLaporanMode ? (
            <Badge className="text-sm px-3 py-1 bg-blue-600">
              <Clock className="h-3 w-3 mr-1" />
              Menunggu Penilaian
            </Badge>
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
            // LAPORAN MODE: Show "Menunggu Penilaian" or just points (no letter grade)
            <>
              {score.total_poin > 0 ? (
                // Graded: Show only points, no letter grade
                <>
                  <div className="flex justify-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950">
                      <FileCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                      {score.total_poin}
                      <span className="text-2xl text-muted-foreground">
                        {" "}
                        / {score.max_poin}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Poin Diperoleh
                    </p>
                  </div>
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
            // NORMAL MODE: Show grade and percentage
            <>
              {/* Grade Letter */}
              <div className="flex justify-center">
                <div
                  className={cn(
                    "inline-flex items-center justify-center w-20 h-20 rounded-full border-4 text-3xl font-bold",
                    getGradeColor(score.grade),
                  )}
                >
                  {score.grade}
                </div>
              </div>

              {/* Percentage */}
              <div>
                <div className="text-5xl font-bold">
                  {score.percentage.toFixed(1)}
                  <span className="text-2xl text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {score.total_poin} dari {score.max_poin} poin
                </p>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <Progress value={score.percentage} className="h-3" />
              </div>

              {/* Status Message */}
              <div className="pt-2">
                {isExcellent && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Trophy className="h-5 w-5" />
                    <span className="font-semibold">Luar Biasa!</span>
                  </div>
                )}
                {isGood && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-semibold">Bagus!</span>
                  </div>
                )}
                {isPoor && (
                  <div className="flex items-center justify-center gap-2 text-orange-600">
                    <span className="font-semibold">Perlu Ditingkatkan</span>
                  </div>
                )}
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
