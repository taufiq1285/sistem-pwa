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
import { ArrowLeft, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreCard } from "./ScoreCard";
import { AnswerReviewList } from "./AnswerReview";
import type { Kuis, Soal, Jawaban, AttemptKuis } from "@/types/kuis.types";
import { calculateQuizScore } from "@/lib/utils/quiz-scoring";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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

  // Calculate score
  const score = calculateQuizScore(
    questions,
    answers,
    quiz.passing_score ?? 70,
  );

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
          {canRetake && onRetake && (
            <Button onClick={onRetake}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Ulangi Kuis
            </Button>
          )}
        </div>
      </div>

      {/* Score Card */}
      <ScoreCard score={score} quizTitle={quiz.judul} />

      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Kuis</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Percobaan</p>
            <p className="font-semibold">{attempt.attempt_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Durasi</p>
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

      {/* Answer Review */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Review Jawaban</CardTitle>
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
                  answers={answers}
                  showCorrectAnswers={true}
                />
              </TabsContent>

              <TabsContent value="correct" className="mt-6">
                <AnswerReviewList
                  questions={questions.filter((q) => {
                    const ans = answers.find((a) => a.soal_id === q.id);
                    return ans?.is_correct === true;
                  })}
                  answers={answers}
                  showCorrectAnswers={true}
                />
              </TabsContent>

              <TabsContent value="incorrect" className="mt-6">
                <AnswerReviewList
                  questions={questions.filter((q) => {
                    const ans = answers.find((a) => a.soal_id === q.id);
                    return !ans || ans.is_correct !== true;
                  })}
                  answers={answers}
                  showCorrectAnswers={true}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
