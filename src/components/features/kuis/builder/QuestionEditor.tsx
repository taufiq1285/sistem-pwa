import { useState, useEffect } from "react";
import type { CreateSoalData, UpdateSoalData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save,
  X,
  AlertCircle,
  Database,
  Upload,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";

// Question type components
import {
  MultipleChoice,
  validateMultipleChoice,
  generateDefaultOptions,
} from "../question-types/MultipleChoice";
import {
  Essay,
  validateEssay,
  getDefaultEssaySettings,
  type EssaySettings,
} from "../question-types/Essay";
import {
  FileUploadQuestion,
  validateFileUploadSettings,
  getDefaultFileUploadSettings,
  type FileUploadSettings,
} from "../question-types/FileUploadQuestion";

// Types
import type { Soal, OpsiJawaban } from "@/types/kuis.types";
import { TIPE_SOAL, TIPE_SOAL_LABELS } from "@/types/kuis.types";

// Utils
import { cn } from "@/lib/utils";
import { checkDuplicateBankSoal } from "@/lib/api/bank-soal.api";

// ============================================================================
// TYPES
// ============================================================================

interface QuestionEditorProps {
  /**
   * Kuis ID (required for creating questions)
   */
  kuisId: string;

  /**
   * Dosen ID (for duplicate check)
   */
  dosenId: string;

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
   * CBT Mode - only multiple choice (for Tes)
   */
  cbtMode?: boolean;

  /**
   * Laporan Mode - only essay/upload (for Laporan)
   */
  laporanMode?: boolean;

  /**
   * Callback when question is saved
   */
  onSave: (questionData: CreateSoalData | UpdateSoalData) => void;

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
  dosenId,
  question,
  urutan,
  defaultPoin = 1,
  cbtMode = false,
  laporanMode = false,
  onSave,
  onCancel,
}: QuestionEditorProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const isEditing = !!question;

  // Determine default type based on mode
  const getDefaultType = () => {
    if (cbtMode) return TIPE_SOAL.PILIHAN_GANDA;
    if (laporanMode) return TIPE_SOAL.ESSAY;
    return question?.tipe_soal || TIPE_SOAL.PILIHAN_GANDA;
  };

  // Question type state
  const [questionType, setQuestionType] = useState<string>(
    question?.tipe_soal || getDefaultType(),
  );

  // Basic question data
  const [pertanyaan, setPertanyaan] = useState(question?.pertanyaan || "");
  // ✅ FIX: Default poin 100 untuk FILE_UPLOAD (karena DB constraint poin > 0)
  const [poin, setPoin] = useState(
    question?.poin ||
      (question?.tipe_soal === TIPE_SOAL.FILE_UPLOAD || getDefaultType() === TIPE_SOAL.FILE_UPLOAD
        ? 100
        : defaultPoin)
  );
  const [penjelasan, setPenjelasan] = useState(question?.penjelasan || "");

  // Multiple choice state
  const [options, setOptions] = useState<OpsiJawaban[]>(
    question?.opsi_jawaban || generateDefaultOptions(),
  );
  const [correctAnswerId, setCorrectAnswerId] = useState<string>(
    question?.opsi_jawaban?.find((opt: OpsiJawaban) => opt.is_correct)?.id ||
      "",
  );

  // Essay state
  const [essaySettings, setEssaySettings] = useState<EssaySettings>(
    question?.tipe_soal === TIPE_SOAL.ESSAY && question?.jawaban_benar
      ? JSON.parse(question.jawaban_benar as string)
      : getDefaultEssaySettings(),
  );
  // File Upload state
  const [fileUploadSettings, setFileUploadSettings] =
    useState<FileUploadSettings>(
      question?.tipe_soal === TIPE_SOAL.FILE_UPLOAD && question?.jawaban_benar
        ? JSON.parse(question.jawaban_benar as string)
        : getDefaultFileUploadSettings(),
    );
  // Bank Soal state - Default true (auto-save), only show for new questions
  const [saveToBank, setSaveToBank] = useState(true);

  // Duplicate detection state
  const [duplicateQuestions, setDuplicateQuestions] = useState<any[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // UI state
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Check for duplicates when pertanyaan changes (debounced)
   */
  useEffect(() => {
    if (
      !saveToBank ||
      isEditing ||
      !pertanyaan.trim() ||
      pertanyaan.length < 10
    ) {
      setDuplicateQuestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingDuplicates(true);
      try {
        const duplicates = await checkDuplicateBankSoal(
          pertanyaan,
          dosenId,
          questionType as any,
        );
        setDuplicateQuestions(duplicates);
      } catch (error) {
        console.error("Error checking duplicates:", error);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [pertanyaan, questionType, saveToBank, isEditing, dosenId]);

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
      setCorrectAnswerId("");
    } else if (newType === TIPE_SOAL.ESSAY) {
      setEssaySettings(getDefaultEssaySettings());
    } else if (newType === TIPE_SOAL.FILE_UPLOAD) {
      setFileUploadSettings(getDefaultFileUploadSettings());
    }
  };

  /**
   * Validate question data
   */
  const validateQuestion = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Basic validation
    if (!pertanyaan.trim()) {
      errors.push("Pertanyaan harus diisi");
    }
    if (pertanyaan.trim().length < 10) {
      errors.push("Pertanyaan minimal 10 karakter");
    }

    // ✅ Poin wajib untuk PILIHAN_GANDA dan ESSAY
    // FILE_UPLOAD pakai default 100 (bisa diubah saat penilaian)
    if (questionType !== TIPE_SOAL.FILE_UPLOAD && poin < 1) {
      errors.push("Poin minimal 1");
    }

    // Type-specific validation
    if (questionType === TIPE_SOAL.PILIHAN_GANDA) {
      const mcValidation = validateMultipleChoice(options);
      if (!mcValidation.isValid) {
        errors.push(...mcValidation.errors);
      }
    } else if (questionType === TIPE_SOAL.ESSAY) {
      const essayValidation = validateEssay(essaySettings);
      if (!essayValidation.isValid) {
        errors.push(...essayValidation.errors);
      }
    } else if (questionType === TIPE_SOAL.FILE_UPLOAD) {
      const fileUploadValidation =
        validateFileUploadSettings(fileUploadSettings);
      if (!fileUploadValidation.isValid) {
        errors.push(...fileUploadValidation.errors);
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
    const questionData: Partial<CreateSoalData> & {
      id?: string;
      saveToBank?: boolean;
    } = {
      kuis_id: kuisId,
      pertanyaan: pertanyaan.trim(),
      tipe_soal: questionType as any,
      poin,
      urutan,
      penjelasan: (penjelasan.trim() || null) as any,
      saveToBank: !isEditing && saveToBank, // Only save to bank for new questions
    };

    // Add type-specific data
    if (questionType === TIPE_SOAL.PILIHAN_GANDA) {
      questionData.opsi_jawaban = options;
    } else if (questionType === TIPE_SOAL.ESSAY) {
      questionData.jawaban_benar = JSON.stringify(essaySettings);
    } else if (questionType === TIPE_SOAL.FILE_UPLOAD) {
      questionData.jawaban_benar = JSON.stringify(fileUploadSettings);
    }

    // Add ID if editing
    if (isEditing && question?.id) {
      questionData.id = question.id;
    }

    // Call parent callback
    onSave(questionData as any);

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
              {isEditing ? "Edit Soal" : "Buat Soal Baru"}
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
              {isSaving ? "Menyimpan..." : "Simpan Soal"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Type & Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Question Type - CBT mode only shows Pilihan Ganda, Laporan mode shows Essay/Upload */}
          {cbtMode ? (
            <div className="md:col-span-2 space-y-2">
              <Label>Tipe Soal</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                <CheckSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Pilihan Ganda (CBT)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Mode CBT hanya mendukung soal pilihan ganda
              </p>
            </div>
          ) : laporanMode ? (
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
                  <SelectItem value={TIPE_SOAL.ESSAY}>
                    {TIPE_SOAL_LABELS.essay}
                  </SelectItem>
                  <SelectItem value={TIPE_SOAL.FILE_UPLOAD}>
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-orange-500" />
                      {TIPE_SOAL_LABELS.file_upload}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Mode Laporan mendukung essay atau upload file
              </p>
            </div>
          ) : (
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
                  <SelectItem value={TIPE_SOAL.ESSAY}>
                    {TIPE_SOAL_LABELS.essay}
                  </SelectItem>
                  <SelectItem value={TIPE_SOAL.FILE_UPLOAD}>
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-orange-500" />
                      {TIPE_SOAL_LABELS.file_upload}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Tipe soal tidak dapat diubah saat edit
                </p>
              )}
            </div>
          )}

          {/* Points */}
          <div className="space-y-2">
            <Label htmlFor="poin">
              Poin
              {questionType !== TIPE_SOAL.FILE_UPLOAD && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            <Input
              id="poin"
              type="number"
              min={1}
              max={100}
              value={poin}
              onChange={(e) => setPoin(Number(e.target.value))}
              className={cn(
                showErrors && questionType !== TIPE_SOAL.FILE_UPLOAD && poin < 1 && "border-destructive"
              )}
            />
            {questionType === TIPE_SOAL.FILE_UPLOAD && (
              <p className="text-xs text-muted-foreground">
                💡 Poin default 100. Dosen bisa menyesuaikan nilai saat penilaian laporan.
              </p>
            )}
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
              showErrors &&
                (!pertanyaan.trim() || pertanyaan.trim().length < 10) &&
                "border-destructive",
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimal 10 karakter</span>
            <span>{pertanyaan.length} karakter</span>
          </div>

          {/* Duplicate Warning */}
          {isCheckingDuplicates && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Memeriksa soal duplikat di bank soal...
              </AlertDescription>
            </Alert>
          )}

          {!isCheckingDuplicates &&
            duplicateQuestions.length > 0 &&
            saveToBank && (
              <Alert
                variant="destructive"
                className="border-orange-500 bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900">
                  <div className="font-semibold mb-2">
                    ⚠️ Ditemukan {duplicateQuestions.length} soal serupa di bank
                    soal!
                  </div>
                  <div className="text-sm space-y-1">
                    {duplicateQuestions.slice(0, 2).map((dup, idx) => (
                      <div
                        key={idx}
                        className="pl-4 border-l-2 border-orange-300"
                      >
                        "{dup.pertanyaan.substring(0, 80)}..."
                      </div>
                    ))}
                    {duplicateQuestions.length > 2 && (
                      <div className="text-xs italic">
                        Dan {duplicateQuestions.length - 2} soal lainnya...
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm">
                    <strong>Rekomendasi:</strong> Gunakan soal dari bank soal
                    atau ubah pertanyaan agar tidak duplikat.
                  </div>
                </AlertDescription>
              </Alert>
            )}
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

          {questionType === TIPE_SOAL.ESSAY && (
            <Essay
              minWords={essaySettings.minWords}
              maxWords={essaySettings.maxWords}
              characterLimit={essaySettings.characterLimit}
              rubric={essaySettings.rubric}
              onChange={setEssaySettings}
              showErrors={showErrors}
            />
          )}

          {questionType === TIPE_SOAL.FILE_UPLOAD && (
            <FileUploadQuestion
              settings={fileUploadSettings}
              onChange={setFileUploadSettings}
              showErrors={showErrors}
            />
          )}
        </div>

        <Separator />

        {/* Explanation (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="penjelasan">
            Penjelasan / Pembahasan{" "}
            <span className="text-muted-foreground">(Opsional)</span>
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

        {/* Save to Bank Soal - Only for new questions and PILIHAN_GANDA type */}
        {!isEditing && kuisId !== "bank" && questionType === TIPE_SOAL.PILIHAN_GANDA && (
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
            <Checkbox
              id="saveToBank"
              checked={saveToBank}
              onCheckedChange={(checked) => setSaveToBank(checked as boolean)}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="saveToBank"
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Simpan ke Bank Soal
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Soal akan disimpan ke Bank Soal agar dapat digunakan kembali
                untuk kuis lain di masa depan. Sangat disarankan untuk soal-soal
                fundamental yang sering dipakai.
              </p>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {showErrors && !validation.isValid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">
                Harap perbaiki kesalahan berikut:
              </div>
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
            {isSaving ? "Menyimpan..." : "Simpan Soal"}
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
export function transformSoalToEditor(soal: Soal): Partial<Soal> {
  return {
    ...soal,
    opsi_jawaban: soal.opsi_jawaban || generateDefaultOptions(),
  };
}

/**
 * Transform editor data to API format
 */
export function transformEditorToSoal(
  editorData: Partial<CreateSoalData>,
): Partial<CreateSoalData> {
  const data: Partial<CreateSoalData> = {
    kuis_id: editorData.kuis_id,
    pertanyaan: editorData.pertanyaan,
    tipe_soal: editorData.tipe_soal,
    poin: editorData.poin,
    urutan: editorData.urutan,
    penjelasan: editorData.penjelasan,
  };

  if (editorData.tipe_soal === TIPE_SOAL.PILIHAN_GANDA) {
    data.opsi_jawaban = editorData.opsi_jawaban;
  } else if (editorData.tipe_soal === TIPE_SOAL.ESSAY) {
    data.jawaban_benar = editorData.jawaban_benar;
  } else if (editorData.tipe_soal === TIPE_SOAL.FILE_UPLOAD) {
    data.jawaban_benar = editorData.jawaban_benar;
  }

  return data;
}
