/**
 * Essay Question Type Component
 * 
 * Purpose: Essay question input for quiz builder
 * Used by: QuestionEditor (Dosen)
 * Features: Character limit, word count, rubric/grading guidelines
 */

import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface EssayProps {
  /**
   * Minimum word count (optional)
   */
  minWords?: number;
  
  /**
   * Maximum word count (optional)
   */
  maxWords?: number;
  
  /**
   * Character limit (optional)
   */
  characterLimit?: number;
  
  /**
   * Grading rubric/guidelines
   */
  rubric?: string;
  
  /**
   * Callback when settings change
   */
  onChange: (settings: EssaySettings) => void;
  
  /**
   * Disabled state (for view mode)
   */
  disabled?: boolean;
  
  /**
   * Show validation errors
   */
  showErrors?: boolean;
}

export interface EssaySettings {
  minWords?: number;
  maxWords?: number;
  characterLimit?: number;
  rubric?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MIN_WORDS = 50;
const DEFAULT_MAX_WORDS = 500;
const DEFAULT_CHARACTER_LIMIT = 5000;

// ============================================================================
// COMPONENT
// ============================================================================

export function Essay({
  minWords = DEFAULT_MIN_WORDS,
  maxWords = DEFAULT_MAX_WORDS,
  characterLimit = DEFAULT_CHARACTER_LIMIT,
  rubric = '',
  onChange,
  disabled = false,
  showErrors = false,
}: EssayProps) {
  
  /**
   * Handle min words change
   */
  const handleMinWordsChange = (value: string) => {
    const num = parseInt(value) || 0;
    onChange({
      minWords: num,
      maxWords,
      characterLimit,
      rubric,
    });
  };
  
  /**
   * Handle max words change
   */
  const handleMaxWordsChange = (value: string) => {
    const num = parseInt(value) || 0;
    onChange({
      minWords,
      maxWords: num,
      characterLimit,
      rubric,
    });
  };
  
  /**
   * Handle character limit change
   */
  const handleCharacterLimitChange = (value: string) => {
    const num = parseInt(value) || 0;
    onChange({
      minWords,
      maxWords,
      characterLimit: num,
      rubric,
    });
  };
  
  /**
   * Handle rubric change
   */
  const handleRubricChange = (value: string) => {
    onChange({
      minWords,
      maxWords,
      characterLimit,
      rubric: value,
    });
  };
  
  // Validation
  const hasMinMaxError = maxWords > 0 && minWords > maxWords;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <div>
          <Label className="text-base font-semibold">Pengaturan Essay</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Atur batasan dan panduan penilaian untuk soal essay
          </p>
        </div>
      </div>
      
      {/* Word Count Limits */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Batasan Jumlah Kata
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Min Words */}
              <div className="space-y-2">
                <Label htmlFor="minWords" className="text-sm">
                  Minimal Kata <span className="text-muted-foreground">(Opsional)</span>
                </Label>
                <Input
                  id="minWords"
                  type="number"
                  min={0}
                  max={10000}
                  value={minWords}
                  onChange={(e) => handleMinWordsChange(e.target.value)}
                  disabled={disabled}
                  placeholder="0 = tidak ada batasan"
                  className={cn(
                    showErrors && hasMinMaxError && "border-destructive"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Jumlah kata minimal yang harus ditulis mahasiswa
                </p>
              </div>
              
              {/* Max Words */}
              <div className="space-y-2">
                <Label htmlFor="maxWords" className="text-sm">
                  Maksimal Kata <span className="text-muted-foreground">(Opsional)</span>
                </Label>
                <Input
                  id="maxWords"
                  type="number"
                  min={0}
                  max={10000}
                  value={maxWords}
                  onChange={(e) => handleMaxWordsChange(e.target.value)}
                  disabled={disabled}
                  placeholder="0 = tidak ada batasan"
                  className={cn(
                    showErrors && hasMinMaxError && "border-destructive"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Jumlah kata maksimal yang dapat ditulis mahasiswa
                </p>
              </div>
            </div>
            
            {showErrors && hasMinMaxError && (
              <p className="text-sm text-destructive mt-2">
                ⚠️ Maksimal kata harus lebih besar dari minimal kata
              </p>
            )}
            
            {/* Word Count Summary */}
            {(minWords > 0 || maxWords > 0) && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  Mahasiswa harus menulis{' '}
                  {minWords > 0 && maxWords > 0 && (
                    <strong>antara {minWords} - {maxWords} kata</strong>
                  )}
                  {minWords > 0 && maxWords === 0 && (
                    <strong>minimal {minWords} kata</strong>
                  )}
                  {minWords === 0 && maxWords > 0 && (
                    <strong>maksimal {maxWords} kata</strong>
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Character Limit */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="characterLimit" className="text-sm font-medium">
              Batas Karakter <span className="text-muted-foreground">(Opsional)</span>
            </Label>
            <Input
              id="characterLimit"
              type="number"
              min={0}
              max={50000}
              value={characterLimit}
              onChange={(e) => handleCharacterLimitChange(e.target.value)}
              disabled={disabled}
              placeholder="0 = tidak ada batasan"
            />
            <p className="text-xs text-muted-foreground">
              Jumlah karakter maksimal (termasuk spasi dan tanda baca)
            </p>
            
            {characterLimit > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">
                  Max: {characterLimit.toLocaleString('id-ID')} karakter
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ≈ {Math.round(characterLimit / 5)} kata
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Grading Rubric */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rubric" className="text-sm font-medium">
              Panduan Penilaian / Rubrik <span className="text-muted-foreground">(Opsional)</span>
            </Label>
            <Textarea
              id="rubric"
              value={rubric}
              onChange={(e) => handleRubricChange(e.target.value)}
              disabled={disabled}
              placeholder="Contoh:&#10;- Kelengkapan jawaban (40%)&#10;- Ketepatan konsep (30%)&#10;- Struktur & tata bahasa (20%)&#10;- Referensi & sumber (10%)"
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Panduan untuk dosen dalam menilai jawaban essay mahasiswa
            </p>
            
            {rubric && (
              <div className="mt-2">
                <Badge variant="secondary">
                  {rubric.length} karakter
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Catatan:</strong> Soal essay akan dinilai secara manual oleh dosen. 
          Mahasiswa akan melihat skor setelah dosen memberikan penilaian.
        </AlertDescription>
      </Alert>
      
      {/* Preview Settings */}
      {!disabled && (
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Preview Pengaturan</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Tipe Soal:</span>
              <Badge>Essay</Badge>
            </div>
            {minWords > 0 && (
              <div className="flex items-center justify-between">
                <span>Min. Kata:</span>
                <span className="font-medium text-foreground">{minWords} kata</span>
              </div>
            )}
            {maxWords > 0 && (
              <div className="flex items-center justify-between">
                <span>Max. Kata:</span>
                <span className="font-medium text-foreground">{maxWords} kata</span>
              </div>
            )}
            {characterLimit > 0 && (
              <div className="flex items-center justify-between">
                <span>Batas Karakter:</span>
                <span className="font-medium text-foreground">{characterLimit.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Rubrik:</span>
              <span className="font-medium text-foreground">
                {rubric ? '✓ Ada' : '✗ Tidak ada'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate essay settings
 */
export function validateEssay(settings: EssaySettings): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check min/max word count logic
  if (settings.maxWords && settings.minWords && settings.minWords > settings.maxWords) {
    errors.push('Maksimal kata harus lebih besar dari minimal kata');
  }
  
  // Check reasonable limits
  if (settings.minWords && settings.minWords > 5000) {
    errors.push('Minimal kata terlalu besar (maksimal 5000 kata)');
  }
  
  if (settings.maxWords && settings.maxWords > 10000) {
    errors.push('Maksimal kata terlalu besar (maksimal 10000 kata)');
  }
  
  if (settings.characterLimit && settings.characterLimit > 50000) {
    errors.push('Batas karakter terlalu besar (maksimal 50000 karakter)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get default essay settings
 */
export function getDefaultEssaySettings(): EssaySettings {
  return {
    minWords: DEFAULT_MIN_WORDS,
    maxWords: DEFAULT_MAX_WORDS,
    characterLimit: DEFAULT_CHARACTER_LIMIT,
    rubric: '',
  };
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Count characters in text
 */
export function countCharacters(text: string): number {
  return text.length;
}

/**
 * Check if essay meets word count requirements
 */
export function validateEssayAnswer(
  answer: string,
  settings: EssaySettings
): {
  isValid: boolean;
  wordCount: number;
  characterCount: number;
  errors: string[];
} {
  const wordCount = countWords(answer);
  const characterCount = countCharacters(answer);
  const errors: string[] = [];
  
  if (settings.minWords && wordCount < settings.minWords) {
    errors.push(`Minimal ${settings.minWords} kata (saat ini: ${wordCount} kata)`);
  }
  
  if (settings.maxWords && wordCount > settings.maxWords) {
    errors.push(`Maksimal ${settings.maxWords} kata (saat ini: ${wordCount} kata)`);
  }
  
  if (settings.characterLimit && characterCount > settings.characterLimit) {
    errors.push(`Maksimal ${settings.characterLimit} karakter (saat ini: ${characterCount} karakter)`);
  }
  
  return {
    isValid: errors.length === 0,
    wordCount,
    characterCount,
    errors,
  };
}