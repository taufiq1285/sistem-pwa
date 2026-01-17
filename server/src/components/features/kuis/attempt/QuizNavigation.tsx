import { CheckCircle2, Circle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface QuestionStatus {
  /**
   * Question number (1-based)
   */
  number: number;

  /**
   * Question ID
   */
  id: string;

  /**
   * Is this question answered?
   */
  isAnswered: boolean;

  /**
   * Is this question flagged for review?
   */
  isFlagged?: boolean;
}

interface QuizNavigationProps {
  /**
   * List of questions with their status
   */
  questions: QuestionStatus[];

  /**
   * Current active question number (1-based)
   */
  currentQuestion: number;

  /**
   * Callback when question is clicked
   */
  onQuestionClick: (questionNumber: number) => void;

  /**
   * Compact mode (hide progress details)
   */
  compact?: boolean;

  /**
   * Total points possible
   */
  totalPoints?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuizNavigation({
  questions,
  currentQuestion,
  onQuestionClick,
  compact = false,
  totalPoints,
}: QuizNavigationProps) {
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => q.isAnswered).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = questions.filter((q) => q.isFlagged).length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Navigasi Soal</CardTitle>
          <Badge variant="outline" className="text-sm">
            {answeredCount}/{totalQuestions}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {!compact && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Status Summary */}
        {!compact && (
          <div className="grid grid-cols-2 gap-3 py-3">
            {/* Answered */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Terjawab</p>
                <p className="text-sm font-semibold">{answeredCount}</p>
              </div>
            </div>

            {/* Unanswered */}
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-muted-foreground">Belum</p>
                <p className="text-sm font-semibold">{unansweredCount}</p>
              </div>
            </div>

            {/* Flagged (if any) */}
            {flaggedCount > 0 && (
              <div className="flex items-center gap-2 col-span-2">
                <Flag className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Ditandai</p>
                  <p className="text-sm font-semibold">{flaggedCount}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question Grid */}
        <div>
          <p className="text-sm font-medium mb-3">Nomor Soal</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((question) => {
              const isActive = question.number === currentQuestion;
              const isAnswered = question.isAnswered;
              const isFlagged = question.isFlagged;

              return (
                <Button
                  key={question.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onQuestionClick(question.number)}
                  className={cn(
                    "relative h-10 w-full",
                    isAnswered &&
                      !isActive &&
                      "border-green-500 hover:border-green-600",
                    isFlagged && "ring-2 ring-yellow-400",
                  )}
                >
                  <span className="font-semibold">{question.number}</span>

                  {/* Answered Indicator */}
                  {isAnswered && !isActive && (
                    <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-green-600 bg-white rounded-full" />
                  )}

                  {/* Flagged Indicator */}
                  {isFlagged && (
                    <Flag className="absolute -top-1 -left-1 h-3 w-3 text-yellow-600 bg-white rounded-full" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        {!compact && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Keterangan:
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-primary bg-primary" />
                <span>Soal aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-green-500">
                  <CheckCircle2 className="h-3 w-3 text-green-600 ml-auto -mt-1 -mr-1" />
                </div>
                <span>Sudah dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-gray-300" />
                <span>Belum dijawab</span>
              </div>
              {flaggedCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border-2 ring-2 ring-yellow-400">
                    <Flag className="h-3 w-3 text-yellow-600 -mt-1 -ml-1" />
                  </div>
                  <span>Ditandai untuk review</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Total Points (if provided) */}
        {!compact && totalPoints && (
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Poin</span>
              <Badge variant="secondary" className="text-sm font-semibold">
                {totalPoints} poin
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create question status array from soal list and answers
 */
export function createQuestionStatusList(
  questions: Array<{ id: string }>,
  answers: Record<string, any>,
): QuestionStatus[] {
  return questions.map((question, index) => ({
    number: index + 1,
    id: question.id,
    isAnswered: !!answers[question.id],
    isFlagged: false, // Can be enhanced later
  }));
}

/**
 * Get navigation summary
 */
export function getNavigationSummary(questions: QuestionStatus[]): {
  total: number;
  answered: number;
  unanswered: number;
  flagged: number;
  percentage: number;
} {
  const total = questions.length;
  const answered = questions.filter((q) => q.isAnswered).length;
  const flagged = questions.filter((q) => q.isFlagged).length;

  return {
    total,
    answered,
    unanswered: total - answered,
    flagged,
    percentage: total > 0 ? (answered / total) * 100 : 0,
  };
}

/**
 * Find next unanswered question
 */
export function findNextUnanswered(
  questions: QuestionStatus[],
  currentNumber: number,
): number | null {
  // Look forward first
  const forward = questions.find(
    (q) => q.number > currentNumber && !q.isAnswered,
  );
  if (forward) return forward.number;

  // Look backward
  const backward = questions.find(
    (q) => q.number < currentNumber && !q.isAnswered,
  );
  if (backward) return backward.number;

  return null;
}

/**
 * Check if all questions are answered
 */
export function areAllQuestionsAnswered(questions: QuestionStatus[]): boolean {
  return questions.every((q) => q.isAnswered);
}

/**
 * Get unanswered question numbers
 */
export function getUnansweredQuestions(questions: QuestionStatus[]): number[] {
  return questions.filter((q) => !q.isAnswered).map((q) => q.number);
}
