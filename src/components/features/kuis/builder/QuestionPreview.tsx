/**
 * QuestionPreview Component
 *
 * Purpose: Universal preview for all question types
 * Used by: QuizBuilder, QuestionEditor (Dosen)
 * Features: Display-only view of questions as students will see them
 */

import { Eye, FileText, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import type { Soal, OpsiJawaban } from "@/types/kuis.types";
import { TIPE_SOAL, TIPE_SOAL_LABELS } from "@/types/kuis.types";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface QuestionPreviewProps {
  /**
   * Question data to preview
   */
  question: Soal | QuestionPreviewData;

  /**
   * Question number
   */
  questionNumber?: number;

  /**
   * Show correct answers (for review mode)
   */
  showAnswers?: boolean;

  /**
   * Show explanation/rubric
   */
  showExplanation?: boolean;

  /**
   * Compact mode (smaller, less detail)
   */
  compact?: boolean;

  /**
   * Student's answer (for review mode)
   */
  studentAnswer?: string | undefined;
}

// For builder preview (before question is saved)
export interface QuestionPreviewData {
  pertanyaan: string;
  tipe_soal: string;
  poin: number;
  opsi_jawaban?: OpsiJawaban[];
  jawaban_benar?: string;
  penjelasan?: string;
  rubrik_penilaian?: string;
  minWords?: number;
  maxWords?: number;
  characterLimit?: number;
  expectedAnswer?: string;
  acceptedAnswers?: string[];
  keywords?: string[];
  caseSensitive?: boolean;
  maxLength?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuestionPreview({
  question,
  questionNumber,
  showAnswers = false,
  showExplanation = false,
  compact = false,
  studentAnswer,
}: QuestionPreviewProps) {
  if (!question) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Data soal tidak tersedia</AlertDescription>
      </Alert>
    );
  }

  const tipeLabel =
    TIPE_SOAL_LABELS[question.tipe_soal as keyof typeof TIPE_SOAL_LABELS] ||
    question.tipe_soal;

  return (
    <Card className={cn(compact && "border-dashed")}>
      <CardHeader className={cn(compact && "pb-3")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {questionNumber && (
                <Badge variant="outline" className="text-sm">
                  Soal #{questionNumber}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {tipeLabel}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.poin} poin
              </Badge>
            </div>
            <CardTitle className={cn("text-base", compact && "text-sm")}>
              {question.pertanyaan}
            </CardTitle>
          </div>

          <Eye className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question Type Specific Preview */}
        {question.tipe_soal === TIPE_SOAL.PILIHAN_GANDA && (
          <PreviewMultipleChoice
            options={question.opsi_jawaban || []}
            showAnswers={showAnswers}
            studentAnswer={studentAnswer}
            compact={compact}
          />
        )}

        {question.tipe_soal === TIPE_SOAL.ESSAY && (
          <PreviewEssay
            minWords={(question as any).minWords}
            maxWords={(question as any).maxWords}
            characterLimit={(question as any).characterLimit}
            rubric={(question as any).rubrik_penilaian}
            showRubric={showExplanation}
            studentAnswer={studentAnswer}
            compact={compact}
          />
        )}

        {/* Explanation / Pembahasan */}
        {showExplanation && question.penjelasan && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Pembahasan:</Label>
              <div className="p-3 bg-muted rounded-lg text-sm">
                {question.penjelasan}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENTS - QUESTION TYPE PREVIEWS
// ============================================================================

/**
 * Multiple Choice Preview
 */
function PreviewMultipleChoice({
  options,
  showAnswers,
  studentAnswer,
  compact,
}: {
  options: OpsiJawaban[];
  showAnswers?: boolean;
  studentAnswer?: string | undefined;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label className={cn("text-sm font-medium", compact && "text-xs")}>
        Pilih satu jawaban yang benar:
      </Label>

      <RadioGroup value={studentAnswer} disabled>
        {options.map((option: OpsiJawaban, index: number) => {
          const isCorrect = option.is_correct;
          const isStudentAnswer = studentAnswer === option.id;

          return (
            <div
              key={option.id || index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                showAnswers &&
                  isCorrect &&
                  "border-green-500 bg-green-50 dark:bg-green-950",
                showAnswers &&
                  isStudentAnswer &&
                  !isCorrect &&
                  "border-red-500 bg-red-50 dark:bg-red-950",
                compact && "p-2",
              )}
            >
              <RadioGroupItem
                value={option.id}
                id={`preview-option-${option.id}`}
                disabled
              />

              <Label
                htmlFor={`preview-option-${option.id}`}
                className={cn("flex-1 cursor-default", compact && "text-sm")}
              >
                <span className="font-semibold mr-2">{option.label}.</span>
                {option.text}
              </Label>

              {showAnswers && isCorrect && (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}

/**
 * Essay Preview
 */
function PreviewEssay({
  minWords,
  maxWords,
  characterLimit,
  rubric,
  showRubric,
  studentAnswer,
  compact,
}: {
  minWords?: number;
  maxWords?: number;
  characterLimit?: number;
  rubric?: string;
  showRubric?: boolean;
  studentAnswer?: string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Label className={cn("text-sm font-medium", compact && "text-xs")}>
          Tulis jawaban essay Anda:
        </Label>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Requirements */}
      {(minWords || maxWords || characterLimit) && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {minWords && <Badge variant="outline">Min: {minWords} kata</Badge>}
          {maxWords && <Badge variant="outline">Max: {maxWords} kata</Badge>}
          {characterLimit && (
            <Badge variant="outline">Max: {characterLimit} karakter</Badge>
          )}
        </div>
      )}

      {/* Essay Input Area */}
      <Textarea
        value={studentAnswer || ""}
        placeholder="Tulis jawaban essay Anda di sini..."
        rows={compact ? 4 : 8}
        disabled
        className="resize-none"
      />

      {/* Rubric */}
      {showRubric && rubric && (
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <Label className="text-xs font-semibold">Rubrik Penilaian:</Label>
          <pre className="text-xs whitespace-pre-wrap font-mono">{rubric}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get icon for question type
 */
export function getQuestionTypeIcon(tipesoal: string) {
  switch (tipesoal) {
    case TIPE_SOAL.PILIHAN_GANDA:
      return Circle;
    case TIPE_SOAL.ESSAY:
      return FileText;
    default:
      return Circle;
  }
}

/**
 * Get color class for question type
 */
export function getQuestionTypeColor(tipeSoal: string): string {
  switch (tipeSoal) {
    case TIPE_SOAL.PILIHAN_GANDA:
      return "text-blue-600";
    case TIPE_SOAL.ESSAY:
      return "text-purple-600";
    default:
      return "text-gray-600";
  }
}
