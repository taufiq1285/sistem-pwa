/**
 * ShortAnswer Question Type Component
 * 
 * Purpose: Short answer question input for quiz builder
 * Used by: QuestionEditor (Dosen)
 * Features: Expected answer, keywords, case-sensitive option, character limit
 */

import React, { useState } from 'react';
import { Type, Plus, X, Key, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ShortAnswerProps {
  /**
   * Expected/correct answer
   */
  expectedAnswer?: string;
  
  /**
   * Alternative acceptable answers
   */
  acceptedAnswers?: string[];
  
  /**
   * Keywords for partial credit (optional)
   */
  keywords?: string[];
  
  /**
   * Case sensitive matching
   */
  caseSensitive?: boolean;
  
  /**
   * Maximum character length
   */
  maxLength?: number;
  
  /**
   * Callback when settings change
   */
  onChange: (settings: ShortAnswerSettings) => void;
  
  /**
   * Disabled state (for view mode)
   */
  disabled?: boolean;
  
  /**
   * Show validation errors
   */
  showErrors?: boolean;
}

export interface ShortAnswerSettings {
  expectedAnswer: string;
  acceptedAnswers: string[];
  keywords: string[];
  caseSensitive: boolean;
  maxLength: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_LENGTH = 200;
const MAX_ACCEPTED_ANSWERS = 10;
const MAX_KEYWORDS = 15;

// ============================================================================
// COMPONENT
// ============================================================================

export function ShortAnswer({
  expectedAnswer = '',
  acceptedAnswers = [],
  keywords = [],
  caseSensitive = false,
  maxLength = DEFAULT_MAX_LENGTH,
  onChange,
  disabled = false,
  showErrors = false,
}: ShortAnswerProps) {
  
  // Local state for input fields
  const [newAcceptedAnswer, setNewAcceptedAnswer] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  
  // ============================================================================
  // HANDLERS - EXPECTED ANSWER
  // ============================================================================
  
  /**
   * Handle expected answer change
   */
  const handleExpectedAnswerChange = (value: string) => {
    onChange({
      expectedAnswer: value,
      acceptedAnswers,
      keywords,
      caseSensitive,
      maxLength,
    });
  };
  
  // ============================================================================
  // HANDLERS - ACCEPTED ANSWERS
  // ============================================================================
  
  /**
   * Add accepted answer
   */
  const handleAddAcceptedAnswer = () => {
    if (!newAcceptedAnswer.trim()) return;
    if (acceptedAnswers.length >= MAX_ACCEPTED_ANSWERS) return;
    
    const trimmed = newAcceptedAnswer.trim();
    
    // Check for duplicates
    const isDuplicate = acceptedAnswers.some(
      (ans) => ans.toLowerCase() === trimmed.toLowerCase()
    );
    
    if (isDuplicate) {
      return;
    }
    
    onChange({
      expectedAnswer,
      acceptedAnswers: [...acceptedAnswers, trimmed],
      keywords,
      caseSensitive,
      maxLength,
    });
    
    setNewAcceptedAnswer('');
  };
  
  /**
   * Remove accepted answer
   */
  const handleRemoveAcceptedAnswer = (index: number) => {
    onChange({
      expectedAnswer,
      acceptedAnswers: acceptedAnswers.filter((_, i) => i !== index),
      keywords,
      caseSensitive,
      maxLength,
    });
  };
  
  // ============================================================================
  // HANDLERS - KEYWORDS
  // ============================================================================
  
  /**
   * Add keyword
   */
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    if (keywords.length >= MAX_KEYWORDS) return;
    
    const trimmed = newKeyword.trim();
    
    // Check for duplicates
    const isDuplicate = keywords.some(
      (kw) => kw.toLowerCase() === trimmed.toLowerCase()
    );
    
    if (isDuplicate) {
      return;
    }
    
    onChange({
      expectedAnswer,
      acceptedAnswers,
      keywords: [...keywords, trimmed],
      caseSensitive,
      maxLength,
    });
    
    setNewKeyword('');
  };
  
  /**
   * Remove keyword
   */
  const handleRemoveKeyword = (index: number) => {
    onChange({
      expectedAnswer,
      acceptedAnswers,
      keywords: keywords.filter((_, i) => i !== index),
      caseSensitive,
      maxLength,
    });
  };
  
  // ============================================================================
  // HANDLERS - SETTINGS
  // ============================================================================
  
  /**
   * Toggle case sensitive
   */
  const handleCaseSensitiveToggle = (checked: boolean) => {
    onChange({
      expectedAnswer,
      acceptedAnswers,
      keywords,
      caseSensitive: checked,
      maxLength,
    });
  };
  
  /**
   * Handle max length change
   */
  const handleMaxLengthChange = (value: string) => {
    const num = parseInt(value) || DEFAULT_MAX_LENGTH;
    onChange({
      expectedAnswer,
      acceptedAnswers,
      keywords,
      caseSensitive,
      maxLength: num,
    });
  };
  
  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  const hasExpectedAnswer = expectedAnswer.trim().length > 0;
  const canAddMoreAcceptedAnswers = acceptedAnswers.length < MAX_ACCEPTED_ANSWERS;
  const canAddMoreKeywords = keywords.length < MAX_KEYWORDS;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Type className="h-5 w-5 text-primary" />
        <div>
          <Label className="text-base font-semibold">Pengaturan Jawaban Singkat</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Atur jawaban yang diterima dan kata kunci untuk penilaian otomatis
          </p>
        </div>
      </div>
      
      {/* Expected Answer */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expectedAnswer" className="text-sm font-medium">
              Jawaban yang Diharapkan
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="expectedAnswer"
              value={expectedAnswer}
              onChange={(e) => handleExpectedAnswerChange(e.target.value)}
              disabled={disabled}
              placeholder="Contoh: Mitokondria"
              maxLength={maxLength}
              className={cn(
                showErrors && !hasExpectedAnswer && "border-destructive"
              )}
            />
            <p className="text-xs text-muted-foreground">
              Jawaban utama yang akan diterima sebagai benar
            </p>
            
            {showErrors && !hasExpectedAnswer && (
              <p className="text-sm text-destructive">
                ⚠️ Jawaban yang diharapkan harus diisi
              </p>
            )}
            
            {expectedAnswer && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {expectedAnswer.length} / {maxLength} karakter
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Accepted Answers */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Jawaban Alternatif <span className="text-muted-foreground">(Opsional)</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Variasi jawaban lain yang juga diterima sebagai benar
                </p>
              </div>
              <Badge variant="outline">
                {acceptedAnswers.length} / {MAX_ACCEPTED_ANSWERS}
              </Badge>
            </div>
            
            {/* Add Accepted Answer Input */}
            <div className="flex gap-2">
              <Input
                value={newAcceptedAnswer}
                onChange={(e) => setNewAcceptedAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddAcceptedAnswer()}
                disabled={disabled || !canAddMoreAcceptedAnswers}
                placeholder="Contoh: Powerhouse of the cell"
                maxLength={maxLength}
              />
              <Button
                type="button"
                onClick={handleAddAcceptedAnswer}
                disabled={disabled || !newAcceptedAnswer.trim() || !canAddMoreAcceptedAnswers}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Accepted Answers List */}
            {acceptedAnswers.length > 0 && (
              <div className="space-y-2">
                {acceptedAnswers.map((answer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="text-sm">{answer}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAcceptedAnswer(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {!canAddMoreAcceptedAnswers && (
              <p className="text-xs text-muted-foreground">
                Maksimal {MAX_ACCEPTED_ANSWERS} jawaban alternatif
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Keywords for Partial Credit */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Kata Kunci (Partial Credit) <span className="text-muted-foreground">(Opsional)</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Kata kunci untuk memberikan poin parsial jika jawaban tidak sepenuhnya benar
                </p>
              </div>
              <Badge variant="outline">
                {keywords.length} / {MAX_KEYWORDS}
              </Badge>
            </div>
            
            {/* Add Keyword Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  disabled={disabled || !canAddMoreKeywords}
                  placeholder="Contoh: energi, ATP, sel"
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddKeyword}
                disabled={disabled || !newKeyword.trim() || !canAddMoreKeywords}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Keywords List */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="gap-2 pr-1"
                  >
                    <Key className="h-3 w-3" />
                    {keyword}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveKeyword(index)}
                      disabled={disabled}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            {!canAddMoreKeywords && (
              <p className="text-xs text-muted-foreground">
                Maksimal {MAX_KEYWORDS} kata kunci
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Settings */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-4">
            {/* Case Sensitive */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="caseSensitive" className="text-sm font-medium">
                  Case Sensitive
                </Label>
                <p className="text-xs text-muted-foreground">
                  Membedakan huruf besar/kecil (Mitokondria ≠ mitokondria)
                </p>
              </div>
              <Switch
                id="caseSensitive"
                checked={caseSensitive}
                onCheckedChange={handleCaseSensitiveToggle}
                disabled={disabled}
              />
            </div>
            
            {/* Max Length */}
            <div className="space-y-2">
              <Label htmlFor="maxLength" className="text-sm font-medium">
                Panjang Maksimal (Karakter)
              </Label>
              <Input
                id="maxLength"
                type="number"
                min={10}
                max={1000}
                value={maxLength}
                onChange={(e) => handleMaxLengthChange(e.target.value)}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Jumlah karakter maksimal untuk jawaban mahasiswa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Auto-Grading:</strong> Sistem akan otomatis menilai jawaban mahasiswa 
          berdasarkan kecocokan dengan jawaban yang diharapkan atau kata kunci yang ditentukan.
        </AlertDescription>
      </Alert>
      
      {/* Preview Settings */}
      {!disabled && (
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Preview Pengaturan</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Tipe Soal:</span>
              <Badge>Jawaban Singkat</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Jawaban Utama:</span>
              <span className="font-medium text-foreground">
                {expectedAnswer || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Alternatif:</span>
              <span className="font-medium text-foreground">
                {acceptedAnswers.length} jawaban
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Kata Kunci:</span>
              <span className="font-medium text-foreground">
                {keywords.length} kata
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Case Sensitive:</span>
              <span className="font-medium text-foreground">
                {caseSensitive ? '✓ Ya' : '✗ Tidak'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Max. Karakter:</span>
              <span className="font-medium text-foreground">{maxLength}</span>
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
 * Validate short answer settings
 */
export function validateShortAnswer(settings: ShortAnswerSettings): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!settings.expectedAnswer.trim()) {
    errors.push('Jawaban yang diharapkan harus diisi');
  }
  
  if (settings.maxLength < 10) {
    errors.push('Panjang maksimal minimal 10 karakter');
  }
  
  if (settings.maxLength > 1000) {
    errors.push('Panjang maksimal terlalu besar (maksimal 1000 karakter)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get default short answer settings
 */
export function getDefaultShortAnswerSettings(): ShortAnswerSettings {
  return {
    expectedAnswer: '',
    acceptedAnswers: [],
    keywords: [],
    caseSensitive: false,
    maxLength: DEFAULT_MAX_LENGTH,
  };
}

/**
 * Check if answer matches expected answer
 */
export function checkShortAnswer(
  studentAnswer: string,
  settings: ShortAnswerSettings
): {
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  matchedKeywords: string[];
  score: number; // 0-100
} {
  const { expectedAnswer, acceptedAnswers, keywords, caseSensitive } = settings;
  
  // Normalize answers for comparison
  const normalize = (text: string) => 
    caseSensitive ? text.trim() : text.trim().toLowerCase();
  
  const normalizedStudentAnswer = normalize(studentAnswer);
  const normalizedExpectedAnswer = normalize(expectedAnswer);
  const normalizedAcceptedAnswers = acceptedAnswers.map(normalize);
  
  // Check exact match
  if (normalizedStudentAnswer === normalizedExpectedAnswer) {
    return {
      isCorrect: true,
      isPartiallyCorrect: false,
      matchedKeywords: [],
      score: 100,
    };
  }
  
  // Check accepted answers
  if (normalizedAcceptedAnswers.includes(normalizedStudentAnswer)) {
    return {
      isCorrect: true,
      isPartiallyCorrect: false,
      matchedKeywords: [],
      score: 100,
    };
  }
  
  // Check keywords for partial credit
  if (keywords.length > 0) {
    const matchedKeywords = keywords.filter((keyword) => {
      const normalizedKeyword = normalize(keyword);
      return normalizedStudentAnswer.includes(normalizedKeyword);
    });
    
    if (matchedKeywords.length > 0) {
      const partialScore = Math.round((matchedKeywords.length / keywords.length) * 50);
      return {
        isCorrect: false,
        isPartiallyCorrect: true,
        matchedKeywords,
        score: partialScore,
      };
    }
  }
  
  // No match
  return {
    isCorrect: false,
    isPartiallyCorrect: false,
    matchedKeywords: [],
    score: 0,
  };
}