/**
 * FileUploadQuestion Component
 *
 * Purpose: Question type for file upload (laporan praktikum)
 * Used by: QuestionEditor (dosen), QuizAttempt (mahasiswa)
 * Features: Configure accepted file types, max size, instructions
 */

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Image, FileArchive, Upload, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface FileUploadSettings {
  /**
   * Instructions for students
   */
  instructions: string;

  /**
   * Accepted file types
   */
  acceptedTypes: {
    pdf: boolean;
    word: boolean;
    image: boolean;
    zip: boolean;
  };

  /**
   * Max file size in MB
   */
  maxSizeMB: number;

  /**
   * Required file name pattern (optional)
   */
  fileNamePattern?: string;

  /**
   * Allow multiple files
   */
  allowMultiple: boolean;

  /**
   * Rubric for grading
   */
  rubric?: string;
}

interface FileUploadQuestionProps {
  /**
   * Current settings
   */
  settings: FileUploadSettings;

  /**
   * Callback when settings change
   */
  onChange: (settings: FileUploadSettings) => void;

  /**
   * Show validation errors
   */
  showErrors?: boolean;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export function getDefaultFileUploadSettings(): FileUploadSettings {
  return {
    instructions:
      "Upload file laporan praktikum Anda dalam format PDF atau Word.",
    acceptedTypes: {
      pdf: true,
      word: true,
      image: false,
      zip: false,
    },
    maxSizeMB: 10,
    allowMultiple: false,
    rubric: "",
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateFileUploadSettings(settings: FileUploadSettings): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check instructions
  if (!settings.instructions.trim()) {
    errors.push("Instruksi harus diisi");
  }

  // Check at least one file type is selected
  const hasAcceptedType = Object.values(settings.acceptedTypes).some(Boolean);
  if (!hasAcceptedType) {
    errors.push("Pilih minimal satu tipe file yang diterima");
  }

  // Check max size
  if (settings.maxSizeMB < 1) {
    errors.push("Ukuran maksimal minimal 1 MB");
  }
  if (settings.maxSizeMB > 20) {
    errors.push("Ukuran maksimal tidak boleh lebih dari 20 MB");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// HELPER
// ============================================================================

export function getAcceptString(
  types: FileUploadSettings["acceptedTypes"]
): string {
  const accepts: string[] = [];

  if (types.pdf) {
    accepts.push(".pdf", "application/pdf");
  }
  if (types.word) {
    accepts.push(
      ".doc",
      ".docx",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  }
  if (types.image) {
    accepts.push(".jpg", ".jpeg", ".png", "image/jpeg", "image/png");
  }
  if (types.zip) {
    accepts.push(".zip", "application/zip");
  }

  return accepts.join(",");
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FileUploadQuestion({
  settings,
  onChange,
  showErrors = false,
}: FileUploadQuestionProps) {
  const validation = validateFileUploadSettings(settings);

  const updateSettings = (updates: Partial<FileUploadSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const updateAcceptedType = (
    type: keyof FileUploadSettings["acceptedTypes"],
    checked: boolean
  ) => {
    onChange({
      ...settings,
      acceptedTypes: {
        ...settings.acceptedTypes,
        [type]: checked,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Upload className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-orange-900">
            Upload File (Laporan)
          </h3>
          <p className="text-sm text-orange-700">
            Mahasiswa dapat mengupload file laporan praktikum
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <Label htmlFor="instructions">
          Instruksi untuk Mahasiswa
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Textarea
          id="instructions"
          placeholder="Contoh: Upload file laporan praktikum dalam format PDF. Nama file: NIM_NamaPraktikum.pdf"
          rows={3}
          value={settings.instructions}
          onChange={(e) => updateSettings({ instructions: e.target.value })}
          className={cn(
            showErrors && !settings.instructions.trim() && "border-destructive"
          )}
        />
        <p className="text-xs text-muted-foreground">
          Jelaskan format file, penamaan, dan ketentuan lainnya
        </p>
      </div>

      {/* Accepted File Types */}
      <div className="space-y-3">
        <Label>
          Tipe File yang Diterima
          <span className="text-destructive ml-1">*</span>
        </Label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* PDF */}
          <label
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              settings.acceptedTypes.pdf
                ? "bg-red-50 border-red-200"
                : "hover:bg-muted/50"
            )}
          >
            <Checkbox
              checked={settings.acceptedTypes.pdf}
              onCheckedChange={(checked) =>
                updateAcceptedType("pdf", checked as boolean)
              }
            />
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">PDF</span>
            </div>
          </label>

          {/* Word */}
          <label
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              settings.acceptedTypes.word
                ? "bg-blue-50 border-blue-200"
                : "hover:bg-muted/50"
            )}
          >
            <Checkbox
              checked={settings.acceptedTypes.word}
              onCheckedChange={(checked) =>
                updateAcceptedType("word", checked as boolean)
              }
            />
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Word</span>
            </div>
          </label>

          {/* Image */}
          <label
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              settings.acceptedTypes.image
                ? "bg-green-50 border-green-200"
                : "hover:bg-muted/50"
            )}
          >
            <Checkbox
              checked={settings.acceptedTypes.image}
              onCheckedChange={(checked) =>
                updateAcceptedType("image", checked as boolean)
              }
            />
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Gambar</span>
            </div>
          </label>

          {/* ZIP */}
          <label
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              settings.acceptedTypes.zip
                ? "bg-yellow-50 border-yellow-200"
                : "hover:bg-muted/50"
            )}
          >
            <Checkbox
              checked={settings.acceptedTypes.zip}
              onCheckedChange={(checked) =>
                updateAcceptedType("zip", checked as boolean)
              }
            />
            <div className="flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">ZIP</span>
            </div>
          </label>
        </div>

        {showErrors && !Object.values(settings.acceptedTypes).some(Boolean) && (
          <p className="text-sm text-destructive">
            Pilih minimal satu tipe file
          </p>
        )}
      </div>

      {/* Max File Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxSize">
            Ukuran Maksimal File (MB)
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="maxSize"
            type="number"
            min={1}
            max={20}
            value={settings.maxSizeMB}
            onChange={(e) =>
              updateSettings({ maxSizeMB: Number(e.target.value) })
            }
            className={cn(
              showErrors &&
                (settings.maxSizeMB < 1 || settings.maxSizeMB > 20) &&
                "border-destructive"
            )}
          />
          <p className="text-xs text-muted-foreground">Maksimal 20 MB</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fileNamePattern">Pola Nama File (Opsional)</Label>
          <Input
            id="fileNamePattern"
            placeholder="Contoh: NIM_NamaPraktikum"
            value={settings.fileNamePattern || ""}
            onChange={(e) =>
              updateSettings({ fileNamePattern: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            Saran format nama file untuk mahasiswa
          </p>
        </div>
      </div>

      {/* Rubric */}
      <div className="space-y-2">
        <Label htmlFor="rubric">Rubrik Penilaian (Opsional)</Label>
        <Textarea
          id="rubric"
          placeholder="Contoh:&#10;- Kelengkapan isi: 40%&#10;- Format penulisan: 30%&#10;- Analisis data: 30%"
          rows={4}
          value={settings.rubric || ""}
          onChange={(e) => updateSettings({ rubric: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Kriteria penilaian untuk membantu dosen menilai laporan
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Catatan:</strong> Soal tipe upload file memerlukan penilaian
          manual oleh dosen. Nilai tidak akan otomatis dihitung seperti soal
          pilihan ganda.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default FileUploadQuestion;
