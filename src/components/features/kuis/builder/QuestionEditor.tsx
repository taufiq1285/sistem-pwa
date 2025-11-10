import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, AlertCircle } from 'lucide-react';

// Question type components
import { MultipleChoice, validateMultipleChoice, generateDefaultOptions } from '../question-types/MultipleChoice';
import { TrueFalse, validateTrueFalse } from '../question-types/TrueFalse';

// Types
import type { Soal, OpsiJawaban } from '@/types/kuis.types';
import { TIPE_SOAL, TIPE_SOAL_LABELS } from '@/types/kuis.types';

// Utils
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface QuestionEditorProps {
  /**
   * Kuis ID (required for creating questions)
   */
  kuisId: string;
  
  /**
   * Existing question data (for editing)
   */
  question?: Soal;
  
  /**
   * Question number/order
   */
  urutan: number;
  
  /**
   * Points for this question
   */
  defaultPoin?: number;
  
  /**
   * Callback when question is saved
   */
  onSave: (questionData: any) => void;
  
  /**
   * Callback when editing is cancelled
   */
  onCancel: () => void;
  
  /**
   * Show preview mode
   */
  showPreview?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuestionEditor({
  kuisId,
  question,
  urutan,
  defaultPoin = 1,
  onSave,
  onCancel,
}: QuestionEditorProps) {
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const isEditing = !!question;
  
  // Question type state
  const [questionType, setQuestionType] = useState<string>(
    question?.tipe_soal || TIPE_SOAL.PILIHAN_GANDA
  );
  
  // Basic question data
  const [pertanyaan, setPertanyaan] = useState(question?.pertanyaan || '');
  const [poin, setPoin] = useState(question?.poin || defaultPoin);
  const [penjelasan, setPenjelasan] = useState(question?.penjelasan || '');
  
  // Multiple choice state
  const [options, setOptions] = useState<OpsiJawaban[]>(
    question?.opsi_jawaban || generateDefaultOptions()
  );
  const [correctAnswerId, setCorrectAnswerId] = useState<string>(
    question?.opsi_jawaban?.find((opt: any) => opt.is_correct)?.id || ''
  );
  
  // True/False state
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<'true' | 'false' | undefined>(
    question?.jawaban_benar as 'true' | 'false' | undefined
  );
  
  // UI state
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  /**
   * Handle question type change
   */
  const handleTypeChange = (newType: string) => {
    setQuestionType(newType);
    setShowErrors(false);
    
    // Reset type-specific data
    if (newType === TIPE_SOAL.PILIHAN_GANDA) {
      setOptions(generateDefaultOptions());
      setCorrectAnswerId('');
    } else if (newType === TIPE_SOAL.BENAR_SALAH) {
      setTrueFalseAnswer(undefined);
    }
  };
  
  /**
   * Validate question data
   */
  const validateQuestion = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Basic validation
    if (!pertanyaan.trim()) {
      errors.push('Pertanyaan harus diisi');
    }
    if (pertanyaan.trim().length < 10) {
      errors.push('Pertanyaan minimal 10 karakter');
    }
    if (poin < 1) {
      errors.push('Poin minimal 1');
    }
    
    // Type-specific validation
    if (questionType === TIPE_SOAL.PILIHAN_GANDA) {
      const mcValidation = validateMultipleChoice(options);
      if (!mcValidation.isValid) {
        errors.push(...mcValidation.errors);
      }
    } else if (questionType === TIPE_SOAL.BENAR_SALAH) {
      const tfValidation = validateTrueFalse(trueFalseAnswer);
      if (!tfValidation.isValid) {
        errors.push(...tfValidation.errors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  };
  
  /**
   * Handle save question
   */
  const handleSave = () => {
    setShowErrors(true);
    
    const validation = validateQuestion();
    
    if (!validation.isValid) {
      return;
    }
    
    setIsSaving(true);
    
    // Prepare question data based on type
    const questionData: any = {
      kuis_id: kuisId,
      pertanyaan: pertanyaan.trim(),
      tipe_soal: questionType,
      poin,
      urutan,
      penjelasan: penjelasan.trim() || null,
    };
    
    // Add type-specific data
    if (questionType === TIPE_SOAL.PILIHAN_GANDA) {
      questionData.opsi_jawaban = options;
    } else if (questionType === TIPE_SOAL.BENAR_SALAH) {
      questionData.jawaban_benar = trueFalseAnswer;
    }
    
    // Add ID if editing
    if (isEditing && question?.id) {
      questionData.id = question.id;
    }
    
    // Call parent callback
    onSave(questionData);
    
    setIsSaving(false);
  };
  
  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setShowErrors(false);
    onCancel();
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  const validation = validateQuestion();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-3 py-1">
              Soal #{urutan}
            </Badge>
            <CardTitle className="text-xl">
              {isEditing ? 'Edit Soal' : 'Tambah Soal Baru'}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Menyimpan...' : 'Simpan Soal'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Question Type & Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Question Type */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="tipe_soal">
              Tipe Soal
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={questionType}
              onValueChange={handleTypeChange}
              disabled={isEditing}
            >
              <SelectTrigger id="tipe_soal">
                <SelectValue placeholder="Pilih tipe soal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIPE_SOAL.PILIHAN_GANDA}>
                  {TIPE_SOAL_LABELS.pilihan_ganda}
                </SelectItem>
                <SelectItem value={TIPE_SOAL.BENAR_SALAH}>
                  {TIPE_SOAL_LABELS.benar_salah}
                </SelectItem>
                {/* Future: Essay & Short Answer */}
              </SelectContent>
            </Select>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Tipe soal tidak dapat diubah saat edit
              </p>
            )}
          </div>
          
          {/* Points */}
          <div className="space-y-2">
            <Label htmlFor="poin">
              Poin
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="poin"
              type="number"
              min={1}
              max={100}
              value={poin}
              onChange={(e) => setPoin(Number(e.target.value))}
              className={cn(
                showErrors && poin < 1 && "border-destructive"
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="pertanyaan">
            Pertanyaan
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Textarea
            id="pertanyaan"
            placeholder="Tulis pertanyaan di sini..."
            rows={4}
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
            className={cn(
              showErrors && (!pertanyaan.trim() || pertanyaan.trim().length < 10) && "border-destructive"
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimal 10 karakter</span>
            <span>{pertanyaan.length} karakter</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Question Type Specific Fields */}
        <div>
          {questionType === TIPE_SOAL.PILIHAN_GANDA && (
            <MultipleChoice
              options={options}
              onChange={setOptions}
              correctAnswerId={correctAnswerId}
              onCorrectAnswerChange={setCorrectAnswerId}
              showErrors={showErrors}
            />
          )}
          
          {questionType === TIPE_SOAL.BENAR_SALAH && (
            <TrueFalse
              correctAnswer={trueFalseAnswer}
              onChange={setTrueFalseAnswer}
              showErrors={showErrors}
            />
          )}
        </div>
        
        <Separator />
        
        {/* Explanation (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="penjelasan">
            Penjelasan / Pembahasan <span className="text-muted-foreground">(Opsional)</span>
          </Label>
          <Textarea
            id="penjelasan"
            placeholder="Tambahkan penjelasan atau pembahasan untuk soal ini..."
            rows={3}
            value={penjelasan}
            onChange={(e) => setPenjelasan(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Penjelasan akan ditampilkan setelah mahasiswa menyelesaikan kuis
          </p>
        </div>
        
        {/* Validation Errors */}
        {showErrors && !validation.isValid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Harap perbaiki kesalahan berikut:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Action Buttons (Mobile) */}
        <div className="flex md:hidden gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Batal
          </Button>
          
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Soal'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform Soal data to editor format
 */
export function transformSoalToEditor(soal: Soal): any {
  return {
    ...soal,
    opsi_jawaban: soal.opsi_jawaban || generateDefaultOptions(),
  };
}

/**
 * Transform editor data to API format
 */
export function transformEditorToSoal(editorData: any): any {
  const data: any = {
    kuis_id: editorData.kuis_id,
    pertanyaan: editorData.pertanyaan,
    tipe_soal: editorData.tipe_soal,
    poin: editorData.poin,
    urutan: editorData.urutan,
    penjelasan: editorData.penjelasan,
  };
  
  if (editorData.tipe_soal === TIPE_SOAL.PILIHAN_GANDA) {
    data.opsi_jawaban = editorData.opsi_jawaban;
  } else if (editorData.tipe_soal === TIPE_SOAL.BENAR_SALAH) {
    data.jawaban_benar = editorData.jawaban_benar;
  }
  
  return data;
}