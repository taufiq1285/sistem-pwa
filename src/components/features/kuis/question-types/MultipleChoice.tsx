/**
 * MultipleChoice Question Type Component
 * 
 * Purpose: Display and handle multiple choice questions in quiz builder
 * Used by: QuestionEditor, QuizBuilder (Dosen)
 * Features: Add/remove options, set correct answer, validation
 */

import { Trash2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { OpsiJawaban } from '@/types/kuis.types';

// ============================================================================
// TYPES
// ============================================================================

interface MultipleChoiceProps {
  /**
   * Current options (A, B, C, D, etc.)
   */
  options: OpsiJawaban[];
  
  /**
   * Callback when options change
   */
  onChange: (options: OpsiJawaban[]) => void;
  
  /**
   * ID of the correct answer option
   */
  correctAnswerId?: string;
  
  /**
   * Callback when correct answer changes
   */
  onCorrectAnswerChange: (optionId: string) => void;
  
  /**
   * Disabled state (for view mode)
   */
  disabled?: boolean;
  
  /**
   * Show validation errors
   */
  showErrors?: boolean;
  
  /**
   * Minimum number of options (default: 2)
   */
  minOptions?: number;
  
  /**
   * Maximum number of options (default: 6)
   */
  maxOptions?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const DEFAULT_OPTIONS: OpsiJawaban[] = [
  { id: '1', label: 'A', text: '', is_correct: false },
  { id: '2', label: 'B', text: '', is_correct: false },
  { id: '3', label: 'C', text: '', is_correct: false },
  { id: '4', label: 'D', text: '', is_correct: false },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function MultipleChoice({
  options = DEFAULT_OPTIONS,
  onChange,
  correctAnswerId,
  onCorrectAnswerChange,
  disabled = false,
  showErrors = false,
  minOptions = 2,
  maxOptions = 6,
}: MultipleChoiceProps) {
  
  // Validation states
  const hasCorrectAnswer = options.some((opt) => opt.is_correct);
  const hasEmptyOptions = options.some((opt) => !opt.text.trim());
  const canAddMore = options.length < maxOptions;
  const canRemove = options.length > minOptions;

  /**
   * Add new option
   */
  const handleAddOption = () => {
    if (!canAddMore) return;

    const newOption: OpsiJawaban = {
      id: Date.now().toString(),
      label: OPTION_LABELS[options.length] || `Option ${options.length + 1}`,
      text: '',
      is_correct: false,
    };

    onChange([...options, newOption]);
  };

  /**
   * Remove option by ID
   */
  const handleRemoveOption = (optionId: string) => {
    if (!canRemove) return;

    const updatedOptions = options.filter((opt) => opt.id !== optionId);
    
    // Re-assign labels (A, B, C, D...)
    const relabeledOptions = updatedOptions.map((opt, index) => ({
      ...opt,
      label: OPTION_LABELS[index] || `Option ${index + 1}`,
    }));

    onChange(relabeledOptions);

    // Clear correct answer if deleted option was correct
    if (correctAnswerId === optionId) {
      onCorrectAnswerChange('');
    }
  };

  /**
   * Update option text
   */
  const handleUpdateOption = (optionId: string, text: string) => {
    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, text } : opt
    );
    onChange(updatedOptions);
  };

  /**
   * Set correct answer
   */
  const handleSetCorrectAnswer = (optionId: string) => {
    const updatedOptions = options.map((opt) => ({
      ...opt,
      is_correct: opt.id === optionId,
    }));
    
    onChange(updatedOptions);
    onCorrectAnswerChange(optionId);
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Pilihan Jawaban
          <span className="text-destructive ml-1">*</span>
        </Label>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          disabled={disabled || !canAddMore}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Opsi
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-sm text-muted-foreground">
        Minimal {minOptions} opsi, maksimal {maxOptions} opsi. 
        Pilih satu jawaban yang benar dengan mengklik radio button.
      </p>

      {/* Options List */}
      <div className="space-y-3">
        <RadioGroup
          value={correctAnswerId}
          onValueChange={handleSetCorrectAnswer}
          disabled={disabled}
        >
          {options.map((option) => (
            <Card
              key={option.id}
              className={cn(
                "transition-all",
                option.is_correct && "ring-2 ring-primary",
                showErrors && !option.text.trim() && "ring-2 ring-destructive"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Radio Button for Correct Answer */}
                  <div className="flex items-center space-x-2 pt-2">
                    <RadioGroupItem
                      value={option.id}
                      id={`option-${option.id}`}
                      disabled={disabled}
                      className={cn(
                        "transition-all",
                        option.is_correct && "border-primary"
                      )}
                    />
                    <Label
                      htmlFor={`option-${option.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {option.is_correct && (
                        <Check className="h-4 w-4 text-primary inline mr-1" />
                      )}
                    </Label>
                  </div>

                  {/* Option Label */}
                  <div className="flex-shrink-0 pt-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
                      option.is_correct 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {option.label}
                    </div>
                  </div>

                  {/* Option Text Input */}
                  <div className="flex-1">
                    <Input
                      placeholder={`Opsi ${option.label}`}
                      value={option.text}
                      onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                      disabled={disabled}
                      className={cn(
                        showErrors && !option.text.trim() && "border-destructive"
                      )}
                    />
                    {showErrors && !option.text.trim() && (
                      <p className="text-xs text-destructive mt-1">
                        Opsi tidak boleh kosong
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  {canRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(option.id)}
                      disabled={disabled}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </div>

      {/* Validation Messages */}
      {showErrors && (
        <div className="space-y-2">
          {!hasCorrectAnswer && (
            <p className="text-sm text-destructive">
              ⚠️ Pilih satu jawaban yang benar dengan mengklik radio button
            </p>
          )}
          
          {hasEmptyOptions && (
            <p className="text-sm text-destructive">
              ⚠️ Semua opsi harus diisi
            </p>
          )}
        </div>
      )}

      {/* Info Messages */}
      {!showErrors && (
        <div className="space-y-2">
          {options.length >= maxOptions && (
            <p className="text-sm text-muted-foreground">
              ℹ️ Maksimal {maxOptions} opsi telah tercapai
            </p>
          )}
          
          {hasCorrectAnswer && (
            <p className="text-sm text-green-600">
              ✓ Jawaban benar: Opsi {options.find(opt => opt.is_correct)?.label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate multiple choice options
 */
export function validateMultipleChoice(options: OpsiJawaban[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check minimum options
  if (options.length < 2) {
    errors.push('Minimal 2 opsi jawaban diperlukan');
  }

  // Check maximum options
  if (options.length > 6) {
    errors.push('Maksimal 6 opsi jawaban');
  }

  // Check empty options
  const hasEmptyOptions = options.some((opt) => !opt.text.trim());
  if (hasEmptyOptions) {
    errors.push('Semua opsi harus diisi');
  }

  // Check correct answer
  const correctAnswers = options.filter((opt) => opt.is_correct);
  if (correctAnswers.length === 0) {
    errors.push('Harus ada satu jawaban yang benar');
  }
  if (correctAnswers.length > 1) {
    errors.push('Hanya boleh ada satu jawaban yang benar');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate default options
 */
export function generateDefaultOptions(count: number = 4): OpsiJawaban[] {
  return Array.from({ length: count }, (_, i) => ({
    id: (i + 1).toString(),
    label: OPTION_LABELS[i] || `Option ${i + 1}`,
    text: '',
    is_correct: false,
  }));
}