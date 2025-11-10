/**
 * TrueFalse Question Type Component
 * 
 * Purpose: Display and handle true/false questions in quiz builder
 * Used by: QuestionEditor, QuizBuilder (Dosen)
 * Features: Simple true/false selection with visual feedback
 */

import { Check, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface TrueFalseProps {
  /**
   * Current correct answer ('true' or 'false')
   */
  correctAnswer?: string;
  
  /**
   * Callback when correct answer changes
   */
  onChange: (answer: 'true' | 'false') => void;
  
  /**
   * Disabled state (for view mode)
   */
  disabled?: boolean;
  
  /**
   * Show validation errors
   */
  showErrors?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TrueFalse({
  correctAnswer,
  onChange,
  disabled = false,
  showErrors = false,
}: TrueFalseProps) {
  
  const hasAnswer = correctAnswer === 'true' || correctAnswer === 'false';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Label className="text-base font-semibold">
          Jawaban Benar
          <span className="text-destructive ml-1">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Pilih jawaban yang benar untuk soal ini
        </p>
      </div>

      {/* True/False Options */}
      <RadioGroup
        value={correctAnswer}
        onValueChange={(value) => onChange(value as 'true' | 'false')}
        disabled={disabled}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* TRUE Option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            correctAnswer === 'true' && "ring-2 ring-primary border-primary",
            showErrors && !hasAnswer && "ring-2 ring-destructive"
          )}
          onClick={() => !disabled && onChange('true')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <RadioGroupItem
                value="true"
                id="answer-true"
                className={cn(
                  "transition-all",
                  correctAnswer === 'true' && "border-primary"
                )}
              />
              
              <Label
                htmlFor="answer-true"
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      correctAnswer === 'true'
                        ? "bg-green-500 text-white"
                        : "bg-green-100 text-green-700"
                    )}>
                      <Check className="h-5 w-5" />
                    </div>
                    
                    <div>
                      <div className="font-semibold text-lg">Benar</div>
                      <div className="text-sm text-muted-foreground">
                        Pernyataan ini benar
                      </div>
                    </div>
                  </div>
                  
                  {correctAnswer === 'true' && (
                    <div className="text-primary">
                      <Check className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* FALSE Option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            correctAnswer === 'false' && "ring-2 ring-primary border-primary",
            showErrors && !hasAnswer && "ring-2 ring-destructive"
          )}
          onClick={() => !disabled && onChange('false')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <RadioGroupItem
                value="false"
                id="answer-false"
                className={cn(
                  "transition-all",
                  correctAnswer === 'false' && "border-primary"
                )}
              />
              
              <Label
                htmlFor="answer-false"
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      correctAnswer === 'false'
                        ? "bg-red-500 text-white"
                        : "bg-red-100 text-red-700"
                    )}>
                      <X className="h-5 w-5" />
                    </div>
                    
                    <div>
                      <div className="font-semibold text-lg">Salah</div>
                      <div className="text-sm text-muted-foreground">
                        Pernyataan ini salah
                      </div>
                    </div>
                  </div>
                  
                  {correctAnswer === 'false' && (
                    <div className="text-primary">
                      <Check className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </Label>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>

      {/* Validation Messages */}
      {showErrors && !hasAnswer && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            ⚠️ Pilih jawaban yang benar (Benar atau Salah)
          </p>
        </div>
      )}

      {/* Info Message */}
      {!showErrors && hasAnswer && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          <span>
            Jawaban benar: <strong>{correctAnswer === 'true' ? 'Benar' : 'Salah'}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate true/false answer
 */
export function validateTrueFalse(correctAnswer?: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!correctAnswer || (correctAnswer !== 'true' && correctAnswer !== 'false')) {
    errors.push('Jawaban benar harus dipilih (Benar atau Salah)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format answer for display
 */
export function formatTrueFalseAnswer(answer?: string): string {
  if (answer === 'true') return 'Benar';
  if (answer === 'false') return 'Salah';
  return '-';
}

/**
 * Parse answer from string
 */
export function parseTrueFalseAnswer(answer: string): 'true' | 'false' | undefined {
  const normalized = answer.toLowerCase().trim();
  
  if (normalized === 'true' || normalized === 'benar' || normalized === '1') {
    return 'true';
  }
  
  if (normalized === 'false' || normalized === 'salah' || normalized === '0') {
    return 'false';
  }
  
  return undefined;
}