/**
 * AnswerReview Component
 *
 * Purpose: Display detailed answer review for each question
 * Features:
 * - Show question with answer
 * - Correct/Incorrect indicator
 * - Correct answer display
 * - Feedback/explanation
 * - Points earned
 */

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Circle,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Soal, Jawaban } from "@/types/kuis.types";
import { TIPE_SOAL } from "@/types/kuis.types";
import {
  getAnswerLabel,
  getCorrectAnswerLabel,
} from "@/lib/utils/quiz-scoring";

// ============================================================================
// TYPES
// ============================================================================

interface AnswerReviewProps {
  /**
   * Question data
   */
  soal: Soal;

  /**
   * Student's answer
   */
  jawaban?: Jawaban;

  /**
   * Question number
   */
  number: number;

  /**
   * Show correct answer (default: true after submission)
   */
  showCorrectAnswer?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Start with detail expanded
   */
  defaultExpanded?: boolean;

  /**
   * Controlled expanded state from parent
   */
  expanded?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AnswerReview({
  soal,
  jawaban,
  number,
  showCorrectAnswer = true,
  className,
  defaultExpanded = false,
  expanded,
}: AnswerReviewProps) {
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const isAnswered = !!(jawaban?.jawaban || jawaban?.jawaban_mahasiswa);
  const isCorrect = jawaban?.is_correct ?? false;
  const poinDiperoleh = jawaban?.poin_diperoleh ?? 0;
  const needsManualGrading = soal.tipe_soal !== TIPE_SOAL.PILIHAN_GANDA;
  const explanation = soal.penjelasan || (soal as any).pembahasan || "";
  const shouldShowManualFeedback =
    Boolean(jawaban?.feedback?.trim()) && needsManualGrading;
  const isExpanded = expanded ?? localExpanded;

  // For manually graded questions
  const isManuallyGraded =
    needsManualGrading &&
    jawaban?.poin_diperoleh !== null &&
    jawaban?.poin_diperoleh !== undefined;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">Soal {number}</Badge>
              <Badge variant="secondary">{soal.poin} poin</Badge>
              <Badge variant="outline">
                {soal.tipe_soal === TIPE_SOAL.PILIHAN_GANDA
                  ? "CBT"
                  : soal.tipe_soal}
              </Badge>
            </div>
            <CardTitle className="text-base font-medium">
              {soal.pertanyaan}
            </CardTitle>
          </div>

          {/* Status Icon */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLocalExpanded((value) => !value)}
              className="h-8 px-2 text-xs font-semibold"
              disabled={expanded !== undefined}
            >
              Detail
              <ChevronDown
                className={cn(
                  "ml-1 h-4 w-4 transition-transform",
                  isExpanded && "rotate-180",
                )}
              />
            </Button>
            {!isAnswered ? (
              <Circle className="h-6 w-6 text-gray-500" />
            ) : isCorrect ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
      </CardHeader>

      {!isExpanded && (
        <CardContent className="pb-4">
          <div className="flex flex-col gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-muted-foreground">
              Jawaban Anda
            </span>
            <span
              className={cn(
                "font-semibold",
                isCorrect ? "text-green-700" : "text-red-700",
              )}
            >
              {isAnswered
                ? getAnswerLabel(
                    soal,
                    jawaban?.jawaban || jawaban?.jawaban_mahasiswa || "",
                  )
                : "Tidak dijawab"}
            </span>
            <span
              className={cn(
                "font-bold",
                isCorrect ? "text-green-700" : "text-red-700",
              )}
            >
              {poinDiperoleh} / {soal.poin}
            </span>
          </div>
        </CardContent>
      )}

      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Points Earned */}
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
            <span className="text-sm font-medium">Poin Diperoleh</span>
            <span
              className={cn(
                "text-lg font-bold",
                isCorrect ? "text-green-600" : "text-red-600",
              )}
            >
              {poinDiperoleh} / {soal.poin}
            </span>
          </div>

          {/* Student's Answer */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Jawaban Anda:
            </p>
            {!isAnswered ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Tidak dijawab</AlertDescription>
              </Alert>
            ) : soal.tipe_soal === TIPE_SOAL.FILE_UPLOAD ? (
              // FILE_UPLOAD: Show file link or typed text
              <div className="p-3 rounded-lg border-2 border-blue-300 bg-blue-50 dark:bg-blue-950">
                {(jawaban.jawaban || jawaban.jawaban_mahasiswa)?.startsWith(
                  "http",
                ) ? (
                  // File upload - show link
                  <a
                    href={jawaban.jawaban || jawaban.jawaban_mahasiswa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="underline">Lihat File Laporan</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  // Typed text - show content
                  <p className="whitespace-pre-wrap">
                    {jawaban.jawaban || jawaban.jawaban_mahasiswa}
                  </p>
                )}
              </div>
            ) : (
              // Other types - show answer with coloring
              <div
                className={cn(
                  "p-3 rounded-lg border-2",
                  isCorrect
                    ? "border-green-300 bg-green-50 dark:bg-green-950"
                    : "border-red-300 bg-red-50 dark:bg-red-950",
                )}
              >
                <p className="whitespace-pre-wrap">
                  {getAnswerLabel(
                    soal,
                    jawaban.jawaban || jawaban.jawaban_mahasiswa || "",
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Correct Answer (only for auto-graded questions) */}
          {showCorrectAnswer &&
            !needsManualGrading &&
            !isCorrect &&
            isAnswered && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Jawaban yang Benar:
                </p>
                <div className="p-3 rounded-lg border-2 border-green-300 bg-green-50 dark:bg-green-950">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {getCorrectAnswerLabel(soal)}
                  </p>
                </div>
              </div>
            )}

          {/* Explanation/Feedback */}
          {!needsManualGrading && explanation.trim() && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Keterangan Jawaban:
              </p>
              <Alert className="bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100">
                <AlertDescription className="whitespace-pre-wrap">
                  {explanation}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Manual Grading Feedback */}
          {shouldShowManualFeedback && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Feedback dari Dosen:
              </p>
              <Alert className="bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-100">
                <AlertDescription className="whitespace-pre-wrap">
                  {jawaban.feedback}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Needs Manual Grading Notice */}
          {needsManualGrading && !isManuallyGraded && isAnswered && (
            <Alert className="bg-yellow-50 border-yellow-300 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Jawaban Anda sedang menunggu penilaian dari dosen.
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-graded Success */}
          {!needsManualGrading && isCorrect && (
            <Alert className="bg-green-50 border-green-300 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Benar!</strong> Jawaban Anda tepat.
                {!explanation.trim() &&
                  " Dosen belum menambahkan keterangan untuk soal ini."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// LIST COMPONENT
// ============================================================================

interface AnswerReviewListProps {
  /**
   * List of questions
   */
  questions: Soal[];

  /**
   * List of answers
   */
  answers: Jawaban[];

  /**
   * Show correct answers
   */
  showCorrectAnswers?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Expand every answer card
   */
  expandAll?: boolean;
}

/**
 * Display list of all answers with review
 */
export function AnswerReviewList({
  questions,
  answers,
  showCorrectAnswers = true,
  className,
  expandAll = false,
}: AnswerReviewListProps) {
  // Create answer map for quick lookup
  const answerMap = new Map<string, Jawaban>();
  answers.forEach((a) => answerMap.set(a.soal_id, a));

  return (
    <div className={cn("space-y-4", className)}>
      {questions.map((soal, index) => (
        <AnswerReview
          key={`${soal.id}-${expandAll ? "expanded" : "compact"}`}
          soal={soal}
          jawaban={answerMap.get(soal.id)}
          number={index + 1}
          showCorrectAnswer={showCorrectAnswers}
          defaultExpanded={expandAll || questions.length <= 3 || index === 0}
          expanded={expandAll ? true : undefined}
        />
      ))}
    </div>
  );
}
